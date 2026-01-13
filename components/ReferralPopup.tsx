
import React from 'react';
import { Gift, X, Copy, CheckCircle2, Share2 } from 'lucide-react';

interface ReferralPopupProps {
  onClose: () => void;
}

const ReferralPopup: React.FC<ReferralPopupProps> = ({ onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const referralLink = "https://securitycash.app/invite/user123";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500 text-zinc-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 z-50 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 text-center space-y-8">
          {/* Ícone Simples e Moderno */}
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
            <Gift size={40} className="text-white" />
          </div>

          {/* Textos Diretos */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">
              Indique e Ganhe PRO
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              Convide um amigo e ganhe <span className="text-blue-600 dark:text-blue-400 font-bold">30 dias de acesso gratuito</span> a todos os recursos premium do FinWise.
            </p>
          </div>

          {/* Link de Convite Limpo */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seu link de convite</p>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 pl-4">
              <span className="flex-1 text-xs font-mono text-zinc-400 truncate text-left">
                {referralLink}
              </span>
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-90'}`}
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Ações Principais */}
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleCopy}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {copied ? 'Link Copiado!' : 'Convidar Agora'}
              {!copied && <Share2 size={18} />}
            </button>
            
            <button 
              onClick={onClose}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest py-2"
            >
              Vou convidar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPopup;
