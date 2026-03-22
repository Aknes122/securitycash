import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category, Negotiation } from '../types';
import { continueNegotiationChat } from '../utils/aiHelpers';
import { useStore } from '../hooks/useStore';
import { Copy, CheckCircle2, Loader2, Zap, Send, PhoneCall, ArrowLeft, Trash2, CheckSquare, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SavingsGeneratorProps {
  transactions: Transaction[];
  categories: Category[];
}

const SavingsGenerator: React.FC<SavingsGeneratorProps> = ({ transactions, categories }) => {
  const { state, addNegotiation, addNegotiationMessage, updateNegotiationStatus, deleteNegotiation } = useStore();
  const negotiations = state.negotiations || [];

  const [activeNegId, setActiveNegId] = useState<string | null>(null);
  
  // Phase 1: New Negotiation Form
  const [expenseName, setExpenseName] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  
  // Phase 2: Chat Input
  const [rebuttal, setRebuttal] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [pendingNeg, setPendingNeg] = useState<{name: string, openingScript: string, status: 'active'|'won'|'lost'} | null>(null);

  const activeNeg = activeNegId ? negotiations.find(n => n.id === activeNegId) : null;
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeNeg?.messages]);

  // Interceptador para injetar a primeira mensagem logo após a store criar a negociação
  useEffect(() => {
    if (pendingNeg && negotiations.length > 0) {
      const sorted = [...negotiations].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (sorted[0] && sorted[0].serviceName === pendingNeg.name && sorted[0].messages.length === 0) {
        setActiveNegId(sorted[0].id);
        addNegotiationMessage(sorted[0].id, 'ai', pendingNeg.openingScript);
        if (pendingNeg.status !== 'active') {
          updateNegotiationStatus(sorted[0].id, pendingNeg.status);
        }
        setPendingNeg(null);
        setLoading(false);
      }
    }
  }, [negotiations, pendingNeg, addNegotiationMessage, updateNegotiationStatus]);

  const handleStartNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName || !currentAmount || !targetAmount) return;
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      alert("A chave do Gemini (VITE_GEMINI_API_KEY) não está configurada.");
      return;
    }

    setLoading(true);
    try {
      // 1. Gera a abertura
      const aiResponse = await continueNegotiationChat(expenseName, parseFloat(currentAmount), parseFloat(targetAmount), [], "");
      
      // 2. Registra na Store
      addNegotiation({
        serviceName: expenseName,
        currentAmount: parseFloat(currentAmount),
        targetAmount: parseFloat(targetAmount),
        status: 'active'
      });

      // 3. Define a Flag de Espera para o UseEffect agir!
      setPendingNeg({ name: expenseName, openingScript: aiResponse.script, status: aiResponse.status });
      setExpenseName('');
      setCurrentAmount('');
      setTargetAmount('');

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSendRebuttal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebuttal.trim() || !activeNeg) return;

    setLoading(true);
    const userText = rebuttal;
    setRebuttal(''); // Limpa otimista

    try {
      // Grava a fala do Vendedor (simulada como user no array do app)
      addNegotiationMessage(activeNeg.id, 'user', userText);

      // Pede pra IA continuar
      const updatedHistory = [...activeNeg.messages, { id: 'temp', role: 'user' as const, content: userText, createdAt: '' }];
      const aiResponse = await continueNegotiationChat(
        activeNeg.serviceName, 
        activeNeg.currentAmount, 
        activeNeg.targetAmount, 
        updatedHistory,
        userText
      );

      // Salva Resposta da IA e verifica Vitória (nunca derrota automática)
      addNegotiationMessage(activeNeg.id, 'ai', aiResponse.script);
      if (aiResponse.status === 'won') {
        updateNegotiationStatus(activeNeg.id, 'won');
      }
      // status 'lost' da IA é ignorado — apenas o usuário pode decidir isso
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Deseja apagar este histórico de negociação?")) {
      deleteNegotiation(id);
      if(activeNegId === id) setActiveNegId(null);
    }
  };

  const handleManualWin = () => {
    if (!activeNegId) return;
    if(confirm("Deseja encerrar a negociação aceitando a última proposta recebida?")) {
      updateNegotiationStatus(activeNegId, 'won');
      addNegotiationMessage(activeNegId, 'system', 'Você encerrou a negociação manualmente considerando a oferta satisfatória.');
    }
  };

  const handleManualLoss = () => {
    if (!activeNegId) return;
    if(confirm("Deseja encerrar marcando esta negociação como perdida?")) {
      updateNegotiationStatus(activeNegId, 'lost');
      addNegotiationMessage(activeNegId, 'system', 'Negociação encerrada. O desconto não foi conquistado desta vez.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden text-indigo-50 mt-8 min-h-[500px] flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="relative z-10 flex items-center justify-between mb-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black tracking-widest uppercase mb-1">
            <Zap size={12} className="text-amber-400" /> Consultor IA Chris Voss
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            {activeNegId ? (
              <button onClick={() => setActiveNegId(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors -ml-2">
                <ArrowLeft size={24} />
              </button>
            ) : <PhoneCall className="text-emerald-400" />}
            Barganha Infinita
          </h2>
        </div>
      </header>

      {/* TELA 1: LISTA e NOVO */}
      {!activeNegId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 flex-1">
          {/* Formulário Novo */}
          <form onSubmit={handleStartNegotiation} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-indigo-200">Iniciar Nova Negociação</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Alvo (Ex: Assinatura, Internet)</label>
              <input type="text" required value={expenseName} onChange={e => setExpenseName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Pago Atual</label>
                <input type="number" step="0.01" required value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Alvo Ideal</label>
                <input type="number" step="0.01" required value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><PhoneCall size={20} /> Preparar Ligação</>}
            </button>
          </form>

          {/* Histórico */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-indigo-200 px-2">Histórico de Batalhas</h3>
            {negotiations.length === 0 ? (
              <div className="h-48 border-2 border-dashed border-indigo-400/20 rounded-3xl flex items-center justify-center text-indigo-300/60 text-sm p-6 text-center">
                Nenhuma negociação ativa. Cadastre ao lado para invocar o negociador.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {[...negotiations].reverse().map(n => (
                  <div key={n.id} onClick={() => setActiveNegId(n.id)} className={`group hover:bg-white/10 border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between ${n.status === 'won' ? 'bg-emerald-900/20 border-emerald-500/30' : n.status === 'lost' ? 'bg-rose-900/20 border-rose-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div>
                      <h4 className="font-bold text-white tracking-wide flex items-center gap-2">
                        {n.serviceName}
                        {n.status === 'won' && <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest bg-emerald-500 text-white shadow-sm">Vitória</span>}
                        {n.status === 'lost' && <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest bg-rose-500 text-white shadow-sm">Perdida</span>}
                      </h4>
                      <p className={`text-xs font-medium mt-0.5 ${n.status === 'won' ? 'text-emerald-300' : 'text-indigo-300'}`}>
                        De {formatCurrency(n.currentAmount)} para <span className={n.status === 'won' ? 'text-white font-black' : 'text-emerald-400 font-bold'}>{formatCurrency(n.targetAmount)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${n.status === 'won' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{n.messages.length} msgs</span>
                      <button onClick={(e) => handleDelete(n.id, e)} className="text-rose-400/50 hover:text-rose-400 transition-colors p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TELA 2: ARENA DE CHAT */}
      {activeNegId && activeNeg && (
        <div className="flex-1 flex flex-col bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative z-10">
          {/* HEADER DO CHAT com indicador de status */}
          <div className={`p-4 border-b border-white/5 flex justify-between items-center ${
            activeNeg.status === 'won' ? 'bg-emerald-900/60' : 
            activeNeg.status === 'lost' ? 'bg-rose-900/60' : 'bg-indigo-900/50'
          }`}>
            <div className={`text-sm font-bold flex items-center gap-2 ${
              activeNeg.status === 'won' ? 'text-emerald-100' : 
              activeNeg.status === 'lost' ? 'text-rose-200' : 'text-indigo-100'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                activeNeg.status === 'won' ? 'bg-emerald-400' : 
                activeNeg.status === 'lost' ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              {activeNeg.status === 'won' ? 'Objetivo Concluído 🎉' : 
               activeNeg.status === 'lost' ? 'Negociação Encerrada' :
               `Barganhando: ${activeNeg.serviceName} → ${formatCurrency(activeNeg.targetAmount)}`}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
            {activeNeg.messages.map((msg, idx) => (
              <div key={msg.id} className={`flex max-w-[85%] ${msg.role === 'ai' || msg.role === 'system' ? 'mr-auto flex-col items-start' : 'ml-auto flex-col items-end'}`}>
                {msg.role !== 'system' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/50 mb-1 ml-1">
                    {msg.role === 'ai' ? 'Instrução do Consultor' : 'Resposta do Atendente'}
                  </span>
                )}
                <div className={`p-4 rounded-2xl relative group ${
                  msg.role === 'ai' ? 'bg-indigo-600 text-white rounded-tl-sm' : 
                  msg.role === 'system' ? 'bg-black/30 text-indigo-300 border border-indigo-500/30 w-full text-center py-2' :
                  'bg-slate-700 text-slate-200 rounded-tr-sm'
                }`}>
                  {msg.role === 'ai' && (
                    <button onClick={() => handleCopy(msg.content, idx)} className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all">
                      {copiedIndex === idx ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                  <p className={`text-sm leading-relaxed ${msg.role === 'ai' ? 'pr-8 font-medium' : ''}`}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex max-w-[80%] mr-auto flex-col items-start">
                 <div className="bg-indigo-600/50 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"></div>
                   <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce delay-75"></div>
                   <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* BOTÕES DE CONTROLE — faixa acima do input, visível enquanto ativa */}
          {activeNeg.status === 'active' && activeNeg.messages.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 bg-slate-900/50 flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleManualWin}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md transition-all hover:scale-105 whitespace-nowrap"
              >
                <CheckSquare size={13} /> Acordo Aceito
              </button>
              <button
                type="button"
                onClick={handleManualLoss}
                className="flex items-center gap-2 px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-300 text-xs font-bold rounded-full shadow-md transition-all hover:scale-105 whitespace-nowrap border border-rose-700/50"
              >
                <XCircle size={13} /> Negociação Perdida
              </button>
            </div>
          )}

          <form onSubmit={handleSendRebuttal} className={`p-4 border-t border-white/5 ${activeNeg.status === 'won' ? 'bg-emerald-950/50' : 'bg-indigo-950/50'}`}>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={rebuttal}
                onChange={e => setRebuttal(e.target.value)}
                placeholder={activeNeg.status === 'won' ? "Chat fechado. Vitória alcançada!" : "O que o atendente respondeu agora? Digite aqui..."}
                disabled={loading || activeNeg.status !== 'active'}
                className="w-full bg-black/30 border border-white/10 rounded-full pl-5 pr-14 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={loading || !rebuttal.trim() || activeNeg.status !== 'active'} 
                className={`absolute right-2 p-2.5 rounded-full transition-transform disabled:opacity-50 disabled:scale-95 text-white ${activeNeg.status !== 'active' ? 'bg-zinc-600' : 'bg-indigo-500 hover:bg-indigo-400'}`}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SavingsGenerator;
