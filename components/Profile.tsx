
import React, { useState, useEffect } from 'react';
import { User, Shield, RotateCcw, AlertTriangle, CreditCard, CheckCircle2, ShieldCheck, ChevronRight, Crown, Sparkles, Gift, Copy, Share2, LogOut, Trash2, X, Timer } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { UserPlan } from '../types';

interface ProfileProps {
  currentPlan: UserPlan;
  onSetPlan: (plan: UserPlan) => void;
  onResetData: () => void;
  onDeleteAccount: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentPlan, onSetPlan, onResetData, onDeleteAccount }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCloseAccountModal, setShowCloseAccountModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [copied, setCopied] = useState(false);
  const referralLink = "https://securitycash.app/invite/user123";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-fix: Lógica de timer robusta para evitar memory leaks e garantir precisão
  useEffect(() => {
    let interval: number | undefined;

    if (isTimerActive && countdown > 0) {
      interval = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setShowFinalConfirm(true);
      setIsTimerActive(false);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isTimerActive, countdown]);

  const startCloseAccountProcess = () => {
    setCountdown(5);
    setIsTimerActive(true);
    setShowFinalConfirm(false);
    setShowCloseAccountModal(true);
  };

  const cancelCloseAccount = () => {
    setShowCloseAccountModal(false);
    setIsTimerActive(false);
    setCountdown(5);
    setShowFinalConfirm(false);
  };

  const handleFinalAccountDeletion = () => {
    setIsDeleting(true);
    // Pequeno delay para feedback visual de que algo importante está acontecendo
    setTimeout(() => {
      onDeleteAccount();
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-zinc-500">Gerencie sua conta e preferências do app.</p>
      </header>

      <div className="flex flex-col gap-6">

        {/* 1. Subscription Manager */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Planos & Assinatura</h3>
              <p className="text-xs text-zinc-500">Escolha o nível de recursos do seu Security Cash.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic Plan Card */}
            <button
              onClick={() => onSetPlan('basic')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all ${currentPlan === 'basic'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/5'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
            >
              {currentPlan === 'basic' && (
                <div className="absolute top-3 right-3 text-blue-600">
                  <CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-zinc-900" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-zinc-400" />
                  <span className="font-bold text-zinc-900 dark:text-white">Plano Basic</span>
                </div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">Grátis</p>
                <ul className="text-[11px] text-zinc-500 space-y-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500" /> Controle Financeiro</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500" /> Categorias Ilimitadas</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500" /> Metas e Lembretes</li>
                </ul>
              </div>
            </button>

            {/* PRO Plan Card */}
            <button
              onClick={() => onSetPlan('pro')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all overflow-hidden ${currentPlan === 'pro'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
            >
              {currentPlan === 'pro' && (
                <div className="absolute top-3 right-3 text-emerald-500">
                  <CheckCircle2 size={20} fill="currentColor" className="text-white dark:text-zinc-900" />
                </div>
              )}
              <div className="absolute -bottom-4 -right-4 text-emerald-500/10 rotate-12">
                <Crown size={80} />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-amber-500" />
                  <span className="font-bold text-zinc-900 dark:text-white">Plano PRO</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase">Novo</span>
                </div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">R$ 27,90<span className="text-xs font-normal text-zinc-500">/mês</span></p>
                <ul className="text-[11px] text-zinc-500 space-y-1">
                  <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"><Sparkles size={10} /> Scan com IA (Gemini)</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500" /> Automação de Categorias</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-500" /> Todos os recursos Basic</li>
                </ul>
              </div>
            </button>
          </div>

          <button className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
            Gerenciar Assinatura
            <ChevronRight size={16} />
          </button>
        </section>

        {/* 2. Account Information */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Informações da conta</h3>
              <p className="text-xs text-zinc-500">Detalhes pessoais e de acesso.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest">Nome</label>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Usuário SecurityCash</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest">Email</label>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">usuario@securitycash.com.br</p>
            </div>
          </div>
        </section>

        {/* 3. Referral Section */}
        <section className="bg-gradient-to-br from-blue-600/5 to-emerald-500/5 border border-blue-100 dark:border-blue-900/20 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Gift size={120} className="rotate-12" />
          </div>

          <div className="flex items-center gap-3 border-b border-blue-100 dark:border-blue-900/20 pb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Indique e Ganhe</h3>
              <p className="text-xs text-zinc-500">Compartilhe o app e ganhe 1 mês de PRO.</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Convide um amigo para o <span className="font-bold text-blue-600">SecurityCash</span>. Se ele assinar qualquer plano, você recebe <span className="font-bold text-emerald-600 dark:text-emerald-400">30 dias de Plano PRO grátis</span>.
            </p>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1 text-xs font-mono text-zinc-500 truncate select-all">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className={`p-2.5 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {copied ? 'Link Copiado para Área de Transferência' : 'Copiar e Compartilhar'}
              <Share2 size={18} />
            </button>
          </div>
        </section>

        {/* 4. Danger Zone */}
        <section className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-rose-600 dark:text-rose-400">Zona de Perigo</h3>
              <p className="text-xs text-zinc-500">Ações críticas para sua conta e dados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left hover:border-amber-500/50 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <RotateCcw size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Resetar Dados</p>
                <p className="text-[10px] text-zinc-500">Voltar para dados padrão</p>
              </div>
            </button>

            <button
              onClick={startCloseAccountProcess}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left hover:border-rose-500 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Trash2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Encerrar Conta</p>
                <p className="text-[10px] text-zinc-500">Excluir tudo permanentemente</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* MODAL DE RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-200 text-zinc-900 dark:text-white">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Confirmar Reset?</h3>
              <p className="text-zinc-500 text-sm">Seus dados atuais serão substituídos pelo seed inicial.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold">Cancelar</button>
              <button onClick={() => { onResetData(); setShowResetConfirm(false); }} className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-bold">Resetar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENCERRAMENTO COM TEMPORIZADOR */}
      {showCloseAccountModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-rose-500/30 rounded-[2.5rem] p-8 text-center space-y-8 shadow-2xl shadow-rose-500/10 animate-in zoom-in slide-in-from-bottom-10 duration-500">

            <button
              onClick={cancelCloseAccount}
              disabled={isDeleting}
              className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-0"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className={`w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 ${isDeleting ? 'scale-150 blur-xl opacity-0' : 'animate-pulse'}`}>
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Encerrar Conta</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  Esta ação é <span className="text-rose-600 font-bold uppercase">irreversível</span>. Todos os seus registros, metas e dados de IA serão excluídos permanentemente de nossos servidores e deste dispositivo.
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
              {isDeleting ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                  <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-black text-rose-500 uppercase tracking-widest">Excluindo tudo...</p>
                </div>
              ) : !showFinalConfirm ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-3 text-zinc-400">
                    <Timer size={18} className="animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest">Aguarde a segurança</span>
                  </div>
                  <div className="text-5xl font-black text-rose-500 tabular-nums animate-bounce">
                    {countdown}
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in zoom-in duration-300">
                  <div className="flex items-center justify-center gap-2 text-emerald-500">
                    <CheckCircle2 size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Pronto para prosseguir</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold">Você confirmou que deseja deletar tudo?</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {showFinalConfirm ? (
                <button
                  onClick={handleFinalAccountDeletion}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'PROCESSANDO...' : 'DELETAR MINHA CONTA AGORA'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm cursor-not-allowed"
                >
                  AGUARDE... ({countdown}s)
                </button>
              )}

              <button
                onClick={cancelCloseAccount}
                disabled={isDeleting}
                className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-2xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                Mudei de ideia, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
