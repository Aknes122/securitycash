
import React, { useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction;
  onSubmit: (data: Partial<Transaction>) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onSubmit, onCancel }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'despesa');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!description) newErrors.description = 'Descrição é obrigatória';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valor deve ser maior que zero';
    if (!date) newErrors.date = 'Data é obrigatória';
    if (type === 'despesa' && !categoryId) newErrors.categoryId = 'Categoria é obrigatória para despesas';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        type,
        date,
        categoryId: type === 'entrada' && !categoryId ? categories.find(c => c.kind === 'entrada')?.id || '' : categoryId,
        description,
        amount: parseFloat(amount)
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-zinc-900 dark:text-zinc-100">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tipo</label>
        <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setType('entrada')}
            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'entrada' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'despesa' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
          >
            Despesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Data</label>
          <input
            type="date"
            className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.date ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <p className="text-[10px] text-rose-500">{errors.date}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <p className="text-[10px] text-rose-500">{errors.amount}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Categoria</label>
        <select
          className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.categoryId ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {categories
            .filter(c => c.kind === type)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
        {errors.categoryId && <p className="text-[10px] text-rose-500">{errors.categoryId}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Descrição</label>
        <input
          type="text"
          className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.description ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100`}
          placeholder="Ex: Aluguel, Supermercado..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <p className="text-[10px] text-rose-500">{errors.description}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-80 text-zinc-700 dark:text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
