import React, { useState, useEffect } from 'react';
import { RoutineEvent } from '../types';
import { X, Calendar, Clock, Repeat, AlignLeft, Type, Hash } from 'lucide-react';

interface RoutineFormModalProps {
  initialData?: RoutineEvent;
  onSubmit: (data: Omit<RoutineEvent, 'id' | 'user_id'>) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'D' },
  { value: 1, label: 'S' },
  { value: 2, label: 'T' },
  { value: 3, label: 'Q' },
  { value: 4, label: 'Q' },
  { value: 5, label: 'S' },
  { value: 6, label: 'S' },
];

const RoutineFormModal: React.FC<RoutineFormModalProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<'tarefa' | 'reuniao' | 'lembrete'>(initialData?.type || 'tarefa');
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay ?? true);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'custom_days'>(initialData?.recurrence || 'none');
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || []);
  const [color, setColor] = useState(initialData?.color || '#3b82f6'); // default blue

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description,
      type,
      isAllDay,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      recurrence,
      customDays: (recurrence === 'weekly' || recurrence === 'custom_days') ? customDays : undefined,
      color
    });
  };

  const toggleDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl p-5 sm:p-8 relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 md:right-6 md:top-6 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
          {initialData ? 'Editar Evento' : 'Novo Evento na Rotina'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TIPO */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'tarefa', label: 'Tarefa', color: 'blue' },
              { id: 'reuniao', label: 'Reunião', color: 'emerald' },
              { id: 'lembrete', label: 'Lembrete', color: 'amber' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as any)}
                className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                  type === t.id 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TÍTULO */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Type size={16} className="text-zinc-400" /> Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 outline-none text-zinc-900 dark:text-white font-medium"
              placeholder="Ex: Reunião de Alinhamento"
            />
          </div>

          {/* DATA E HORA */}
          <div className="space-y-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Calendar size={16} className="text-zinc-400" /> Data Inicial
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none text-zinc-900 dark:text-white"
              />
            </div>
            
            <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 w-full"></div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Clock size={16} className="text-zinc-400" /> Dia Inteiro
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAllDay} onChange={() => setIsAllDay(!isAllDay)} />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {!isAllDay && (
              <div className="flex gap-4 animate-in slide-in-from-top-2 duration-200 pt-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Início</label>
                  <input
                    type="time"
                    required={!isAllDay}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Fim</label>
                  <input
                    type="time"
                    required={!isAllDay}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* REPETIÇÃO */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Repeat size={16} className="text-zinc-400" /> Repetição
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 outline-none text-zinc-900 dark:text-white text-sm"
            >
              <option value="none">Não repetir</option>
              <option value="daily">Todos os dias</option>
              <option value="weekly">Semanalmente (mesmo dia)</option>
              <option value="custom_days">Dias específicos da semana</option>
            </select>

            {recurrence === 'custom_days' && (
              <div className="flex justify-between pt-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all flex items-center justify-center ${customDays.includes(day.value) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COR E DESCRIÇÃO */}
          <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Hash size={16} className="text-zinc-400" /> Cor
              </label>
              <div className="flex gap-2">
                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c, borderColor: color === c ? c : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <AlignLeft size={16} className="text-zinc-400" /> Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 outline-none text-zinc-900 dark:text-white text-sm custom-scrollbar resize-none"
              placeholder="Opcional..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            {initialData ? 'Salvar Alterações' : 'Criar Evento'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoutineFormModal;
