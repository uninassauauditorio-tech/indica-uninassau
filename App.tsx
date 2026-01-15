import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './components/Auth';
import { Indicacao, ReferralStatus, Usuario, Candidato, getStatusColor, maskCPF, maskPhone } from './types';
import { supabase } from './lib/supabaseClient';
import ReferralTable from './components/ReferralTable';
import { COURSES } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [referrals, setReferrals] = useState<Indicacao[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReferral, setSelectedReferral] = useState<Indicacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', curso: '' });

  // New Referral Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCourse, setFormCourse] = useState('');

  // Admin Form State
  const [adminCpf, setAdminCpf] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchReferrals();
    }
  }, [currentUser]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, create one automatically as 'funcionario'
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const emailPrefix = user.email?.split('@')[0] || 'Usuário';
        const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

        const { data: newData, error: insertError } = await supabase
          .from('usuarios')
          .insert([{
            id: userId,
            nome: formattedName,
            perfil: 'funcionario'
          }])
          .select()
          .single();

        if (!insertError) {
          setCurrentUser(newData);
        }
      }
    } else {
      setCurrentUser(data);
    }
    setLoading(false);
  };

  const fetchReferrals = async () => {
    let query = supabase
      .from('indicacoes')
      .select(`
        *,
        candidatos (*),
        funcionarios (
          *,
          usuarios (*)
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching referrals:', error);
    } else {
      setReferrals(data || []);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      // 1. Get funcionario record
      const { data: funcData, error: funcError } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('usuario_id', currentUser.id)
        .single();

      if (funcError) throw funcError;

      // 2. Create candidato
      const { data: candData, error: candError } = await supabase
        .from('candidatos')
        .insert([{
          nome_completo: formName,
          telefone: formPhone,
          curso_interesse: formCourse
        }])
        .select()
        .single();

      if (candError) throw candError;

      // 3. Create indicacao
      const { error: indError } = await supabase
        .from('indicacoes')
        .insert([{
          candidato_id: candData.id,
          funcionario_id: funcData.id,
          status: ReferralStatus.RECEIVED
        }]);

      if (indError) throw indError;

      alert('Indicação realizada com sucesso!');
      setFormName('');
      setFormPhone('');
      setFormCourse('');
      fetchReferrals();
      setActiveTab('dashboard');
    } catch (err: any) {
      alert('Erro ao criar indicação: ' + err.message);
    }
  };

  const handleUpdateStatus = async (newStatus: ReferralStatus) => {
    if (!selectedReferral) return;

    try {
      // If status is ENROLLED, CPF is mandatory
      if (newStatus === ReferralStatus.ENROLLED && !adminCpf) {
        alert('O CPF é obrigatório para o status Matriculado.');
        return;
      }

      // Update candidato CPF if provided
      if (adminCpf) {
        const { error: candError } = await supabase
          .from('candidatos')
          .update({ cpf: adminCpf })
          .eq('id', selectedReferral.candidato_id);

        if (candError) throw candError;
      }

      // Update indicacao status
      const { error: indError } = await supabase
        .from('indicacoes')
        .update({ status: newStatus })
        .eq('id', selectedReferral.id);

      if (indError) throw indError;

      alert('Status atualizado com sucesso!');
      fetchReferrals();
      // Update local selected referral
      setSelectedReferral({ ...selectedReferral, status: newStatus });
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleDeleteReferral = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta indicação permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('indicacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Indicação excluída com sucesso!');
      fetchReferrals();
      if (selectedReferral?.id === id) {
        setActiveTab('referrals');
        setSelectedReferral(null);
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleEditReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      const { error: candError } = await supabase
        .from('candidatos')
        .update({
          nome_completo: editForm.nome,
          telefone: editForm.telefone,
          curso_interesse: editForm.curso
        })
        .eq('id', selectedReferral.candidato_id);

      if (candError) throw candError;

      alert('Dados atualizados com sucesso!');
      setIsEditing(false);
      fetchReferrals();
      // Update local state
      setSelectedReferral({
        ...selectedReferral,
        candidatos: {
          ...selectedReferral.candidatos!,
          nome_completo: editForm.nome,
          telefone: editForm.telefone,
          curso_interesse: editForm.curso
        }
      });
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => { }} />;
  }

  const renderDashboard = () => {
    const stats = {
      total: referrals.length,
      enrolled: referrals.filter(r => r.status === ReferralStatus.ENROLLED).length,
      contacted: referrals.filter(r => r.status === ReferralStatus.CONTACTED).length,
      conversion: Math.round((referrals.filter(r => r.status === ReferralStatus.ENROLLED).length / referrals.length) * 100) || 0
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white">Olá, {currentUser?.nome}</h1>
          <p className="text-slate-500 font-medium">Acompanhe o desempenho das indicações.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Indicações" value={stats.total} icon="group" color="text-primary bg-primary/10" />
          <StatCard title="Em Contato" value={stats.contacted} icon="call" color="text-amber-600 bg-amber-100" />
          <StatCard title="Matriculados" value={stats.enrolled} icon="school" color="text-emerald-600 bg-emerald-100" />
          <StatCard title="Conversão" value={`${stats.conversion}%`} icon="trending_up" color="text-purple-600 bg-purple-100" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold dark:text-white">Atividade Recente</h2>
            <button onClick={() => setActiveTab('referrals')} className="text-sm font-bold text-primary hover:underline">Ver todas</button>
          </div>
          <ReferralTable
            referrals={referrals.slice(0, 5)}
            onViewDetails={(ref) => { setSelectedReferral(ref); setActiveTab('details'); }}
            onDelete={currentUser?.perfil === 'admin' ? handleDeleteReferral : undefined}
          />
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    const rankingMap = new Map();
    referrals.forEach(ref => {
      const funcId = ref.funcionario_id;
      const current = rankingMap.get(funcId) || {
        nome: ref.funcionarios?.usuarios?.nome,
        enrolled: 0,
        total: 0
      };
      if (ref.status === ReferralStatus.ENROLLED) {
        current.enrolled += 1;
      }
      current.total += 1;
      rankingMap.set(funcId, current);
    });

    const rankingData = Array.from(rankingMap.values())
      .sort((a, b) => b.enrolled - a.enrolled);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white">Ranking de Performance</h1>
          <p className="text-slate-500 font-medium">Funcionários com mais matrículas convertidas.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-6">
            {rankingData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-200 text-orange-700'}`}>
                  {idx + 1}º
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">{item.nome}</p>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-1000"
                      style={{ width: `${(item.enrolled / (rankingData[0].enrolled || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black dark:text-white">{item.enrolled} matrículas</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.total} indicações</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNewReferral = () => {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white">Nova Indicação</h1>
          <p className="text-slate-500 font-medium">Preencha os dados do candidato abaixo.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleCreateReferral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-slate-300">Nome completo do aluno</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} type="text" className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary focus:border-primary px-4 py-3" placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-slate-300">WhatsApp / Telefone</label>
                <input required value={formPhone} onChange={e => setFormPhone(maskPhone(e.target.value))} type="tel" className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary focus:border-primary px-4 py-3" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold dark:text-slate-300">Curso de interesse</label>
                <select required value={formCourse} onChange={e => setFormCourse(e.target.value)} className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary focus:border-primary px-4 py-3">
                  <option value="">Selecione um curso</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Salvar Indicação</button>
              <button type="button" onClick={() => setActiveTab('dashboard')} className="px-8 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!selectedReferral) return null;
    const isAdmin = currentUser?.perfil === 'admin';

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveTab('referrals')}
              className="size-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black tracking-tight dark:text-white">{selectedReferral.candidatos?.nome_completo}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedReferral.status)}`}>
                  {selectedReferral.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">fingerprint</span>
                ID: #{selectedReferral.id.substring(0, 8)}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Recebido em {new Date(selectedReferral.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditForm({
                    nome: selectedReferral.candidatos?.nome_completo || '',
                    telefone: selectedReferral.candidatos?.telefone || '',
                    curso: selectedReferral.candidatos?.curso_interesse || ''
                  });
                  setIsEditing(true);
                }}
                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Editar
              </button>
              <button
                onClick={() => handleDeleteReferral(selectedReferral.id)}
                className="px-6 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Excluir
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">print</span>
                Imprimir
              </button>
              <button className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">share</span>
                Compartilhar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Tracking Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Acompanhamento de Status
                </h3>
              </div>

              <div className="p-8">
                {isAdmin ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.values(ReferralStatus).map(status => {
                        const isActive = selectedReferral.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(status)}
                            className={`
                              relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all text-center group
                              ${isActive
                                ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-primary/5 text-slate-600 dark:text-slate-400'}
                            `}
                          >
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-white/80' : 'text-slate-400'}`}>Etapa</span>
                            <span className="text-sm font-bold leading-tight">{status}</span>
                            {isActive && (
                              <div className="absolute -top-2 -right-2 size-6 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedReferral.status !== ReferralStatus.ENROLLED && (
                      <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">fingerprint</span>
                          </div>
                          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Dados de Matrícula</h4>
                        </div>
                        <label className="text-xs font-black text-blue-800/60 dark:text-blue-400/60 uppercase tracking-widest block mb-2 ml-1">CPF do Aluno (Obrigatório)</label>
                        <input
                          type="text"
                          value={adminCpf}
                          onChange={e => setAdminCpf(maskCPF(e.target.value))}
                          className="w-full rounded-2xl border-blue-200 dark:border-blue-900/30 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 px-5 py-4 text-lg font-medium tracking-widest placeholder:text-slate-300"
                          placeholder="000.000.000-00"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <span className="material-symbols-outlined text-3xl animate-pulse">info</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Atual</p>
                      <p className="text-2xl font-black text-primary">{selectedReferral.status}</p>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Somente administradores podem realizar alterações de status.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Contato do Aluno</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">WhatsApp</p>
                    <p className="text-base font-bold dark:text-white">{selectedReferral.candidatos?.telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Curso de Interesse</p>
                    <p className="text-base font-bold dark:text-white">{selectedReferral.candidatos?.curso_interesse}</p>
                  </div>
                </div>
                {isAdmin && selectedReferral.candidatos?.cpf && (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="material-symbols-outlined text-lg">fingerprint</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 font-black uppercase tracking-widest">CPF Validado</p>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 tracking-widest">{selectedReferral.candidatos?.cpf}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Indicator Card */}
            <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[32px] shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
              <div className="absolute bottom-0 left-0 size-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Responsável pela Indicação</h4>
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">
                  {selectedReferral.funcionarios?.usuarios?.nome?.[0]}
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-tight">{selectedReferral.funcionarios?.usuarios?.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Funcionário Ativo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const isAdmin = currentUser?.perfil === 'admin';
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'referrals': return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white">
              {currentUser?.perfil === 'admin' ? 'Todas as Indicações' : 'Minhas Indicações'}
            </h1>
            <p className="text-slate-500 font-medium">Acompanhe e gerencie os candidatos.</p>
          </div>
          <ReferralTable
            referrals={referrals}
            onViewDetails={(ref) => { setSelectedReferral(ref); setActiveTab('details'); }}
            onDelete={isAdmin ? handleDeleteReferral : undefined}
            showReferrer={currentUser?.perfil === 'admin'}
          />
        </div>
      );
      case 'new-referral': return renderNewReferral();
      case 'ranking': return renderRanking();
      case 'details': return renderDetails();
      default: return renderDashboard();
    }
  };

  return (
    <Layout
      user={currentUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black dark:text-white">Editar Indicação</h3>
              <button onClick={() => setIsEditing(false)} className="size-10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditReferral} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-slate-300">Nome do Aluno</label>
                <input
                  required
                  value={editForm.nome}
                  onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                  className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-slate-300">Telefone</label>
                <input
                  required
                  value={editForm.telefone}
                  onChange={e => setEditForm({ ...editForm, telefone: maskPhone(e.target.value) })}
                  className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold dark:text-slate-300">Curso</label>
                <select
                  required
                  value={editForm.curso}
                  onChange={e => setEditForm({ ...editForm, curso: e.target.value })}
                  className="w-full rounded-xl border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:ring-primary px-4 py-3"
                >
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Salvar Alterações</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-8 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 transition-all hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-xl ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black dark:text-white">{value}</p>
    </div>
  </div>
);

export default App;
