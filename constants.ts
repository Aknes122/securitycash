
import { Category, Transaction, Reminder, Goal } from './types';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat_alimentacao', name: 'Alimentação', kind: 'despesa' },
  { id: 'cat_transporte', name: 'Transporte', kind: 'despesa' },
  { id: 'cat_moradia', name: 'Moradia', kind: 'despesa' },
  { id: 'cat_lazer', name: 'Lazer', kind: 'despesa' },
  { id: 'cat_saude', name: 'Saúde', kind: 'despesa' },
  { id: 'cat_educacao', name: 'Educação', kind: 'despesa' },
  { id: 'cat_assinaturas', name: 'Assinaturas', kind: 'despesa' },
  { id: 'cat_salario', name: 'Salário', kind: 'entrada' },
  { id: 'cat_freela', name: 'Freelance', kind: 'entrada' }
];

// Helper to get dates relative to today
const today = new Date();
const dateAgo = (days: number) => {
  const d = new Date();
  d.setDate(today.getDate() - days);
  return d.toISOString().split('T')[0];
};

const dateForward = (days: number) => {
  const d = new Date();
  d.setDate(today.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'entrada', date: dateAgo(40), description: 'Salário Setembro', categoryId: 'cat_salario', amount: 8000 },
  { id: 't2', type: 'entrada', date: dateAgo(25), description: 'Freelance app', categoryId: 'cat_freela', amount: 1200 },
  { id: 't3', type: 'despesa', date: dateAgo(38), description: 'Mercado Mensal', categoryId: 'cat_alimentacao', amount: 320 },
  { id: 't4', type: 'despesa', date: dateAgo(37), description: 'Almoço Executivo', categoryId: 'cat_alimentacao', amount: 48 },
  { id: 't5', type: 'despesa', date: dateAgo(35), description: 'UBER Shopping', categoryId: 'cat_transporte', amount: 36 },
  { id: 't6', type: 'despesa', date: dateAgo(34), description: 'Aluguel Apto', categoryId: 'cat_moradia', amount: 2500 },
  { id: 't7', type: 'despesa', date: dateAgo(32), description: 'Netflix/Spotify', categoryId: 'cat_assinaturas', amount: 39 },
  { id: 't8', type: 'despesa', date: dateAgo(30), description: 'Cinema', categoryId: 'cat_lazer', amount: 55 },
  { id: 't9', type: 'despesa', date: dateAgo(28), description: 'Remédios', categoryId: 'cat_saude', amount: 68 },
  { id: 't10', type: 'despesa', date: dateAgo(26), description: 'Gasolina', categoryId: 'cat_transporte', amount: 220 },
  { id: 't11', type: 'entrada', date: dateAgo(20), description: 'Freelance site', categoryId: 'cat_freela', amount: 900 },
  { id: 't12', type: 'despesa', date: dateAgo(19), description: 'Supermercado', categoryId: 'cat_alimentacao', amount: 410 },
  { id: 't13', type: 'despesa', date: dateAgo(18), description: 'Plano de saúde', categoryId: 'cat_saude', amount: 350 },
  { id: 't14', type: 'despesa', date: dateAgo(17), description: 'Curso React', categoryId: 'cat_educacao', amount: 199 },
  { id: 't15', type: 'despesa', date: dateAgo(15), description: 'Pizza Sexta', categoryId: 'cat_alimentacao', amount: 79 },
  { id: 't16', type: 'despesa', date: dateAgo(13), description: 'UBER Trabalho', categoryId: 'cat_transporte', amount: 28 },
  { id: 't17', type: 'despesa', date: dateAgo(11), description: 'Conta de Internet', categoryId: 'cat_moradia', amount: 120 },
  { id: 't18', type: 'entrada', date: dateAgo(10), description: 'Salário Outubro', categoryId: 'cat_salario', amount: 8000 },
  { id: 't19', type: 'despesa', date: dateAgo(8), description: 'Mercado Rápido', categoryId: 'cat_alimentacao', amount: 340 },
  { id: 't20', type: 'despesa', date: dateAgo(7), description: 'Farmácia', categoryId: 'cat_saude', amount: 95 },
  { id: 't21', type: 'despesa', date: dateAgo(6), description: 'Assinatura SaaS', categoryId: 'cat_assinaturas', amount: 59 },
  { id: 't22', type: 'despesa', date: dateAgo(4), description: 'Passeio Parque', categoryId: 'cat_lazer', amount: 120 },
  { id: 't23', type: 'despesa', date: dateAgo(2), description: 'Bilhete Único', categoryId: 'cat_transporte', amount: 12 },
  { id: 't24', type: 'despesa', date: dateAgo(1), description: 'Gasolina Viagem', categoryId: 'cat_transporte', amount: 210 }
];

export const SEED_REMINDERS: Reminder[] = [
  { id: 'r1', title: 'Fatura Cartão Nubank', dueDate: dateForward(5), amount: 1250.80, status: 'pendente' },
  { id: 'r2', title: 'Boleto Aluguel', dueDate: dateForward(10), amount: 2500.00, status: 'pendente' },
  { id: 'r3', title: 'Conta de Luz', dueDate: dateAgo(2), amount: 185.40, status: 'pago' },
  { id: 'r4', title: 'Internet Fibra', dueDate: dateForward(15), amount: 120.00, status: 'pendente' }
];

export const SEED_GOALS: Goal[] = [
  { id: 'g1', title: 'Reserva de Emergência', targetAmount: 15000, currentAmount: 4500, deadline: dateForward(180) },
  { id: 'g2', title: 'Viagem de Fim de Ano', targetAmount: 5000, currentAmount: 3800, deadline: dateForward(60) },
  { id: 'g3', title: 'Novo Notebook', targetAmount: 8500, currentAmount: 1200, deadline: dateForward(120) }
];

export const STORAGE_KEY = 'securitycash_data_v2';
