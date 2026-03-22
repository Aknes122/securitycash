import React, { useState, useEffect } from 'react';
import { Transaction, Category, Goal } from '../types';
import { generateAdvancedDashboardInsight } from '../utils/aiHelpers';
import { Sparkles, Loader2, BrainCircuit, AlertTriangle, Activity } from 'lucide-react';

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

      // --- CÁLCULO DINÂMICO DOS PERÍODOS DE ACORDO COM O FILTRO DO USUÁRIO ---
      const now = new Date();
      let start = new Date(0); // Epoch
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
  
  // Lógica de Cores Gamificada
  let colorClass = "from-emerald-600/20 to-teal-500/20 text-emerald-500 border-emerald-500/30";
  let ringClass = "border-emerald-500";
  let textColorClass = "text-emerald-600 dark:text-emerald-400";
  if (score < 50) {
    colorClass = "from-rose-600/20 to-red-500/20 text-rose-500 border-rose-500/30";
    ringClass = "border-rose-500";
    textColorClass = "text-rose-600 dark:text-rose-400";
  } else if (score < 75) {
    colorClass = "from-amber-500/20 to-yellow-500/20 text-amber-500 border-amber-500/30";
    ringClass = "border-amber-500";
    textColorClass = "text-amber-600 dark:text-amber-400";
  }

  return (
    <div className={`bg-gradient-to-br ${colorClass} border rounded-[2rem] p-5 sm:p-6 mb-2 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-700`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
      
      {/* Placar Gamificado Circle */}
      <div className="relative shrink-0 flex items-center justify-center">
        {loading ? (
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center animate-spin-slow">
            <Loader2 size={24} className="text-zinc-400 animate-spin" />
          </div>
        ) : (
          <div className={`w-24 h-24 rounded-full border-4 ${ringClass} flex flex-col items-center justify-center bg-white dark:bg-zinc-900 shadow-xl relative z-10`}>
            <span className="text-[10px] uppercase font-black tracking-tighter text-zinc-400">Score</span>
            <span className={`text-3xl font-black ${textColorClass} leading-none`}>{score}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-3 z-10 text-center md:text-left w-full">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1 flex items-center justify-center md:justify-start gap-1">
          <Activity size={12} /> Diagnóstico Inteligente 360º
        </h4>
        
        {loading ? (
          <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 dark:text-zinc-400">
            <Sparkles size={16} className="animate-pulse" />
            <span className="text-sm font-medium">Cruzando tendências, anomalias e projeção de metas...</span>
          </div>
        ) : (
          <>
            <p className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
              "{data?.insight}"
            </p>
            
            {data?.anomaly && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start sm:items-center gap-3">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                  <strong className="uppercase font-black tracking-widest text-[10px]">Alerta de Anomalia: </strong> 
                  {data.anomaly}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardInsights;
