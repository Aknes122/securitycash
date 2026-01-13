
import { Transaction, PeriodFilter, Filters, Category } from '../types';
import { parseISO } from './formatters';

export const filterTransactions = (
  transactions: Transaction[],
  filters: Filters
): Transaction[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return transactions.filter((t) => {
    // Exact Date Range filter (prioritizes over fixed period if either is set)
    const hasDateRange = filters.startDate || filters.endDate;

    if (hasDateRange) {
      if (filters.startDate && t.date < filters.startDate) {
        return false;
      }
      if (filters.endDate && t.date > filters.endDate) {
        return false;
      }
    }

    // Period filter - Only applies if NO specific date range is selected
    if (!hasDateRange) {
      const tDate = parseISO(t.date);
      if (filters.period === '7d') {
        const diffTime = now.getTime() - tDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (filters.period === '30d') {
        const diffTime = now.getTime() - tDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30 || diffDays < 0) return false;
      }
    }

    // Category filter
    if (filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) {
      return false;
    }

    // Search filter
    if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filters.type !== 'all' && t.type !== filters.type) {
      return false;
    }

    return true;
  });
};

export const calculateKPIs = (transactions: Transaction[], period: PeriodFilter) => {
  const incomes = transactions.filter(t => t.type === 'entrada');
  const expenses = transactions.filter(t => t.type === 'despesa');

  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Gasto Médio Diário
  let daysCount = 0;
  if (period === '7d') daysCount = 7;
  else if (period === '30d') daysCount = 30;
  else {
    if (transactions.length > 0) {
      const dates = transactions.map(t => parseISO(t.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      daysCount = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;
    } else {
      daysCount = 1;
    }
  }
  const avgDaily = totalExpenses / daysCount;

  // Categoria com maior gasto
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
  });

  let topCategoryId = '';
  let topCategoryValue = 0;
  Object.entries(categoryTotals).forEach(([catId, total]) => {
    if (total > topCategoryValue) {
      topCategoryValue = total;
      topCategoryId = catId;
    }
  });

  return { totalIncomes, totalExpenses, avgDaily, topCategoryId, topCategoryValue };
};

export const getDailyChartData = (transactions: Transaction[], period: PeriodFilter) => {
  const expenses = transactions.filter(t => t.type === 'despesa');
  const daily: Record<string, number> = {};

  // For 7d and 30d, fill missing days with zero
  // For 7d and 30d, fill missing days with zero
  if (period !== 'all') {
    let days = 0;
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === '7d') {
      days = 7;
    } else if (period === '30d') {
      days = 30;
    } else if (period === 'custom' && transactions.length > 0) {
      // For custom, we might want to fill between min/max or specific filter range
      // But getDailyChartData doesn't have access to Filters.
      // Let's at least handle the basic fixed periods. 
      // If custom, we'll just use what's in transactions.
      days = 0;
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      daily[iso] = 0;
    }
  }

  expenses.forEach(t => {
    if (daily[t.date] !== undefined || period === 'all') {
      daily[t.date] = (daily[t.date] || 0) + t.amount;
    }
  });

  return Object.entries(daily)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getCategoryChartData = (transactions: Transaction[], categories: Category[]) => {
  const expenses = transactions.filter(t => t.type === 'despesa');
  const totals: Record<string, number> = {};

  expenses.forEach(t => {
    totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
  });

  return Object.entries(totals)
    .map(([catId, total]) => ({
      name: categories.find(c => c.id === catId)?.name || 'Outros',
      value: total
    }))
    .sort((a, b) => b.value - a.value);
};
