
import { useState, useEffect, useCallback } from 'react';
import { AppState, Transaction, Filters, Category, UserPlan, Reminder, Goal } from '../types';
import { SEED_CATEGORIES, SEED_TRANSACTIONS, SEED_REMINDERS, SEED_GOALS, STORAGE_KEY } from '../constants';
import { supabase } from '../lib/supabase';

export const useStore = (userId?: string) => {
  const getKey = () => userId ? `securitycash_data_${userId}` : STORAGE_KEY;

  const getInitialState = (): AppState => {
    if (!userId) {
      return {
        transactions: [],
        categories: SEED_CATEGORIES,
        reminders: [],
        goals: [],
        userPlan: 'basic',
        filters: { period: '30d', categoryId: 'all', search: '', type: 'all', startDate: '', endDate: '' },
        dashboardFilters: { period: '30d', startDate: '', endDate: '' }
      };
    }

    const saved = localStorage.getItem(getKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.reminders) parsed.reminders = [];
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.userPlan) parsed.userPlan = 'basic';
        if (!parsed.filters.startDate) parsed.filters.startDate = '';
        if (!parsed.filters.endDate) parsed.filters.endDate = '';
        if (!parsed.dashboardFilters) parsed.dashboardFilters = { period: '30d', startDate: '', endDate: '' };
        // Ensure categories are present even if saved data is old/broken, or merge? 
        // For now trusting saved, but if categories missing could fallback.
        if (!parsed.categories || parsed.categories.length === 0) parsed.categories = SEED_CATEGORIES;
        return parsed;
      } catch (e) {
        console.error("Failed to load local storage data", e);
      }
    }

    // New User (or no data) -> EMPTY SEEDS
    return {
      transactions: [], // Empty for new users
      categories: SEED_CATEGORIES, // Keep default categories
      reminders: [], // Empty
      goals: [], // Empty
      userPlan: 'basic',
      filters: {
        period: '30d',
        categoryId: 'all',
        search: '',
        type: 'all',
        startDate: '',
        endDate: ''
      },
      dashboardFilters: {
        period: '30d',
        startDate: '',
        endDate: ''
      }
    };
  };

  const [state, setState] = useState<AppState>(getInitialState);

  // Reload state when userId changes
  useEffect(() => {
    setState(getInitialState());
  }, [userId]);

  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados iniciais do Supabase
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [
        { data: transactions },
        { data: reminders },
        { data: goals },
        { data: categories }
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('reminders').select('*').order('due_date', { ascending: true }),
        supabase.from('goals').select('*'),
        supabase.from('categories').select('*')
      ]);

      const hasRemoteData = (transactions?.length || 0) > 0 || (reminders?.length || 0) > 0 || (goals?.length || 0) > 0;

      // Lógica de migração: Se o banco estiver vazio e houver dados no localStorage, migrar.
      if (!hasRemoteData) {
        const localKey = getKey();
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            const localTransactions = parsed.transactions || [];
            const localReminders = parsed.reminders || [];
            const localGoals = parsed.goals || [];

            if (localTransactions.length > 0 || localReminders.length > 0 || localGoals.length > 0) {
              console.log("Migrando dados locais para o Supabase...");

              const migrationPromises = [];

              if (localTransactions.length > 0) {
                migrationPromises.push(supabase.from('transactions').insert(
                  localTransactions.map((t: any) => ({
                    user_id: userId,
                    type: t.type,
                    description: t.description,
                    amount: t.amount,
                    date: t.date,
                    category_id: t.categoryId
                  }))
                ));
              }

              if (localReminders.length > 0) {
                migrationPromises.push(supabase.from('reminders').insert(
                  localReminders.map((r: any) => ({
                    user_id: userId,
                    title: r.title,
                    due_date: r.dueDate,
                    amount: r.amount,
                    status: r.status
                  }))
                ));
              }

              if (localGoals.length > 0) {
                migrationPromises.push(supabase.from('goals').insert(
                  localGoals.map((g: any) => ({
                    user_id: userId,
                    title: g.title,
                    target_amount: g.targetAmount,
                    current_amount: g.currentAmount,
                    deadline: g.deadline
                  }))
                ));
              }

              await Promise.all(migrationPromises);
              console.log("Migração concluída!");

              // Recarregar os dados agora que estão no banco
              return fetchData();
            }
          } catch (e) {
            console.error("Erro na migração automática", e);
          }
        }
      }

      setState(prev => ({
        ...prev,
        transactions: transactions || [],
        reminders: reminders ? reminders.map((r: any) => ({
          ...r,
          dueDate: r.due_date
        })) : [],
        goals: goals ? goals.map((g: any) => ({
          ...g,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount)
        })) : [],
        categories: categories && categories.length > 0 ? categories : SEED_CATEGORIES
      }));
    } catch (e) {
      console.error("Erro ao carregar dados do Supabase", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setState(getInitialState());
    }
  }, [userId, fetchData]);

  // Remover persistência automática no localStorage para usuários logados
  // Manter apenas se quiser um cache offline (opcional)
  useEffect(() => {
    if (!userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, userId]);

  const setPlan = useCallback((plan: UserPlan) => {
    setState(prev => ({ ...prev, userPlan: plan }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  const updateDashboardFilters = useCallback((newFilters: Partial<AppState['dashboardFilters']>) => {
    setIsLoading(true);
    setState(prev => ({
      ...prev,
      dashboardFilters: { ...prev.dashboardFilters, ...newFilters }
    }));
    setTimeout(() => setIsLoading(false), 400); // Simulate skeleton delay
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (userId) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...t, user_id: userId }])
        .select()
        .single();

      if (!error && data) {
        setState(prev => ({ ...prev, transactions: [data, ...prev.transactions] }));
      }
    } else {
      const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
      setState(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions]
      }));
    }
  }, [userId]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (userId) {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);

      if (!error) {
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    }
  }, [userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (userId) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (!error) {
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id)
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));
    }
  }, [userId]);

  const resetData = useCallback(async () => {
    if (userId) {
      setIsLoading(true);
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('reminders').delete().eq('user_id', userId),
        supabase.from('goals').delete().eq('user_id', userId),
        supabase.from('categories').delete().eq('user_id', userId)
      ]);
      await fetchData();
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setState(getInitialState());
    }
  }, [userId, fetchData]);

  const deleteAccount = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // O App fará o reload para o estado inicial
    window.location.reload();
  }, []);

  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    if (userId) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...c, user_id: userId }])
        .select()
        .single();

      if (!error && data) {
        setState(prev => ({ ...prev, categories: [...prev.categories, data] }));
      }
    } else {
      const newCategory = { ...c, id: `cat_${Math.random().toString(36).substr(2, 9)}` };
      setState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    }
  }, [userId]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    if (userId) {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (!error) {
        setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
      }
    } else {
      setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
    }
  }, [userId]);

  const deleteCategory = useCallback(async (id: string) => {
    if (userId) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) {
        setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
      }
    } else {
      setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
    }
  }, [userId]);

  const addReminder = useCallback(async (r: Omit<Reminder, 'id'>) => {
    if (userId) {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{ ...r, user_id: userId, due_date: r.dueDate }])
        .select()
        .single();

      if (!error && data) {
        // Map back due_date to dueDate if needed or ensure consistency
        const mapped = { ...data, dueDate: data.due_date };
        setState(prev => ({ ...prev, reminders: [...prev.reminders, mapped] }));
      }
    } else {
      const newReminder = { ...r, id: `rem_${Math.random().toString(36).substr(2, 9)}` };
      setState(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
    }
  }, [userId]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    if (userId) {
      const dbUpdates = { ...updates };
      if (updates.dueDate) {
        (dbUpdates as any).due_date = updates.dueDate;
        delete (dbUpdates as any).dueDate;
      }

      const { error } = await supabase
        .from('reminders')
        .update(dbUpdates)
        .eq('id', id);

      if (!error) {
        setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
      }
    } else {
      setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
    }
  }, [userId]);

  const deleteReminder = useCallback(async (id: string) => {
    if (userId) {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (!error) {
        setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
      }
    } else {
      setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
    }
  }, [userId]);

  const addGoal = useCallback(async (g: Omit<Goal, 'id'>) => {
    if (userId) {
      const dbData = {
        title: g.title,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        deadline: g.deadline,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([dbData])
        .select()
        .single();

      if (!error && data) {
        const mapped: Goal = {
          id: data.id,
          title: data.title,
          targetAmount: Number(data.target_amount),
          currentAmount: Number(data.current_amount),
          deadline: data.deadline
        };
        setState(prev => ({ ...prev, goals: [...prev.goals, mapped] }));
      }
    } else {
      const newGoal = { ...g, id: `goal_${Math.random().toString(36).substr(2, 9)}` };
      setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    }
  }, [userId]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    if (userId) {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;

      const { error } = await supabase
        .from('goals')
        .update(dbUpdates)
        .eq('id', id);

      if (!error) {
        setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
      }
    } else {
      setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
    }
  }, [userId]);

  const deleteGoal = useCallback(async (id: string) => {
    if (userId) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (!error) {
        setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
      }
    } else {
      setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    }
  }, [userId]);

  return {
    state,
    isLoading,
    setPlan,
    updateFilters,
    updateDashboardFilters,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addReminder,
    updateReminder,
    deleteReminder,
    addGoal,
    updateGoal,
    deleteGoal,
    resetData,
    deleteAccount
  };
};
