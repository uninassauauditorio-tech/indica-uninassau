
import React, { useState } from 'react';
import { Usuario } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Usuario | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'referrals', label: user?.perfil === 'admin' ? 'Todas Indicações' : 'Minhas Indicações', icon: 'Assignment' },
    { id: 'new-referral', label: 'Nova Indicação', icon: 'add_circle', primary: true },
    { id: 'ranking', label: 'Ranking Geral', icon: 'military_tech' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none group-hover:scale-110 transition-transform overflow-hidden border border-slate-100 dark:border-slate-800">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-primary to-blue-800 bg-clip-text text-transparent">IndicaAluno</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Uninassau</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Menu Principal</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group
                  ${activeTab === item.id
                    ? (item.primary
                      ? 'bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]'
                      : 'bg-primary/5 text-primary font-bold')
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:translate-x-1'}
                `}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === item.id ? '' : 'text-slate-400 group-hover:text-primary transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="text-sm tracking-tight whitespace-nowrap">{item.label}</span>
                {activeTab === item.id && !item.primary && (
                  <div className="ml-auto size-1.5 bg-primary rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 mt-auto">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="size-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-primary font-black text-lg shadow-inner">
                    {user?.nome?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate dark:text-white leading-tight">{user?.nome}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {user?.perfil === 'admin' ? 'Administrador' : 'Funcionário'}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 lg:px-10 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative hidden md:block w-80 group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary transition-colors">search</span>
              <input
                type="text"
                placeholder="Buscar por nome ou curso..."
                className="w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-transparent rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Elementos do cabeçalho simplificados */}
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
