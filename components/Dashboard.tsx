
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
  Cell,
  AreaChart,
  Area
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
    <div className="space-y-10 pb-12 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Hero Section */}
      <header className="flex flex-col gap-1 relative">
        <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
          {greeting()}! 
          <span className="text-blue-500 animate-bounce">👋</span>
        </h2>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
           Transformando seus dados em poder financeiro. Aqui está o que preparamos para você hoje.
        </p>
      </header>

      {/* Central de Ações Rápidas (HUB) - Premium Glass Design */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          state.userPlan === 'pro' 
            ? { 
                label: 'Lançamento por Áudio', 
                sub: 'Grave e deixe a IA lançar', 
                icon: Mic, 
                color: 'blue', 
                action: onAddRecordVoice 
              }
            : { 
                label: 'Novo Registro', 
                sub: 'Lançamento manual rápido', 
                icon: Calendar, 
                color: 'zinc', 
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
            className="group relative flex flex-col items-start p-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-zinc-500/10 dark:hover:shadow-white/5 hover:-translate-y-1 active:scale-[0.98] transition-all duration-500 overflow-hidden text-left"
          >
            {/* Background Glow */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-${item.color}-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className={`mb-6 w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-500`}>
              <item.icon size={28} className={`text-${item.color === 'zinc' ? 'blue' : item.color}-500`} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-zinc-900 dark:text-white text-base tracking-tight">{item.label}</span>
                {item.isPro && (
                  <div className="px-1.5 py-0.5 bg-amber-500/10 rounded-md">
                    <Sparkles size={10} className="text-amber-500" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-normal">{item.sub}</p>
            </div>
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

      {/* Primary Metrics Grid - Clean & Minimalist */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Entradas', value: kpis.totalIncomes, icon: ArrowUpCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Saídas', value: kpis.totalExpenses, icon: ArrowDownCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Saldo Atual', value: kpis.totalIncomes - kpis.totalExpenses, icon: TrendingDown, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Top Categoria', value: topCategoryName, icon: Tag, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', isCurrency: false },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">{item.label}</span>
              <div className={`p-2 ${item.bg} rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={18} />
              </div>
            </div>
            
            <div className="flex items-end justify-between relative z-10 gap-2">
              <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white truncate tracking-tighter">
                {item.isCurrency === false ? item.value : formatCurrency(item.value as number)}
              </p>
              
              {item.label === 'Saldo Atual' && (
                <div className="w-12 h-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                      strokeDashoffset={100 - (Math.max(0, Math.min(100, ((kpis.totalIncomes - kpis.totalExpenses) / (kpis.totalIncomes || 1)) * 100)))}
                      className="text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Subtle Gradient Glow */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none`} />
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
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888811" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickFormatter={(v) => v.split('-')[2]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#888888' }}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', 
                    borderRadius: '16px', 
                    border: '1px solid ' + (theme === 'dark' ? '#27272a' : '#f4f4f5'), 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(v: number) => [formatCurrency(v), 'Gasto']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)"
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 8, strokeOpacity: 0.2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categorias */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm flex flex-col group hover:border-blue-500/30 transition-all duration-300">
          <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">Top Categorias</h3>
          <div className="flex-1 space-y-6">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="space-y-2 group/item">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-zinc-900 dark:text-white">{formatCurrency(cat.value)}</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110" 
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
