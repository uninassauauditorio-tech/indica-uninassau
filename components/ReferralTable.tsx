import React from 'react';
import { Indicacao, ReferralStatus, getStatusColor } from '../types';

interface ReferralTableProps {
  referrals: Indicacao[];
  onViewDetails: (referral: Indicacao) => void;
  onDelete?: (id: string) => void;
  showReferrer?: boolean;
}

const ReferralTable: React.FC<ReferralTableProps> = ({ referrals, onViewDetails, onDelete, showReferrer }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Aluno Indicado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Curso</th>
              {showReferrer && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Indicado por</th>}
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {referrals.map((ref) => (
              <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {ref.candidatos?.nome_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{ref.candidatos?.nome_completo}</p>
                      <p className="text-xs text-slate-500">{ref.candidatos?.telefone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{ref.candidatos?.curso_interesse}</span>
                </td>
                {showReferrer && (
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {ref.funcionarios?.usuarios?.nome?.[0] || 'U'}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-bold">{ref.funcionarios?.usuarios?.nome}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(ref.status)}`}>
                    {ref.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-slate-500 dark:text-slate-500">
                    {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onViewDetails(ref)}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                      title="Ver Detalhes"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(ref.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Excluir Indicação"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium italic">Exibindo {referrals.length} resultados</p>
      </div>
    </div>
  );
};

export default ReferralTable;
