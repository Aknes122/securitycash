import React, { useState, useMemo } from 'react';
import { AppState, Installment } from '../types';
import { Receipt, Plus, Edit2, Trash2, Calendar, DollarSign, CreditCard, X, Check, ArrowRight, Percent } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface InstallmentsProps {
  state: AppState;
  onAddInstallment: (i: Omit<Installment, 'id' | 'status'>) => void;
  onUpdateInstallment: (id: string, updates: Partial<Installment>) => void;
  onDeleteInstallment: (id: string) => void;
  onPayInstallment: (id: string) => void;
}

const Installments: React.FC<InstallmentsProps> = ({
  state,
  onAddInstallment,
  onUpdateInstallment,
  onDeleteInstallment,
  onPayInstallment
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amountPerInstallment, setAmountPerInstallment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('');
  const [dueDateDay, setDueDateDay] = useState('');
  const [description, setDescription] = useState('');

  // Tabs State ('ativos' | 'concluidos')
  const [activeTab, setActiveTab] = useState<'ativos' | 'concluidos'>('ativos');

  // Filter Categories to only show 'despesa'
  const expenseCategories = useMemo(() => {
    return state.categories.filter(c => c.kind === 'despesa');
  }, [state.categories]);

  // Set default category when modal opens
  const openModal = (inst?: Installment) => {
    if (inst) {
      setEditingInstallment(inst);
      setTitle(inst.title);
      setCategoryId(inst.categoryId);
      setAmountPerInstallment(inst.amountPerInstallment.toString());
      setTotalInstallments(inst.totalInstallments.toString());
      setPaidInstallments(inst.paidInstallments.toString());
      setDueDateDay(inst.dueDateDay.toString());
      setDescription(inst.description || '');
    } else {
      setEditingInstallment(null);
      setTitle('');
      setCategoryId(expenseCategories[0]?.id || '');
      setAmountPerInstallment('');
      setTotalInstallments('');
      setPaidInstallments('0');
      setDueDateDay('10');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !amountPerInstallment || !totalInstallments || !dueDateDay) return;

    const data = {
      title,
      categoryId,
      amountPerInstallment: parseFloat(amountPerInstallment),
      totalInstallments: parseInt(totalInstallments),
      paidInstallments: parseInt(paidInstallments || '0'),
      dueDateDay: parseInt(dueDateDay),
      description: description || undefined
    };

    if (editingInstallment) {
      onUpdateInstallment(editingInstallment.id, data);
    } else {
      onAddInstallment(data);
    }
    setIsModalOpen(false);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const list = state.installments || [];
    const activeList = list.filter(i => i.status === 'ativo');

    const totalRemainingDebt = activeList.reduce((sum, i) => {
      const remaining = i.totalInstallments - i.paidInstallments;
      return sum + (remaining * i.amountPerInstallment);
    }, 0);

    const monthlyCommitment = activeList.reduce((sum, i) => {
      return sum + i.amountPerInstallment;
    }, 0);

    const totalPaidSum = list.reduce((sum, i) => {
      return sum + (i.paidInstallments * i.amountPerInstallment);
    }, 0);

    const paidCount = list.reduce((sum, i) => sum + i.paidInstallments, 0);
    const totalCount = list.reduce((sum, i) => sum + i.totalInstallments, 0);

    return {
      totalRemainingDebt,
      monthlyCommitment,
      totalPaidSum,
      paidCount,
      totalCount
    };
  }, [state.installments]);

  // Filtered List
  const filteredInstallments = useMemo(() => {
    const list = state.installments || [];
    return list.filter(i => {
      if (activeTab === 'ativos') return i.status === 'ativo';
      return i.status === 'concluido';
    });
  }, [state.installments, activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="text-blue-500" />
            Contas Parceladas
          </h2>
          <p className="text-zinc-500 text-sm">Gerencie suas compras parceladas, financiamentos e contratos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/10"
        >
          <Plus size={20} />
          Novo Parcelamento
        </button>
      </header>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none text-zinc-900 dark:text-zinc-100">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Dívida Ativa Restante</span>
            <p className="text-3xl font-bold text-rose-500">{formatCurrency(stats.totalRemainingDebt)}</p>
          </div>
          <CreditCard size={32} className="text-rose-500/10 dark:text-rose-500/20" />
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none text-zinc-900 dark:text-zinc-100">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Comprometimento Mensal</span>
            <p className="text-3xl font-bold text-amber-500">{formatCurrency(stats.monthlyCommitment)}</p>
          </div>
          <DollarSign size={32} className="text-amber-500/10 dark:text-amber-500/20" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none text-zinc-900 dark:text-zinc-100">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Total de Parcelas Pagas</span>
            <p className="text-3xl font-bold text-emerald-500">
              {stats.paidCount} <span className="text-sm font-normal text-zinc-400">/ {stats.totalCount}</span>
            </p>
          </div>
          <Percent size={32} className="text-emerald-500/10 dark:text-emerald-500/20" />
        </div>
      </div>

      {/* Abas de Navegação (Filtro Ativo / Concluído) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('ativos')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'ativos'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Ativos ({state.installments?.filter(i => i.status === 'ativo').length || 0})
        </button>
        <button
          onClick={() => setActiveTab('concluidos')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'concluidos'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Concluídos ({state.installments?.filter(i => i.status === 'concluido').length || 0})
        </button>
      </div>

      {/* Grade de Parcelamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstallments.length > 0 ? (
          filteredInstallments.map(inst => {
            const category = state.categories.find(c => c.id === inst.categoryId);
            const percent = Math.min(Math.round((inst.paidInstallments / inst.totalInstallments) * 100), 100);
            
            const totalContractValue = inst.totalInstallments * inst.amountPerInstallment;
            const paidValue = inst.paidInstallments * inst.amountPerInstallment;
            const remainingValue = totalContractValue - paidValue;

            return (
              <div
                key={inst.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all group relative"
              >
                {/* Header Card */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 line-clamp-1">{inst.title}</h3>
                    {category && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: category.color || '#94a3b8' }}
                      >
                        {category.name}
                      </span>
                    )}
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(inst)}
                      className="p-1.5 text-zinc-400 hover:text-blue-500 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteInstallment(inst.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Detalhes Financeiros */}
                <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 dark:border-zinc-800/50 py-3 text-sm">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Parcela Mensal</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(inst.amountPerInstallment)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Vencimento</span>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Calendar size={12} />
                      Dia {inst.dueDateDay}
                    </p>
                  </div>
                </div>

                {/* Progresso das Parcelas */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-500">{inst.paidInstallments} de {inst.totalInstallments} parcelas</span>
                    <span className="text-blue-600 dark:text-blue-400">{percent}% pago</span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Resumo de valores pago/restante */}
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl">
                  <div>
                    <span>Pago: </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(paidValue)}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                  <div>
                    <span>Restante: </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(remainingValue)}</span>
                  </div>
                </div>

                {/* Botão de Pagar Próxima Parcela */}
                {inst.status === 'ativo' && (
                  <button
                    onClick={() => onPayInstallment(inst.id)}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Check size={14} />
                    Pagar Próxima Parcela ({inst.paidInstallments + 1}ª)
                  </button>
                )}

                {inst.status === 'concluido' && (
                  <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    <Check size={14} />
                    Finalizado / Concluído!
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center space-y-4 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <Receipt size={48} className="mx-auto text-zinc-200 dark:text-zinc-700" />
            <div>
              <p className="text-zinc-400 dark:text-zinc-300 font-bold">Nenhum parcelamento encontrado</p>
              <p className="text-zinc-500 text-sm">
                {activeTab === 'ativos'
                  ? 'Cadastre suas compras divididas no cartão ou financiamentos.'
                  : 'Nenhuma conta quitada nesta aba.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 relative shadow-2xl animate-in zoom-in duration-200 text-zinc-900 dark:text-zinc-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-8">
              {editingInstallment ? 'Editar Parcelamento' : 'Novo Parcelamento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Título da Conta / Compra</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  placeholder="Ex: Financiamento de Carro, Notebook..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Categoria</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Valor da Parcela</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="0,00"
                    value={amountPerInstallment}
                    onChange={(e) => setAmountPerInstallment(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="10"
                    value={dueDateDay}
                    onChange={(e) => setDueDateDay(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total de Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Parcelas Pagas</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    placeholder="0"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Observações (Opcional)</label>
                <textarea
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none h-16"
                  placeholder="Ex: Compra feita no cartão de crédito..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/10 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Installments;
