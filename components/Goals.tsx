
import React, { useState } from 'react';
import { AppState, Goal } from '../types';
import { Target, Plus, X, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Text } from 'recharts';

interface GoalsProps {
  state: AppState;
  onAddGoal: (g: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (id: string, g: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
}

const Goals: React.FC<GoalsProps> = ({ state, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setTitle(goal.title);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setDeadline(goal.deadline || '');
    } else {
      setEditingGoal(null);
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    const data = {
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || '0'),
      deadline: deadline || undefined
    };

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, data);
    } else {
      onAddGoal(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-emerald-500" />
            Minhas Metas
          </h2>
          <p className="text-zinc-500 text-sm">Acompanhe seus sonhos e objetivos financeiros.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nova Meta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.goals.length > 0 ? state.goals.map(goal => {
          const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          const data = [
            { name: 'Concluído', value: goal.currentAmount },
            { name: 'Restante', value: Math.max(goal.targetAmount - goal.currentAmount, 0) },
          ];

          return (
            <div key={goal.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{goal.title}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {goal.deadline ? `Até ${formatDate(goal.deadline)}` : 'Sem prazo'}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(goal)} className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDeleteGoal(goal.id)} className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{percent}%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Já poupado</p>
                    <p className="text-lg font-bold text-emerald-500">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Objetivo</p>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>
              </div>

              {percent >= 100 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={16} />
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Meta Alcançada!</p>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center space-y-4 bg-zinc-100 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl">
            <Target size={48} className="mx-auto text-zinc-300 dark:text-zinc-700" />
            <div>
              <p className="text-zinc-400 dark:text-zinc-300 font-bold">Nenhuma meta cadastrada</p>
              <p className="text-zinc-500 text-sm">Comece a planejar seus sonhos hoje mesmo.</p>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 relative shadow-2xl animate-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-8">
              {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">O que você quer conquistar?</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  placeholder="Ex: Reserva de Emergência, Carro..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor Alvo</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="0,00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Já tenho</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="0,00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Prazo (Opcional)</label>
                <input
                  type="date"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
