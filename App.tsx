
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './hooks/useStore';
import { Page, Transaction } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Profile from './components/Profile';
import CategoryManager from './components/CategoryManager';
import Comparison from './components/Comparison';
import Reminders from './components/Reminders';
import Goals from './components/Goals';
import AIScanner from './components/AIScanner';
import ImportModal from './components/ImportModal';
import TransactionForm from './components/TransactionForm';
import ReferralPopup from './components/ReferralPopup';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import { LogOut, X, Sparkles } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  // Detect recovery mode synchronously from URL before any async calls
  const detectRecovery = () => {
    const hash = window.location.hash.substring(1);
    const query = window.location.search;
    return hash.includes('type=recovery') || query.includes('type=recovery');
  };
  
  const [isRecovery, setIsRecovery] = useState(detectRecovery());
  const [page, setPage] = useState<Page>('dashboard');
  // const [isLoggedOut, setIsLoggedOut] = useState(false); // Removido mock state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finwise_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Estados Globais de Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [prefilledData, setPrefilledData] = useState<Partial<Transaction> | null>(null);
  const [formInitialSmartMode, setFormInitialSmartMode] = useState(false);

  const {
    state,
    isLoading,
    setPlan,
    setBaseSalary,
    setUserName,
    updateFilters,
    updateDashboardFilters,
    addTransaction,
    addTransactionsBulk,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addReminder,
    updateReminder,
    deleteReminder,
    addGoal,
    updateGoal,
    deleteGoal,
    resetData,
    fetchData,
    deleteAccount,
    resetFilters,
    resetDashboardFilters
  } = useStore(session?.user?.id);

  // Resetar filtros ao trocar de página
  useEffect(() => {
    resetFilters();
    resetDashboardFilters();
  }, [page, resetFilters, resetDashboardFilters]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      // If we're not in a recovery flow, or if we have a session but it's NOT a recovery one, set it
      // Note: During recovery, Supabase usually returns a temporary session
      if (!detectRecovery()) {
        setSession(initialSession);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth Event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setSession(newSession);
      } else if (event === 'SIGNED_OUT') {
        setIsRecovery(false);
        setSession(null);
      } else if (newSession) {
        // For SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED, etc.
        // We only clear recovery mode if it's a "normal" sign in (not during recovery event)
        if (event !== 'INITIAL_SESSION') {
          // If we just signed in normally, we definitely aren't recovering anymore
          // (unless the event was PASSWORD_RECOVERY which we handle above)
        }
        setSession(newSession);
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finwise_theme', theme);
  }, [theme]);

  // Lógica para o Popup de Indicação (Uma vez a cada 7 dias)
  useEffect(() => {
    const now = Date.now();
    const lastPopupTime = localStorage.getItem('last_referral_popup_time');
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (!lastPopupTime || (now - parseInt(lastPopupTime)) > SEVEN_DAYS_MS) {
      const timer = setTimeout(() => {
        setShowReferralPopup(true);
        localStorage.setItem('last_referral_popup_time', now.toString());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleOpenForm = (t: Transaction | null = null, prefill: Partial<Transaction> | null = null, isSmart: boolean = false) => {
    setEditingTransaction(t);
    setPrefilledData(prefill);
    setFormInitialSmartMode(isSmart);
    setIsFormOpen(true);
  };

  const handleAIScanComplete = (data: Partial<Transaction>) => {
    setPrefilledData(data);
    setIsScannerOpen(false);
    setIsFormOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Force clear local state for immediate feedback
      setSession(null);
      setIsRecovery(false);
    }
  };

  if (isRecovery && session) {
    return (
      <ResetPassword
        onDone={async () => {
          await supabase.auth.signOut();
          setIsRecovery(false);
        }}
      />
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-zinc-900 dark:text-zinc-100 transition-colors duration-700 font-sans selection:bg-blue-500/30">
      <Sidebar
        currentPage={page}
        setPage={setPage}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        userPlan={state.userPlan}
        onScanIA={() => setIsScannerOpen(true)}
      />

      <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 overflow-y-auto min-h-screen pt-24 lg:pt-10 custom-scrollbar scroll-smooth transition-all duration-500">
        <div className="max-w-7xl mx-auto">
          {page === 'dashboard' && (
            <Dashboard
              state={state}
              isLoading={isLoading}
              onUpdateFilters={updateDashboardFilters}
              onAddRecord={() => handleOpenForm()}
              onAddRecordVoice={() => handleOpenForm(null, null, true)}
              onScanIA={() => setIsScannerOpen(true)}
              onOpenImport={() => setIsImportModalOpen(true)}
              onGoToReminders={() => setPage('reminders')}
              onGoToGoals={() => setPage('goals')}
              theme={theme}
            />
          )}
          {page === 'records' && (
            <Records
              state={state}
              onUpdateFilters={updateFilters}
              onAddTransaction={addTransaction}
              onAddTransactionsBulk={addTransactionsBulk}
              onUpdateTransaction={updateTransaction}
              onDeleteTransaction={deleteTransaction}
              onOpenForm={handleOpenForm}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}
          {page === 'categories' && <CategoryManager state={state} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} />}
          {page === 'comparison' && <Comparison state={state} />}
          {page === 'reminders' && <Reminders state={state} onAddReminder={addReminder} onUpdateReminder={updateReminder} onDeleteReminder={deleteReminder} />}
          {page === 'goals' && <Goals state={state} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} />}
          {page === 'profile' && (
            <Profile 
              user={session?.user} 
              userName={state.userName || ''}
              currentPlan={state.userPlan} 
              baseSalary={state.baseSalary || 3000} 
              onSetPlan={setPlan} 
              onUpdateUserName={setUserName}
              onSetBaseSalary={setBaseSalary} 
              onResetData={resetData} 
              onDeleteAccount={deleteAccount} 
            />
          )}
        </div>
      </main>

      {/* MODAL GLOBAL DE SCANNER IA (Exclusivo PRO) */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl p-5 md:p-6 relative animate-in zoom-in duration-200 text-zinc-900 dark:text-white">
            <button onClick={() => setIsScannerOpen(false)} className="absolute right-5 top-5 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Scan Inteligente</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Google Gemini AI</p>
              </div>
            </div>
            <AIScanner
              categories={state.categories}
              onScanComplete={handleAIScanComplete}
              onClose={() => setIsScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL GLOBAL DE REGISTRO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl p-5 sm:p-8 relative animate-in zoom-in duration-200">
            <button
              onClick={() => { setIsFormOpen(false); setPrefilledData(null); }}
              className="absolute right-4 top-4 md:right-6 md:top-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-zinc-900 dark:text-white">
              {editingTransaction ? 'Editar Registro' : 'Novo Registro'}
            </h3>
            <TransactionForm
              categories={state.categories}
              initialData={editingTransaction || undefined}
              baseSalary={state.baseSalary || 3000}
              goals={state.goals}
              userPlan={state.userPlan}
              initialSmartMode={formInitialSmartMode}
              onSubmit={(data) => {
                if (editingTransaction) {
                  updateTransaction(editingTransaction.id, data);
                } else {
                  addTransaction(data as any);
                }
                setIsFormOpen(false);
                setPrefilledData(null);
              }}
              onCancel={() => { setIsFormOpen(false); setPrefilledData(null); }}
            />
          </div>
        </div>
      )}

      {/* POPUP DE INDICAÇÃO DIÁRIA */}
      {showReferralPopup && (
        <ReferralPopup onClose={() => setShowReferralPopup(false)} />
      )}

      <div id="toast-root" className="fixed bottom-4 right-4 z-[9999]"></div>
      {isImportModalOpen && (
        <ImportModal
          categories={state.categories}
          onImport={addTransactionsBulk}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
