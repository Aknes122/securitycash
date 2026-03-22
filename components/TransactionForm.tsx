
import React, { useState } from 'react';
import { Category, Transaction, TransactionType, Goal } from '../types';
import { generateCognitiveImpact, parseNaturalLanguageTransaction } from '../utils/aiHelpers';
import { BrainCircuit, Loader2, Zap, FileText, Mic } from 'lucide-react';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction;
  onSubmit: (data: Partial<Transaction>) => void;
  onCancel: () => void;
  baseSalary?: number;
  goals?: Goal[];
  userPlan?: 'basic' | 'pro';
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onSubmit, onCancel, baseSalary, goals, userPlan }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'despesa');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [impactWarning, setImpactWarning] = useState<string | null>(null);

  // Smart Input (AI 2.0)
  const [smartMode, setSmartMode] = useState(false);
  const [smartText, setSmartText] = useState('');
  
  // Web Speech API
  const [isListening, setIsListening] = useState(false);

  // Fallback TypeScript para window.SpeechRecognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz (tente no Chrome/Safari ou digite o texto).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSmartText(prev => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no áudio:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!description) newErrors.description = 'Descrição é obrigatória';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valor deve ser maior que zero';
    if (!date) newErrors.date = 'Data é obrigatória';
    if (type === 'despesa' && !categoryId) newErrors.categoryId = 'Categoria é obrigatória para despesas';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const parsedAmount = parseFloat(amount);

    // Fricção Positiva: REQUER PLANO PRO
    const isPro = userPlan === 'pro';

    // Se é uma DESPESA e NÃO FOI AVISADA AINDA e tem SALÁRIO BASE = Ativa Fricção Positiva
    if (isPro && type === 'despesa' && parsedAmount > 0 && !impactWarning && baseSalary && baseSalary > 0) {
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        setIsAnalyzing(true);
        try {
          const closestGoal = goals && goals.length > 0 ? goals[0].title : null;
          const impact = await generateCognitiveImpact(parsedAmount, baseSalary, closestGoal);
          setImpactWarning(impact.text);
          setIsAnalyzing(false);
          return; // Para o form e exibe o aviso
        } catch (e) {
          console.error("Erro no impacto cognitivo:", e);
          setIsAnalyzing(false);
        }
      }
    }

    // Se já passou pelo aviso (segundo clique) ou não caiu na condição:
    onSubmit({
      type,
      date,
      categoryId: type === 'entrada' && !categoryId ? categories.find(c => c.kind === 'entrada')?.id || '' : categoryId,
      description,
      amount: parsedAmount
    });
  };

  const handleSmartInput = async () => {
    if (!smartText.trim()) return;
    setIsAnalyzing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const items = await parseNaturalLanguageTransaction(smartText, categories, today);
      if (items && items.length > 0) {
        const t = items[0]; // Pega a primeira extraída
        setAmount(t.amount.toString());
        setDescription(t.description);
        setCategoryId(t.categoryId || '');
        setType(t.type);
        setDate(t.date || today);
        setSmartMode(false); // Retorna ao form preenchido!
        setSmartText('');
      }
    } catch (e) {
      console.error(e);
      alert("Não consegui entender a transação. Tente ser mais claro com o valor e o que foi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggles de Modo */}
      {userPlan === 'pro' && !initialData && (
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-full">
          <button
            type="button"
            onClick={() => setSmartMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${!smartMode ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <FileText size={14} /> Formulário
          </button>
          <button
            type="button"
            onClick={() => setSmartMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${smartMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Zap size={14} className={smartMode ? "text-amber-400" : ""} /> Modo Smart IA
          </button>
        </div>
      )}

      {smartMode ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
              <BrainCircuit size={14} /> Digitador Virtual
            </h4>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 mb-4">Escreva de forma natural o que você gastou ou ganhou. A IA vai preencher todo o formulário sozinha pra você!</p>
            <div className="relative">
              <textarea
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                placeholder="Ex: Paguei 120 contos de estacionamento ontem a noite. E recebi 500 reais de um freela hoje cedo."
                className="w-full bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-500/40 rounded-xl pl-4 pr-14 py-3 text-sm focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white shadow-inner resize-none h-28"
              />
              <button
                type="button"
                onClick={startListening}
                className={`absolute top-3 right-3 p-2.5 rounded-full transition-all flex items-center justify-center ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-110' 
                    : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/40'
                }`}
                title="Ditar lançamento"
              >
                {isListening ? <Mic size={18} className="animate-bounce" /> : <Mic size={18} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSmartInput}
              disabled={isAnalyzing || !smartText.trim()}
              className="w-full mt-3 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Mapeando dados...</> : <><Zap size={16} className="text-amber-400" /> Auto-Preencher</>}
            </button>
          </div>
          <button type="button" onClick={onCancel} className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm font-bold">Cancelar Lançamento</button>
        </div>
      ) : (
    <form onSubmit={handleSubmit} className="space-y-4 text-zinc-900 dark:text-zinc-100">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tipo</label>
        <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setType('entrada')}
            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'entrada' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'despesa' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
          >
            Despesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Data</label>
          <input
            type="date"
            className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.date ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <p className="text-[10px] text-rose-500">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <p className="text-[10px] text-rose-500">{errors.amount}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Categoria</label>
        <select
          className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.categoryId ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {categories
            .filter(c => c.kind === type)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
        {errors.categoryId && <p className="text-[10px] text-rose-500">{errors.categoryId}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Descrição</label>
        <input
          type="text"
          className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.description ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
          placeholder="Ex: Aluguel, Supermercado..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <p className="text-[10px] text-rose-500">{errors.description}</p>}
      </div>

      {/* Módulo de Impacto Cognitivo */}
      {impactWarning && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 animate-in zoom-in-95 duration-300">
          <BrainCircuit size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Impacto Cognitivo</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              {impactWarning}
            </p>
            <p className="text-[9px] text-amber-600/60 dark:text-amber-500/60 font-bold uppercase mt-2">Deseja realmente confirmar esse gasto?</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isAnalyzing}
          className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-80 text-zinc-700 dark:text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isAnalyzing}
          className={`flex-1 py-2 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
            impactWarning 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          } disabled:opacity-50`}
        >
          {isAnalyzing ? (
            <><Loader2 size={16} className="animate-spin" /> Analisando impacto...</>
          ) : impactWarning ? (
            'Tenho certeza, Salvar'
          ) : (
            'Salvar Transação'
          )}
        </button>
      </div>
    </form>
      )}
    </div>
  );
};

export default TransactionForm;
