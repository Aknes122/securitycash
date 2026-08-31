
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

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  goals: Goal[];
  installments: Installment[];
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

export type Page = 'dashboard' | 'records' | 'categories' | 'comparison' | 'reminders' | 'goals' | 'profile' | 'installments' | 'chat';

export type AIActionType = 
  | 'add_transaction'
  | 'add_goal'
  | 'update_goal'
  | 'add_reminder'
  | 'set_base_salary'
  | 'add_category';

export interface AIActionAddTransaction {
  type: 'add_transaction';
  data: {
    transactionType: TransactionType;
    description: string;
    amount: number;
    date?: string;
    categoryName?: string;
  };
}

export interface AIActionAddGoal {
  type: 'add_goal';
  data: {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
  };
}

export interface AIActionUpdateGoal {
  type: 'update_goal';
  data: {
    goalTitle: string;
    amountToAdd: number;
  };
}

export interface AIActionAddReminder {
  type: 'add_reminder';
  data: {
    title: string;
    amount: number;
    dueDate: string;
  };
}

export interface AIActionSetBaseSalary {
  type: 'set_base_salary';
  data: {
    amount: number;
  };
}

export interface AIActionAddCategory {
  type: 'add_category';
  data: {
    name: string;
    kind: TransactionType;
  };
}

export type AIAction = 
  | AIActionAddTransaction
  | AIActionAddGoal
  | AIActionUpdateGoal
  | AIActionAddReminder
  | AIActionSetBaseSalary
  | AIActionAddCategory;

export interface ExecutedActionResult {
  actionType: AIActionType;
  summary: string;
  success: boolean;
}

