
import React, { useState } from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  Tag,
  ArrowLeftRight,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Target,
  Sun,
  Moon,
  Sparkles,
  Camera
} from 'lucide-react';
import { Page, UserPlan } from '../types';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  userPlan?: UserPlan;
  onScanIA?: () => void;
}

const Logo = () => (
  <div className="flex flex-col group">
    <h1 className="text-2xl font-black tracking-tighter leading-none">
      <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent transition-all duration-500 group-hover:brightness-110">
        Security Cash
      </span>
    </h1>
    <div className="flex items-center gap-2 mt-1.5">
      <div className="h-[1px] w-4 bg-blue-500/50"></div>
      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
        Smart Finance
      </span>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setPage,
  onLogout,
  theme,
  toggleTheme,
  userPlan = 'basic',
  onScanIA
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'records', label: 'Meus Registros', icon: ListOrdered },
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'comparison', label: 'Comparativos', icon: ArrowLeftRight },
    { id: 'reminders', label: 'Lembretes', icon: Bell },
    { id: 'goals', label: 'Metas', icon: Target },
  ];

  const handleNavigate = (pageId: Page) => {
    setPage(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Border suavizada e largura fixa clara */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/20 flex-col h-screen fixed left-0 top-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl z-50 transition-all duration-500">
        <div className="p-10 pb-6">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="text-left outline-none group"
          >
            <Logo />
          </button>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as Page)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold shadow-2xl shadow-zinc-500/20 dark:shadow-white/10 scale-[1.02]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                  }`}
              >
                <div className={`transition-colors duration-300 ${isActive ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
          {userPlan === 'pro' && (
            <button
              onClick={onScanIA}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-bold shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all mb-4 group"
            >
              <div className="relative p-2 bg-white/10 rounded-xl group-hover:rotate-12 transition-transform">
                <Camera size={20} />
                <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
              </div>
              <span className="text-sm tracking-tight">AI Smart Scan</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={() => handleNavigate('profile')}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${currentPage === 'profile'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-lg'
                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              title="Meu Perfil"
            >
              <User size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all duration-300"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold tracking-tight">Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="scale-90 origin-left">
            <Logo />
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 text-zinc-500 dark:text-zinc-400"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-[300px] bg-white dark:bg-zinc-950 shadow-2xl animate-in slide-in-from-left duration-300 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
              <div className="scale-90 origin-left">
                <Logo />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-500 dark:text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id as Page)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              {userPlan === 'pro' && (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onScanIA?.(); }}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <div className="relative">
                    <Camera size={20} />
                    <Sparkles size={12} className="absolute -top-2 -right-2 text-amber-300 animate-pulse" />
                  </div>
                  <span className="text-sm">Scan IA com Foto</span>
                </button>
              )}
              <button
                onClick={() => handleNavigate('profile')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${currentPage === 'profile'
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
                  }`}
              >
                <User size={20} />
                <span className="text-sm">Meu Perfil</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 p-3 text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
