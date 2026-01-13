
import React, { useState, useMemo } from 'react';
import { AppState, Reminder } from '../types';
import { Bell, Plus, Calendar, CheckCircle2, Circle, Trash2, Edit2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface RemindersProps {
  state: AppState;
  onAddReminder: (r: Omit<Reminder, 'id'>) => void;
  onUpdateReminder: (id: string, r: Partial<Reminder>) => void;
  onDeleteReminder: (id: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ state, onAddReminder, onUpdateReminder, onDeleteReminder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'pendente' | 'pago'>('pendente');

  const openModal = (rem?: Reminder) => {
    if (rem) {
      setEditingReminder(rem);
      setTitle(rem.title);
      setDueDate(rem.dueDate);
      setAmount(rem.amount.toString());
      setStatus(rem.status);
    } else {
      setEditingReminder(null);
      setTitle('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setStatus('pendente');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !amount) return;

    const data = {
      title,
      dueDate,
      amount: parseFloat(amount),
      status
    };

    if (editingReminder) {
      onUpdateReminder(editingReminder.id, data);
    } else {
      onAddReminder(data);
    }
    setIsModalOpen(false);
  };

  const sortedReminders = useMemo(() => {
    return [...state.reminders].sort((a, b) => {
      if (a.status === b.status) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return a.status === 'pendente' ? -1 : 1;
    });
  }, [state.reminders]);

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const pendingCount = state.reminders.filter(r => r.status === 'pendente').length;
    const overdueCount = state.reminders.filter(r => {
      const d = new Date(r.dueDate);
      return r.status === 'pendente' && d < now;
    }).length;

    return { pendingCount, overdueCount };
  }, [state.reminders]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="text-blue-500" />
            Meus Lembretes
          </h2>
          <p className="text-zinc-500 text-sm">Organize seus vencimentos e pagamentos importantes.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Novo Lembrete
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase font-semibold">Pendentes</span>
            <p className="text-3xl font-bold">{stats.pendingCount}</p>
          </div>
          <Bell size={32} className="text-zinc-700" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-rose-500 uppercase font-semibold">Atrasados</span>
            <p className="text-3xl font-bold text-rose-500">{stats.overdueCount}</p>
          </div>
          <AlertCircle size={32} className="text-rose-500/20" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {sortedReminders.length > 0 ? sortedReminders.map(rem => {
            const isOverdue = rem.status === 'pendente' && new Date(rem.dueDate) < new Date();
            const isPaid = rem.status === 'pago';

            return (
              <div key={rem.id} className={`p-4 hover:bg-zinc-800/20 transition-colors flex items-center gap-4 ${isPaid ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => onUpdateReminder(rem.id, { status: isPaid ? 'pendente' : 'pago' })}
                  className={`flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div className="flex-1 space-y-0.5">
                  <h4 className={`font-semibold text-sm ${isPaid ? 'line-through text-zinc-500' : ''}`}>
                    {rem.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(rem.dueDate)}
                    </span>
                    <span className="font-medium text-zinc-300">
                      {formatCurrency(rem.amount)}
                    </span>
                    {isOverdue && (
                      <span className="bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                        Atrasado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(rem)}
                    className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteReminder(rem.id)}
                    className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                <Bell size={24} />
              </div>
              <div>
                <p className="text-sm font-medium">Nenhum lembrete cadastrado</p>
                <p className="text-xs text-zinc-600">Adicione suas faturas e boletos para não esquecer.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative shadow-2xl animate-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Título do Boleto / Cartão</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Fatura Nubank, Aluguel..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vencimento</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
