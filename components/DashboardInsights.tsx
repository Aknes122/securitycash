import React, { useState, useEffect } from 'react';
import { Transaction, Category, Goal } from '../types';
import { generateAdvancedDashboardInsight } from '../utils/aiHelpers';
import { Sparkles, Loader2, BrainCircuit, AlertTriangle } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  filters: { period: string; startDate: string; endDate: string };
}

interface AIState {
  healthScore: number;
  insight: string;
  anomaly: string | null;
}

const DashboardInsights: React.FC<Props> = ({ transactions, categories, goals, filters }) => {
  const [data, setData] = useState<AIState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!import.meta.env.VITE_GEMINI_API_KEY) return;
      if (transactions.length === 0) return;
      
      const filterKey = `${filters.period}_${filters.startDate}_${filters.endDate}`;
      const hash = transactions.length + '_' + goals.length;
      const cacheKey = `ai_insight_2_${filterKey}_${hash}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        setData(JSON.parse(cached));
        return;
      }

      setLoading(true);

      // --- CÁLCULO DINÂMICO DOS PERÍODOS ---
      const now = new Date();
      let start = new Date(0);
      let end = new Date();
      let priorStart = new Date();
      let priorEnd = new Date();

      if (filters.period === '7d') {
        end = now;
        start = new Date(now); start.setDate(now.getDate() - 7);
        priorEnd = new Date(start);
        priorStart = new Date(start); priorStart.setDate(start.getDate() - 7);
      } else if (filters.period === '30d') {
        end = now;
        start = new Date(now); start.setDate(now.getDate() - 30);
        priorEnd = new Date(start);
        priorStart = new Date(start); priorStart.setDate(start.getDate() - 30);
      } else if (filters.period === '90d') {
        end = now;
        start = new Date(now); start.setDate(now.getDate() - 90);
        priorEnd = new Date(start);
        priorStart = new Date(start); priorStart.setDate(start.getDate() - 90);
      } else if (filters.period === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        priorEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (filters.period === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        priorStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        priorEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      } else if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        start = new Date(filters.startDate);
        end = new Date(filters.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        priorEnd = new Date(start);
        priorStart = new Date(start.getTime() - (diffDays * 24 * 60 * 60 * 1000));
      }

      const pStartStr = start.toISOString();
      const pEndStr = end.toISOString();
      const prevStartStr = priorStart.toISOString();
      const prevEndStr = priorEnd.toISOString();

      const currPeriodTransactions = transactions.filter(t => t.date >= pStartStr && t.date <= pEndStr);
      const prevPeriodTransactions = transactions.filter(t => t.date >= prevStartStr && t.date < pStartStr);

      const goalsState = goals.map(g => `${g.title}: R$ ${g.currentAmount}/R$ ${g.targetAmount}`).join(', ') || 'Nenhuma meta';

      try {
        const result = await generateAdvancedDashboardInsight(currPeriodTransactions, prevPeriodTransactions, categories, goalsState);
        setData(result);
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.error("Dashboard AI 2.0 error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [transactions, categories, goals, filters]);

  if (!loading && !data) return null;

  const score = data?.healthScore || 0;
  
  let textColorClass = "text-emerald-600 dark:text-emerald-400";
  if (score < 50) {
    textColorClass = "text-rose-600 dark:text-rose-400";
  } else if (score < 75) {
    textColorClass = "text-amber-600 dark:text-amber-400";
  }

  return (
    <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 mb-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-bottom-8 duration-1000 group">
      
      {/* Decorative Glows */}
      <div className={`absolute -left-12 -top-12 w-32 h-32 bg-${score < 50 ? 'rose' : score < 75 ? 'amber' : 'emerald'}-500/10 blur-3xl rounded-full pointer-events-none opacity-50`} />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none opacity-30" />
      
      {/* Health Score Gauge - Semi-Circle Arc */}
      <div className="relative shrink-0 flex flex-col items-center justify-center pt-4">
        <div className="relative w-32 h-20">
          <svg className="w-full h-full" viewBox="0 0 100 60">
            {/* Background Track */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className="text-zinc-100 dark:text-zinc-800/50"
            />
            {/* Progress Track */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="126"
              strokeDashoffset={loading ? 126 : 126 - (score / 100) * 126}
              className={`${textColorClass} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 translate-y-1">
            <span className={`text-3xl font-black ${textColorClass} tracking-tighter`}>{loading ? '--' : score}</span>
            <span className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mt-[-2px]">Score</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 z-10 text-center md:text-left">
        <header className="flex items-center justify-center md:justify-start gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shadow-sm group-hover:rotate-12 transition-transform duration-500">
            <BrainCircuit size={18} />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
              Personal AI Advisor
            </h4>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold text-zinc-400">Live Insights</span>
            </div>
          </div>
        </header>
        
        {loading ? (
          <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            <span className="text-sm font-bold italic tracking-tight">Analisando o comportamento do seu dinheiro...</span>
          </div>
        ) : (
          <div className="relative">
            <p className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 leading-relaxed italic">
              "{data?.insight}"
            </p>
            
            {data?.anomaly && (
              <div className="mt-5 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] p-4 flex items-start sm:items-center gap-4 animate-in zoom-in duration-500">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                  <AlertTriangle size={18} />
                </div>
                <div>
                   <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 block mb-0.5">Alerta Crítico</span>
                   <p className="text-sm text-rose-600 dark:text-rose-400 font-bold leading-tight">
                     {data.anomaly}
                   </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardInsights;
