
import React, { useState, useRef, useEffect } from 'react';
import { Category, Transaction } from '../types';
import { parseBankStatement } from '../utils/aiHelpers';
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle, Trash2, ArrowRight, Brain, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ImportModalProps {
  categories: Category[];
  onImport: (transactions: Omit<Transaction, 'id'>[], newCategories: Omit<Category, 'id'>[]) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ categories, onImport, onClose }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<Omit<Transaction, 'id'>[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<Omit<Category, 'id'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingIndex !== null && selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setEditingIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingIndex]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Por favor, cole o texto do extrato ou anexe um arquivo.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const { transactions, newCategories } = await parseBankStatement(inputText, categories);
      setParsedItems(transactions);
      setSuggestedCategories(newCategories || []);
      setStep('review');
    } catch (err: any) {
      setError(err.message || "Erro ao analisar o extrato.");
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleCategoryChange = (index: number, newCategoryId: string) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, categoryId: newCategoryId } : item));
    setEditingIndex(null);
  };

  const handleConfirm = () => {
    onImport(parsedItems, suggestedCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">Importar Extrato</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Inteligência Artificial Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4">
          
          {step === 'input' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  Cole o texto do seu extrato bancário ou anexe um arquivo CSV/Texto. A IA irá identificar datas, valores e categorias automaticamente.
                </p>
              </div>

              <div className="relative group">
                <textarea
                  className="w-full h-48 bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-mono placeholder:text-zinc-400"
                  placeholder="Cole os dados aqui... ex: 23/03  COMPRA CARTÃO  R$ 150,00"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                {!inputText && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-400">
                        <Upload size={32} className="mb-2 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Texto ou CSV</span>
                    </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".csv,.txt,.ofx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Anexar Arquivo
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !inputText.trim()}
                  className="flex-[2] py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                  Analisar com IA
                </button>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm font-bold animate-in shake duration-300">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto text-blue-500" size={24} />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-zinc-900 dark:text-white">Processando Arquivo</h4>
                <p className="text-xs text-zinc-500 font-medium tracking-wide italic">Estamos mapeando suas categorias...</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-bold">{parsedItems.length} transações encontradas!</span>
                </div>
                <button onClick={() => setStep('input')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest">
                  Refazer
                </button>
              </div>

              {/* Novas Categorias Summary */}
              {suggestedCategories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Brain size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Novas Categorias Sugeridas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCategories.map((cat, i) => (
                      <div 
                        key={i} 
                        className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-2 group transition-all hover:bg-amber-500/10"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#f59e0b' }} />
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl group transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${item.type === 'entrada' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {item.type === 'entrada' ? 'IN' : 'OUT'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">{item.description}</p>
                        <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 relative">
                           <span className="text-[10px] text-zinc-400 font-bold">{formatDate(item.date)}</span>
                           <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                           
                           <div className="relative">
                             <button 
                               onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                               className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/cat"
                             >
                               <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter group-hover/cat:text-zinc-900 dark:group-hover/cat:text-white transition-colors">
                                 {categories.find(c => c.id === item.categoryId)?.name || 
                                  suggestedCategories.find(c => c.name === item.categoryId)?.name || 
                                  'Geral'}
                               </span>
                               {(suggestedCategories.some(c => c.name === item.categoryId)) && (
                                 <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[8px] font-black rounded-full uppercase tracking-widest">
                                   Nova
                                 </span>
                               )}
                               <ChevronDown size={10} className={`text-zinc-400 transition-transform ${editingIndex === idx ? 'rotate-180' : ''}`} />
                             </button>

                             {editingIndex === idx && (
                               <div 
                                 ref={selectorRef}
                                 className="absolute top-full left-0 z-[130] mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                               >
                                 <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                   {/* Categorias Sugeridas pela IA */}
                                   {suggestedCategories.length > 0 && (
                                     <div className="mb-2">
                                       <div className="px-2 py-1 text-[8px] font-black text-amber-500 uppercase tracking-[0.2em]">Sugeridas pela IA</div>
                                       {suggestedCategories.filter(c => c.kind === item.type).map(cat => (
                                         <button
                                           key={cat.name}
                                           onClick={() => handleCategoryChange(idx, cat.name)}
                                           className={`w-full text-left px-2 py-2 text-[10px] font-bold rounded-xl transition-all flex items-center justify-between ${item.categoryId === cat.name ? 'bg-amber-500/10 text-amber-600' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                         >
                                           {cat.name}
                                           {item.categoryId === cat.name && <CheckCircle2 size={10} />}
                                         </button>
                                       ))}
                                     </div>
                                   )}

                                   {/* Categorias do Sistema */}
                                   <div>
                                     <div className="px-2 py-1 text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]">Categorias do App</div>
                                     {categories.filter(c => c.kind === item.type).map(cat => (
                                       <button
                                         key={cat.id}
                                         onClick={() => handleCategoryChange(idx, cat.id)}
                                         className={`w-full text-left px-2 py-2 text-[10px] font-bold rounded-xl transition-all flex items-center justify-between ${item.categoryId === cat.id ? 'bg-blue-500/10 text-blue-600' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                       >
                                         {cat.name}
                                         {item.categoryId === cat.id && <CheckCircle2 size={10} />}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                        </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(item.amount)}</span>
                      <button onClick={() => removeItem(idx)} className="p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl text-sm font-black shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
              >
                Concluir e Salvar Tudo
                <ArrowRight size={20} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ImportModal;
