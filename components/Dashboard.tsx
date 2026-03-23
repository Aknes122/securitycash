
import React, { useMemo } from 'react';
import { AppState, Filters } from '../types';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingDown,
  Tag,
  Calendar,
  ChevronRight,
  Target,
  Sparkles,
  Camera,
  Bell,
  FileText,
  Mic
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatDate } from '../utils/formatters';
import { filterTransactions, calculateKPIs, getDailyChartData, getCategoryChartData } from '../utils/calculations';
import DashboardInsights from './DashboardInsights';

interface DashboardProps {
  state: AppState;
  isLoading: boolean;
  onUpdateFilters: (filters: Partial<Filters>) => void;
  onAddRecord: () => void;
  onAddRecordVoice?: () => void;
  onScanIA: () => void;
  onOpenImport: () => void;
  onGoToReminders?: () => void;
  onGoToGoals?: () => void;
  theme: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ state, isLoading, onUpdateFilters, onAddRecord, onAddRecordVoice, onScanIA, onOpenImport, onGoToReminders, onGoToGoals, theme }) => {
  const filteredTransactions = useMemo(() => {
    const dashboardFilters: Filters = {
      ...state.filters,
      search: '',
      categoryId: 'all',
      type: 'all',
      startDate: state.dashboardFilters.startDate,
      endDate: state.dashboardFilters.endDate,
      period: state.dashboardFilters.period
    };
    return filterTransactions(state.transactions, dashboardFilters);
  }, [state.transactions, state.dashboardFilters]);

  const kpis = useMemo(() =>
    calculateKPIs(filteredTransactions, state.dashboardFilters.period),
    [filteredTransactions, state.dashboardFilters.period]
  );

  const dailyData = useMemo(() =>
    getDailyChartData(filteredTransactions, state.dashboardFilters.period),
    [filteredTransactions, state.dashboardFilters.period]
  );

  const categoryData = useMemo(() =>
    getCategoryChartData(filteredTransactions, state.categories),
    [filteredTransactions, state.categories]
  );

  const upcomingReminders = useMemo(() => {
    return state.reminders
      .filter(r => r.status === 'pendente')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
  }, [state.reminders]);

  const topCategoryName = state.categories.find(c => c.id === kpis.topCategoryId)?.name || 'N/A';

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl" />)}
        </div>
        <div className="h-[300px] bg-zinc-100 dark:bg-zinc-800/50 rounded-[2.5rem]" />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    const g = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const namePart = state.userName ? `, ${state.userName.split(' ')[0]}` : "";
    return `${g}${namePart}`;
  };

  return (
    <div className="space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      
      {/* Hero Section */}
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          {greeting()}! 
          <span className="text-blue-500 animate-pulse">👋</span>
        </h2>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
           Aqui está o resumo da sua jornada financeira.
        </p>
      </header>

      {/* Central de Ações Rápidas (HUB) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          state.userPlan === 'pro' 
            ? { 
                label: 'Lançamento por Áudio', 
                sub: 'Grave e deixe a IA lançar', 
                icon: Mic, 
                color: 'indigo', 
                action: onAddRecordVoice 
              }
            : { 
                label: 'Novo Registro', 
                sub: 'Lançamento manual rápido', 
                icon: Calendar, 
                color: 'blue', 
                action: onAddRecord 
              },
          { 
            label: 'Importar Extrato', 
            sub: 'Processar arquivo via IA', 
            icon: FileText, 
            color: 'emerald', 
            action: onOpenImport 
          },
          { 
            label: 'Scan Inteligente', 
            sub: 'Lançar via foto da nota', 
            icon: Camera, 
            color: 'amber', 
            action: onScanIA,
            isPro: true 
          }
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className={`group flex flex-col items-start p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden`}
          >
            <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center bg-${item.color}-500/10 text-${item.color}-500 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
              <item.icon size={24} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-white text-sm">{item.label}</span>
                {item.isPro && <Sparkles size={12} className="text-amber-500 animate-pulse" />}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-tight">{item.sub}</p>
            </div>
            
            {/* Efeito Visual Sutil */}
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${item.color}-500/5 rounded-full group-hover:scale-150 transition-transform blur-2xl`} />
          </button>
        ))}
      </section>

      {/* Insights Section - Prominence Refined */}
      {state.userPlan === 'pro' && (
        <DashboardInsights 
          transactions={state.transactions} 
          categories={state.categories} 
          goals={state.goals}
          filters={state.dashboardFilters}
        />
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Entradas', value: kpis.totalIncomes, icon: ArrowUpCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Saídas', value: kpis.totalExpenses, icon: ArrowDownCircle, color: 'text-rose-500', bg: 'bg-rose-500/5' },
          { label: 'Saldo Atual', value: kpis.totalIncomes - kpis.totalExpenses, icon: TrendingDown, color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { label: 'Top Categoria', value: topCategoryName, icon: Tag, color: 'text-zinc-500', bg: 'bg-zinc-500/5', isCurrency: false },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-[1.75rem] shadow-sm flex flex-col justify-between group hover:border-zinc-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.15em]">{item.label}</span>
              <div className={`p-1.5 ${item.bg} rounded-lg ${item.color}`}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white truncate">
              {item.isCurrency === false ? item.value : formatCurrency(item.value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fluxo de Caixa */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm">
          <header className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Fluxo de Caixa</h3>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg flex gap-1">
              {(['7d', '30d', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => onUpdateFilters({ period: p })}
                  className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${state.dashboardFilters.period === p ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                >
                  {p === '7d' ? '7D' : p === '30d' ? '30D' : 'Total'}
                </button>
              ))}
            </div>
          </header>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.split('-')[2]} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [formatCurrency(v), 'Gasto']}
                />
                <Line type="step" dataKey="amount" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categorias */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">Top Categorias</h3>
          <div className="flex-1 space-y-5">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">{cat.name}</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(cat.value)}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((cat.value / (kpis.totalExpenses || 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals & Reminders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Suas Metas</h3>
            <button onClick={onGoToGoals} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
          </div>
          <div className="space-y-4">
            {state.goals.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Nenhuma meta ativa no momento.</p>
            ) : (
              state.goals.slice(0, 2).map(goal => (
                <div key={goal.id} className="p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Target size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{goal.title}</h4>
                    <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lembretes Próximos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Próximas Contas</h3>
            <button onClick={onGoToReminders} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
          </div>
          <div className="space-y-3">
             {upcomingReminders.length === 0 ? (
               <p className="text-xs text-zinc-500 italic">Tudo em dia!</p>
             ) : (
               upcomingReminders.map(rem => (
                 <div key={rem.id} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
                   <div className="min-w-0">
                     <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{rem.title}</p>
                     <p className="text-[10px] text-zinc-400 font-medium">{formatDate(rem.dueDate)}</p>
                   </div>
                   <span className="text-sm font-black text-zinc-900 dark:text-white shrink-0 ml-4">{formatCurrency(rem.amount)}</span>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
