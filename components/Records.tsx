
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Filters, Transaction } from '../types';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, Filter, Sparkles, RotateCcw, Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface RecordsProps {
  state: AppState;
  onUpdateFilters: (f: Partial<Filters>) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, t: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenForm: (t: Transaction | null) => void;
  onOpenScanner: () => void;
}

const Records: React.FC<RecordsProps> = ({
  state,
  onUpdateFilters,
  onDeleteTransaction,
  onOpenForm,
  onOpenScanner
}) => {
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filtered = useMemo(() => {
    let list = state.transactions;
    if (state.filters.search) list = list.filter(t => t.description.toLowerCase().includes(state.filters.search.toLowerCase()));
    if (state.filters.type !== 'all') list = list.filter(t => t.type === state.filters.type);
    if (state.filters.categoryId !== 'all') list = list.filter(t => t.categoryId === state.filters.categoryId);

    // Intervalo de Datas
    if (state.filters.startDate) list = list.filter(t => t.date >= state.filters.startDate);
    if (state.filters.endDate) list = list.filter(t => t.date <= state.filters.endDate);

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, state.filters]);

  // Cálculo do Resumo Filtrado
  const filteredSummary = useMemo(() => {
    return filtered.reduce((acc, t) => {
      if (t.type === 'entrada') acc.incomes += t.amount;
      else acc.expenses += t.amount;
      return acc;
    }, { incomes: 0, expenses: 0 });
  }, [filtered]);

  const filteredBalance = filteredSummary.incomes - filteredSummary.expenses;

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === '/') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
      if (e.key === 'n') onOpenForm(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenForm]);

  const clearFilters = () => {
    onUpdateFilters({
      search: '',
      type: 'all',
      categoryId: 'all',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="space-y-6 pb-12 transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Meus Registros</h2>
        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-hide">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Filter size={20} />
          </button>
          {state.userPlan === 'pro' && (
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all whitespace-nowrap text-xs sm:text-sm"
            >
              <Sparkles size={18} />
              <span>Scan IA</span>
            </button>
          )}
          <button
            onClick={() => onOpenForm(null)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold shadow-lg active:scale-95 transition-all whitespace-nowrap text-xs sm:text-sm"
          >
            <Plus size={20} />
            <span>Novo Registro</span>
          </button>
        </div>
      </header>

      {/* Barra de Filtros */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm transition-all duration-300 ${showFilters ? 'flex flex-col' : 'hidden lg:grid'}`}>

        {/* Busca - 3 colunas */}
        <div className="lg:col-span-3 flex flex-col">
          <label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 ml-2 tracking-widest">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              id="search-input"
              type="text"
              placeholder="O que procura?"
              className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              value={state.filters.search}
              onChange={(e) => onUpdateFilters({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Grupo de Datas - 4 colunas */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 ml-2 tracking-widest">Início</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
              <input
                type="date"
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-2 text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                value={state.filters.startDate}
                onChange={(e) => onUpdateFilters({ startDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 ml-2 tracking-widest">Fim</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
              <input
                type="date"
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-2 text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                value={state.filters.endDate}
                onChange={(e) => onUpdateFilters({ endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Tipo - 2 colunas */}
        <div className="lg:col-span-2 flex flex-col">
          <label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 ml-2 tracking-widest">Tipo</label>
          <select
            value={state.filters.type}
            onChange={(e) => onUpdateFilters({ type: e.target.value as any })}
            className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        {/* Categoria - 2 colunas */}
        <div className="lg:col-span-2 flex flex-col">
          <label className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 mb-1 ml-2 tracking-widest">Categoria</label>
          <select
            value={state.filters.categoryId}
            onChange={(e) => onUpdateFilters({ categoryId: e.target.value })}
            className="w-full h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="all">Todas</option>
            {state.categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>

        {/* Limpar - 1 coluna */}
        <div className="lg:col-span-1 flex flex-col lg:justify-end">
          <button
            onClick={clearFilters}
            className="w-full h-11 flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 lg:bg-transparent lg:hover:bg-zinc-100 lg:dark:hover:bg-zinc-800 text-zinc-500 hover:text-rose-500 rounded-2xl transition-all"
            title="Resetar filtros"
          >
            <RotateCcw size={18} />
            <span className="lg:hidden text-xs font-bold uppercase tracking-widest">Limpar</span>
          </button>
        </div>
      </div>

      {/* Barra de Resumo Dinâmica */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
          <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
            <Filter size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Registros</span>
            <span className="text-sm font-black">{filtered.length} encontrados</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filteredBalance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {filteredBalance >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total no Período</span>
            <span className={`text-sm font-black ${filteredBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(filteredBalance)}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <DollarSign size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Gasto Consolidado</span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {formatCurrency(filteredSummary.expenses)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-center">Tipo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginated.length > 0 ? paginated.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-6 py-4 text-sm text-zinc-500 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.description}</td>
                  <td className="px-6 py-4"><span className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-600 text-[10px] font-bold uppercase tracking-tight">{state.categories.find(c => c.id === t.categoryId)?.name || 'N/A'}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.type === 'entrada' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{formatCurrency(t.amount)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingTransaction(t)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Eye size={16} /></button>
                      <button onClick={() => onOpenForm(t)} className="p-2 text-zinc-400 hover:text-blue-600"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteConfirm(t.id)} className="p-2 text-zinc-400 hover:text-rose-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center text-zinc-200 dark:text-zinc-800">
                        <Search size={32} />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Nenhum registro encontrado com esses filtros.</p>
                      <button onClick={clearFilters} className="text-xs font-bold text-blue-500 uppercase tracking-widest hover:underline">Limpar Filtros</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl disabled:opacity-30 active:scale-90 transition-all shadow-sm"><ChevronLeft size={20} /></button>
          <span className="text-xs font-bold text-zinc-400">{currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl disabled:opacity-30 active:scale-90 transition-all shadow-sm"><ChevronRight size={20} /></button>
        </div>
      )}

      {viewingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in duration-200">

            {/* Header Decorative Background */}
            <div className={`h-24 w-full ${viewingTransaction.type === 'entrada' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-gradient-to-br from-rose-500/20 to-orange-500/20'} absolute top-0 left-0`} />

            <div className="relative p-6 pt-8 space-y-6">
              {/* Close Button */}
              <button
                onClick={() => setViewingTransaction(null)}
                className="absolute right-6 top-6 p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors backdrop-blur-sm"
              >
                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
              </button>

              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${viewingTransaction.type === 'entrada'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-rose-500/30'
                  }`}>
                  {viewingTransaction.type === 'entrada' ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {viewingTransaction.type === 'entrada' ? 'Receita Recebida' : 'Despesa Realizada'}
                  </p>
                  <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {formatCurrency(viewingTransaction.amount)}
                  </h3>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Descrição</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {viewingTransaction.description}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <CalendarIcon size={10} /> Data
                    </p>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200">
                      {formatDate(viewingTransaction.date)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={10} /> Categoria
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800 border border-zinc-300/50 dark:border-zinc-700 text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400">
                      {state.categories.find(c => c.id === viewingTransaction.categoryId)?.name || 'Geral'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { onOpenForm(viewingTransaction); setViewingTransaction(null); }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-wide transition-all"
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button
                  onClick={() => setViewingTransaction(null)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 text-xs font-bold uppercase tracking-wide transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto"><Trash2 size={28} /></div>
            <h3 className="text-xl font-bold">Excluir Registro?</h3>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold">Cancelar</button>
              <button onClick={() => { onDeleteTransaction(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
