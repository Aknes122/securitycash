
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
  Bell
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

interface DashboardProps {
  state: AppState;
  isLoading: boolean;
  onUpdateFilters: (filters: Partial<Filters>) => void;
  onAddRecord: () => void;
  onScanIA: () => void;
  onGoToReminders?: () => void;
  onGoToGoals?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, isLoading, onUpdateFilters, onAddRecord, onScanIA, onGoToReminders, onGoToGoals }) => {
  const filteredTransactions = useMemo(() => {
    // A Dashboard ignora filtros de pesquisa e categoria para mostrar dados gerais do período
    const dashboardFilters: Filters = {
      ...state.filters,
      search: '',
      categoryId: 'all',
      type: 'all',
      // Se for personalizado, mantém as datas. Senão, limpa para usar a lógica de período (7d/30d/all)
      startDate: state.filters.period === 'custom' ? state.filters.startDate : '',
      endDate: state.filters.period === 'custom' ? state.filters.endDate : ''
    };
    return filterTransactions(state.transactions, dashboardFilters);
  }, [state.transactions, state.filters.period, state.filters.startDate, state.filters.endDate]);

  const kpis = useMemo(() =>
    calculateKPIs(filteredTransactions, state.filters.period),
    [filteredTransactions, state.filters.period]
  );

  const dailyData = useMemo(() =>
    getDailyChartData(filteredTransactions, state.filters.period),
    [filteredTransactions, state.filters.period]
  );

  const categoryData = useMemo(() =>
    getCategoryChartData(filteredTransactions, state.categories),
    [filteredTransactions, state.categories]
  );

  const upcomingReminders = useMemo(() => {
    return state.reminders
      .filter(r => r.status === 'pendente')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [state.reminders]);

  const topCategoryName = state.categories.find(c => c.id === kpis.topCategoryId)?.name || 'N/A';

  if (isLoading) {
    return <div className="space-y-8 animate-pulse"><div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 transition-colors duration-300">
      <header className="flex items-center justify-between gap-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </header>

      {/* Ações Inteligentes - Grid ajustado para mobile */}
      {state.userPlan === 'pro' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={onScanIA}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-[2.5rem] flex items-center gap-4 sm:gap-6 shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.99]"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
              <Camera size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2 truncate">
                Scan Inteligente
                <Sparkles size={14} className="text-amber-500 animate-pulse shrink-0" />
              </h4>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 truncate">Lançamento automático via foto.</p>
            </div>
            <ChevronRight className="text-zinc-300 group-hover:translate-x-1 transition-transform shrink-0" size={18} />
          </button>

          <button
            onClick={onAddRecord}
            className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-[2.5rem] flex items-center gap-4 sm:gap-6 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.99]"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-inner shrink-0">
              <Calendar size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">Lançamento Manual</h4>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 truncate">Registre despesas rapidamente.</p>
            </div>
            <ChevronRight className="text-zinc-300 group-hover:translate-x-1 transition-transform shrink-0" size={18} />
          </button>
        </section>
      )}

      {/* Filtro de Período - Logo acima das métricas */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 flex shadow-sm w-fit">
          {(['7d', '30d', 'all', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => onUpdateFilters({ period: p })}
              className={`px-3 sm:px-5 py-2 text-[10px] sm:text-xs rounded-md font-medium transition-all ${state.filters.period === p ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === 'all' ? 'Total' : 'Personalizado'}
            </button>
          ))}
        </div>

        {state.filters.period === 'custom' && (
          <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Início</label>
              <input
                type="date"
                value={state.filters.startDate}
                onChange={(e) => onUpdateFilters({ startDate: e.target.value })}
                className="h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Fim</label>
              <input
                type="date"
                value={state.filters.endDate}
                onChange={(e) => onUpdateFilters({ endDate: e.target.value })}
                className="h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPIs Grid - Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Entradas', value: kpis.totalIncomes, icon: ArrowUpCircle, color: 'text-emerald-500' },
          { label: 'Saídas', value: kpis.totalExpenses, icon: ArrowDownCircle, color: 'text-rose-500' },
          { label: 'Saldo', value: kpis.totalIncomes - kpis.totalExpenses, icon: TrendingDown, color: 'text-blue-500' },
          { label: 'Maior Gasto', value: topCategoryName, icon: Tag, color: 'text-amber-500', isCurrency: false },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 rounded-3xl space-y-1 sm:space-y-2 shadow-sm min-w-0">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest truncate mr-1">{item.label}</span>
              <item.icon size={14} className={`${item.color} sm:w-4 sm:h-4`} />
            </div>
            <p className={`font-black text-zinc-900 dark:text-white truncate ${item.isCurrency === false ? 'text-xs sm:text-lg' : 'text-sm sm:text-2xl'}`}>
              {item.isCurrency === false ? item.value : formatCurrency(item.value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos em Grid Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-sm h-[280px] sm:h-[320px]">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Evolução Diária</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
              <XAxis dataKey="date" fontSize={9} tickFormatter={(v) => formatDate(v).split('/')[0]} />
              <YAxis fontSize={9} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderRadius: '12px',
                  border: '1px solid #27272a',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  padding: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'Gasto']}
              />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-sm h-[280px] sm:h-[320px]">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={9} width={70} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderRadius: '12px',
                  border: '1px solid #27272a',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  padding: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'Total']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metas Ativas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 rounded-[2rem] space-y-6 sm:space-y-8 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                <Target size={18} />
              </div>
              Metas Ativas
            </h3>
            <button onClick={onGoToGoals} className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase hover:underline flex items-center gap-1 transition-all">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {state.goals.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                  <Target size={32} />
                </div>
                <h4 className="text-zinc-900 dark:text-white font-bold mb-2">Sem metas ativas</h4>
                <p className="text-zinc-500 text-xs mb-6 max-w-[250px]">Defina objetivos para economizar e realize seus sonhos mais rápido.</p>
                <button
                  onClick={onGoToGoals}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Criar Nova Meta
                </button>
              </div>
            ) : (
              state.goals.slice(0, 3).map(goal => {
                const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                const pieData = [
                  { name: 'Poupado', value: goal.currentAmount },
                  { name: 'Restante', value: Math.max(goal.targetAmount - goal.currentAmount, 0) },
                ];

                return (
                  <div key={goal.id} className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-emerald-500/30 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-300 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0 group-hover:scale-105 transition-transform">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={32}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">{percent}%</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold truncate text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{goal.title}</h4>
                      <div className="space-y-0.5">
                        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">Falta {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500">{formatCurrency(goal.currentAmount)} poupados</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lembretes */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                <Bell size={18} />
              </div>
              Contas a Vencer
            </h3>
            <button onClick={onGoToReminders} className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase hover:underline flex items-center gap-1 transition-all">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {upcomingReminders.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-8 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Tudo tranquilo!</h4>
                    <p className="text-xs text-zinc-500">Nenhuma conta próxima de vencer.</p>
                  </div>
                </div>
              </div>
            ) : (
              upcomingReminders.map(rem => (
                <div key={rem.id} className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex justify-between items-center hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{rem.title}</p>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-medium">
                      <Calendar size={12} className="text-blue-400 shrink-0" />
                      Vence {formatDate(rem.dueDate)}
                    </p>
                  </div>
                  <div className="text-right space-y-1 shrink-0 ml-3">
                    <p className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(rem.amount)}</p>
                    {new Date(rem.dueDate) < new Date() && rem.status === 'pendente' && (
                      <span className="inline-block px-2 py-0.5 bg-rose-500/10 text-[8px] font-black text-rose-500 uppercase tracking-widest rounded-full border border-rose-500/20">Atrasado</span>
                    )}
                  </div>
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
