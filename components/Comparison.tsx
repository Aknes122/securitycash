
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { formatCurrency, parseISO } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface ComparisonProps {
  state: AppState;
}

const Comparison: React.FC<ComparisonProps> = ({ state }) => {
  const comparisonData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    const currentMonthTransactions = state.transactions.filter(t => {
      const d = parseISO(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthTransactions = state.transactions.filter(t => {
      const d = parseISO(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
    });

    const currentExpenses = currentMonthTransactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const prevExpenses = prevMonthTransactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    
    const currentIncomes = currentMonthTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
    const prevIncomes = prevMonthTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);

    const catData = state.categories.filter(c => c.kind === 'despesa').map(cat => {
      const curAmt = currentMonthTransactions.filter(t => t.categoryId === cat.id).reduce((acc, t) => acc + t.amount, 0);
      const prevAmt = prevMonthTransactions.filter(t => t.categoryId === cat.id).reduce((acc, t) => acc + t.amount, 0);
      return {
        name: cat.name,
        atual: curAmt,
        anterior: prevAmt
      };
    }).filter(d => d.atual > 0 || d.anterior > 0);

    return {
      currentExpenses,
      prevExpenses,
      currentIncomes,
      prevIncomes,
      catData,
      currentMonthName: now.toLocaleString('pt-BR', { month: 'long' }),
      prevMonthName: prevMonthDate.toLocaleString('pt-BR', { month: 'long' })
    };
  }, [state.transactions, state.categories]);

  const getVariaçao = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };

  const insights = useMemo(() => {
    const list: string[] = [];
    comparisonData.catData.forEach(cat => {
      const diff = cat.atual - cat.anterior;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          list.push(`Seus gastos em ${cat.name} aumentaram ${formatCurrency(diff)} em relação ao mês de ${comparisonData.prevMonthName}.`);
        } else {
          list.push(`Parabéns! Você economizou ${formatCurrency(Math.abs(diff))} em ${cat.name} comparado ao mês anterior.`);
        }
      }
    });
    
    if (comparisonData.currentExpenses < comparisonData.prevExpenses) {
      list.push(`No geral, você está gastando menos este mês. Continue assim!`);
    }

    return list.slice(0, 4);
  }, [comparisonData]);

  const MetricCard = ({ title, current, prev, inverse = false }: { title: string, current: number, prev: number, inverse?: boolean }) => {
    const diff = getVariaçao(current, prev);
    const isIncrease = diff > 0;
    const isGood = inverse ? !isIncrease : isIncrease;

    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-3 shadow-sm">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</h4>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{formatCurrency(current)}</p>
          <div className={`flex items-center gap-1 text-xs font-bold ${diff === 0 ? 'text-zinc-400' : (isGood ? 'text-emerald-500' : 'text-rose-500')}`}>
            {diff > 0 ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {Math.abs(diff).toFixed(1)}%
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Anterior: {formatCurrency(prev)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-2xl font-bold capitalize text-zinc-900 dark:text-white">Comparativo Mensal</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{comparisonData.currentMonthName} vs {comparisonData.prevMonthName}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard title="Total Recebido" current={comparisonData.currentIncomes} prev={comparisonData.prevIncomes} />
        <MetricCard title="Total Gasto" current={comparisonData.currentExpenses} prev={comparisonData.prevExpenses} inverse={true} />
        <MetricCard title="Economia Real" current={comparisonData.currentIncomes - comparisonData.currentExpenses} prev={comparisonData.prevIncomes - comparisonData.prevExpenses} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Gastos por Categoria</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData.catData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:[stroke:#27272a]" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '12px' }}
                  labelStyle={{ color: '#52525b', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ color: '#18181b', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(val: number) => [formatCurrency(val), 'Total']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                <Bar name="Mês Anterior" dataKey="anterior" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                <Bar name="Mês Atual" dataKey="atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">Diferenças Notáveis</h3>
          </div>
          <div className="space-y-4">
            {insights.length > 0 ? insights.map((insight, idx) => (
              <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed shadow-sm">
                {insight}
              </div>
            )) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-xs italic text-center py-10 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                Aguardando mais dados para comparar...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
