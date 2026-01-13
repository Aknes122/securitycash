
export type TransactionType = 'entrada' | 'despesa';
export type UserPlan = 'basic' | 'pro';

export interface Category {
  id: string;
  name: string;
  kind: TransactionType;
  color?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO format YYYY-MM-DD
  description: string;
  categoryId: string;
  amount: number;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string; // ISO format YYYY-MM-DD
  amount: number;
  status: 'pendente' | 'pago';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export type PeriodFilter = '7d' | '30d' | 'all';

export interface Filters {
  period: PeriodFilter;
  categoryId: string;
  search: string;
  type: 'all' | TransactionType;
  startDate: string;
  endDate: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  goals: Goal[];
  filters: Filters;
  userPlan: UserPlan;
}

export type Page = 'dashboard' | 'records' | 'categories' | 'comparison' | 'reminders' | 'goals' | 'profile';
