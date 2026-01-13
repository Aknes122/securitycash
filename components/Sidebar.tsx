
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
      <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/50 flex-col h-screen fixed left-0 top-0 bg-white dark:bg-zinc-950 z-50 transition-colors duration-300">
        <div className="p-10 pb-8">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="text-left outline-none"
          >
            <Logo />
          </button>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as Page)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold shadow-xl shadow-black/10 dark:shadow-white/5'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-500' : ''} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
          {userPlan === 'pro' && (
            <button
              onClick={onScanIA}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mb-4"
            >
              <div className="relative">
                <Camera size={20} />
                <Sparkles size={12} className="absolute -top-2 -right-2 text-amber-300 animate-pulse" />
              </div>
              <span className="text-sm">Scan IA com Foto</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all mb-2"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button
            onClick={() => handleNavigate('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentPage === 'profile'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
          >
            <User size={18} />
            <span className="text-sm font-medium">Meu Perfil</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
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
