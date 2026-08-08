import React, { useState, useMemo } from 'react';
import { AppState, RoutineEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, MoreVertical, Trash, Edit, List, CalendarDays } from 'lucide-react';
import RoutineFormModal from './RoutineFormModal';

interface RoutineProps {
  state: AppState;
  onAddEvent: (event: Omit<RoutineEvent, 'id' | 'user_id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<RoutineEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Routine: React.FC<RoutineProps> = ({ state, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RoutineEvent | null>(null);

  const prev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const next = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days based on view mode
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    
    if (viewMode === 'month') {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const firstDayIndex = firstDayOfMonth.getDay();
      
      // Previous month days
      for (let i = firstDayIndex; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        days.push({ date: d, isCurrentMonth: false });
      }
      
      // Current month days
      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const d = new Date(year, month, i);
        days.push({ date: d, isCurrentMonth: true });
      }
      
      // Next month days
      const lastDayIndex = lastDayOfMonth.getDay();
      for (let i = 1; i < 7 - lastDayIndex; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, isCurrentMonth: false });
      }
    } else {
      // Weekly view
      const currentDay = currentDate.getDay(); // 0-6 (Sun-Sat)
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDay);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push({ date: d, isCurrentMonth: d.getMonth() === month });
      }
    }
    
    return days;
  }, [currentDate, viewMode]);

  // Check if an event happens on a given day
  const eventHappensOnDay = (event: RoutineEvent, dayDate: Date) => {
    const eventDate = new Date(event.date + 'T00:00:00');
    eventDate.setHours(0,0,0,0);
    const d = new Date(dayDate);
    d.setHours(0,0,0,0);

    if (d < eventDate) return false;

    if (event.recurrence === 'none') {
      return d.getTime() === eventDate.getTime();
    }
    if (event.recurrence === 'daily') {
      return true;
    }
    if (event.recurrence === 'weekly') {
      return d.getDay() === eventDate.getDay();
    }
    if (event.recurrence === 'custom_days' && event.customDays) {
      return event.customDays.includes(d.getDay());
    }
    return false;
  };

  // Helper: get event timestamp in Brasilia (GMT-3) for proper ordering
  const getEventTimestamp = (e: RoutineEvent) => {
    if (e.isAllDay) return -Infinity; // all‑day events stay first
    const timePart = e.startTime || '00:00';
    // Construct ISO string with explicit -03:00 offset
    const iso = `${e.date}T${timePart}:00-03:00`;
    return new Date(iso).getTime();
  };

  const getEventsForDay = (dayDate: Date) => {
    // Filter events that occur on this day (including recurrences)
    const dayEvents = (state.routineEvents || []).filter(e => eventHappensOnDay(e, dayDate));
    // Sort: all‑day events first, then by timestamp in Brasilia timezone
    const sorted = dayEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return getEventTimestamp(a) - getEventTimestamp(b);
    });
    return sorted;
  };

  const handleOpenForm = (event?: RoutineEvent) => {
    setEditingEvent(event || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleSubmitEvent = (data: Omit<RoutineEvent, 'id' | 'user_id'>) => {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, data);
    } else {
      onAddEvent(data);
    }
    handleCloseForm();
  };

  const headerDateText = viewMode === 'month' 
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `Semana de ${calendarDays[0]?.date.getDate()} de ${MONTHS[calendarDays[0]?.date.getMonth()]}`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Rotina & Agenda</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Organize seus compromissos, lembretes e tarefas.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'week' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <List size={16} />
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <CalendarDays size={16} />
              Mês
            </button>
          </div>

          <div className="flex bg-white dark:bg-zinc-900 rounded-xl p-1 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <button onClick={prev} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-2 font-bold text-zinc-900 dark:text-white min-w-[200px] text-center">
              {headerDateText}
            </div>
            <button onClick={next} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Evento</span>
          </button>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          {DAYS.map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className={`grid grid-cols-7 flex-1 ${viewMode === 'week' ? 'min-h-[400px]' : ''}`}>
          {calendarDays.map((day, i) => {
            const isToday = day.date.getTime() === today.getTime();
            const dayEvents = getEventsForDay(day.date);
            return (
              <div 
                key={i} 
                className={`min-h-[120px] p-2 border-b border-r border-zinc-200/50 dark:border-zinc-800/50 transition-colors ${!day.isCurrentMonth && viewMode === 'month' ? 'bg-zinc-50/50 dark:bg-zinc-900/20 opacity-50' : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {day.date.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((e, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleOpenForm(e)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold truncate cursor-pointer hover:brightness-110 transition-all border flex flex-col gap-0.5"
                      style={{
                        backgroundColor: (e.color || '#3b82f6') + '15',
                        borderColor: (e.color || '#3b82f6') + '30',
                        color: e.color || '#3b82f6'
                      }}
                      title={e.title}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color || '#3b82f6' }}></span>
                        {e.title}
                      </div>
                      {!e.isAllDay && e.startTime && (
                        <div className="text-[10px] opacity-75 font-medium flex items-center gap-1 ml-3">
                          <Clock size={10} /> {e.startTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFormOpen && (
        <RoutineFormModal
          initialData={editingEvent || undefined}
          onSubmit={handleSubmitEvent}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Routine;
