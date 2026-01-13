
import { useState, useEffect, useCallback } from 'react';
import { AppState, Transaction, Filters, Category, UserPlan, Reminder, Goal } from '../types';
import { SEED_CATEGORIES, SEED_TRANSACTIONS, SEED_REMINDERS, SEED_GOALS, STORAGE_KEY } from '../constants';

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

  useEffect(() => {
    if (userId) {
      localStorage.setItem(getKey(), JSON.stringify(state));
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

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions]
    }));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  }, []);

  const resetData = useCallback(() => {
    setState({
      transactions: SEED_TRANSACTIONS,
      categories: SEED_CATEGORIES,
      reminders: SEED_REMINDERS,
      goals: SEED_GOALS,
      userPlan: 'basic',
      filters: {
        period: '30d',
        categoryId: 'all',
        search: '',
        type: 'all',
        startDate: '',
        endDate: ''
      }
    });
  }, []);

  const deleteAccount = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // O App fará o reload para o estado inicial
    window.location.reload();
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: `cat_${Math.random().toString(36).substr(2, 9)}` };
    setState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, []);

  const addReminder = useCallback((r: Omit<Reminder, 'id'>) => {
    const newReminder = { ...r, id: `rem_${Math.random().toString(36).substr(2, 9)}` };
    setState(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
  }, []);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setState(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    const newGoal = { ...g, id: `goal_${Math.random().toString(36).substr(2, 9)}` };
    setState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }, []);

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
