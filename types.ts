
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

export interface Installment {
  id: string;
  title: string;
  totalInstallments: number;
  paidInstallments: number;
  amountPerInstallment: number;
  dueDateDay: number; // Day of the month the installment is due (1-31)
  categoryId: string; // Category ID linked to this installment
  status: 'ativo' | 'concluido';
  description?: string;
}

export type PeriodFilter = '7d' | '30d' | 'all' | 'custom';

export interface Filters {
  period: PeriodFilter;
  categoryId: string;
  search: string;
  type: 'all' | TransactionType;
  startDate: string;
  endDate: string;
}

export interface RoutineEvent {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  type: 'tarefa' | 'reuniao' | 'lembrete';
  isAllDay: boolean;
  date: string; // ISO format YYYY-MM-DD
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  recurrence: 'none' | 'daily' | 'weekly' | 'custom_days';
  customDays?: number[]; // 0-6 for Sunday-Saturday if weekly/custom
  color?: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  goals: Goal[];
  installments: Installment[];
  routineEvents: RoutineEvent[];
  filters: Filters;
  dashboardFilters: {
    period: PeriodFilter;
    startDate: string;
    endDate: string;
  };
  userPlan: UserPlan;
  userName?: string;
  baseSalary?: number;
}

export type Page = 'dashboard' | 'records' | 'categories' | 'comparison' | 'reminders' | 'goals' | 'profile' | 'installments' | 'routine';
