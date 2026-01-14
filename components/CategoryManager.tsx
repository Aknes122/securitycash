
import React, { useState } from 'react';
import { AppState, Category, TransactionType } from '../types';
import { Plus, Edit2, Trash2, Tag, X, AlertCircle } from 'lucide-react';

interface CategoryManagerProps {
  state: AppState;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, c: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  state,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [kind, setKind] = useState<TransactionType>('despesa');

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setKind(cat.kind);
    } else {
      setEditingCategory(null);
      setName('');
      setKind('despesa');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, { name, kind });
    } else {
      onAddCategory({ name, kind });
    }
    setIsModalOpen(false);
  };

  const despesas = state.categories.filter(c => c.kind === 'despesa');
  const entradas = state.categories.filter(c => c.kind === 'entrada');

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
          <p className="text-zinc-500 text-sm">Personalize as categorias para seus registros financeiros.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Despesas Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-rose-500 font-semibold border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <Tag size={18} />
            <h3>Categorias de Saída (Despesas)</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {despesas.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none text-zinc-900 dark:text-zinc-100">
                <span className="font-medium">{cat.name}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Entradas Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 font-semibold border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <Tag size={18} />
            <h3>Categorias de Entrada</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {entradas.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none text-zinc-900 dark:text-zinc-100">
                <span className="font-medium">{cat.name}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative shadow-2xl animate-in zoom-in duration-200 text-zinc-900 dark:text-zinc-100">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nome da Categoria</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                  placeholder="Ex: Lazer, Investimentos..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setKind('entrada')}
                    className={`py-2 rounded-md text-sm font-medium transition-all ${kind === 'entrada' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('despesa')}
                    className={`py-2 rounded-md text-sm font-medium transition-all ${kind === 'despesa' ? 'bg-rose-600 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Despesa
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-white">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl text-zinc-900 dark:text-zinc-100">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Excluir Categoria?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Registros existentes não serão apagados, mas ficarão sem categoria vinculada.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-white">Cancelar</button>
              <button onClick={() => { onDeleteCategory(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium shadow-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
