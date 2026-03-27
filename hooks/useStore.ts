
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
        userName: '',
        baseSalary: 3000,
        filters: { period: '30d', categoryId: 'all', search: '', type: 'all', startDate: '', endDate: '' },
        dashboardFilters: { period: '30d', startDate: '', endDate: '' }
      };
    }

    const saved = localStorage.getItem(getKey());
    const savedPlan = localStorage.getItem(`securitycash_plan_${userId || 'guest'}`);
    const savedSalary = localStorage.getItem(`securitycash_salary_${userId || 'guest'}`);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.reminders) parsed.reminders = [];
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.userPlan) parsed.userPlan = (savedPlan as UserPlan) || 'basic';
        if (!parsed.baseSalary) parsed.baseSalary = savedSalary ? Number(savedSalary) : 3000;
        if (!parsed.filters.startDate) parsed.filters.startDate = '';
        if (!parsed.filters.endDate) parsed.filters.endDate = '';
        if (!parsed.dashboardFilters) parsed.dashboardFilters = { period: '30d', startDate: '', endDate: '' };
        if (!parsed.categories || parsed.categories.length === 0) parsed.categories = SEED_CATEGORIES;
        return parsed;
      } catch (e) {
        console.error("Failed to load local storage data", e);
      }
    }

    return {
      transactions: [],
      categories: SEED_CATEGORIES,
      reminders: [],
      goals: [],
      userPlan: (savedPlan as UserPlan) || 'basic',
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
      },
      userName: '',
      baseSalary: savedSalary ? Number(savedSalary) : 3000
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
      if (userId) {
        const { data: { session } } = await supabase.auth.getSession();
        const metaName = session?.user?.user_metadata?.full_name || '';
        if (metaName) {
          setState(prev => ({ ...prev, userName: metaName }));
        }
      }
      // 1. Verificar se o usuário já migrou os dados
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_migrated')
        .eq('id', userId)
        .maybeSingle();

      if (!profile || !profile.has_migrated) {
        const localKey = getKey();
        const localData = localStorage.getItem(localKey);

        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            console.log("Migrando dados locais para o Supabase (primeira vez)...");

            const migrationPromises = [];

            if (parsed.transactions?.length > 0) {
              migrationPromises.push(supabase.from('transactions').insert(
                parsed.transactions.map((t: any) => ({
                  user_id: userId,
                  type: t.type,
                  description: t.description,
                  amount: t.amount,
                  date: t.date,
                  category_id: t.categoryId
                }))
              ));
            }

            if (parsed.reminders?.length > 0) {
              migrationPromises.push(supabase.from('reminders').insert(
                parsed.reminders.map((r: any) => ({
                  user_id: userId,
                  title: r.title,
                  due_date: r.dueDate,
                  amount: r.amount,
                  status: r.status
                }))
              ));
            }

            if (parsed.goals?.length > 0) {
              migrationPromises.push(supabase.from('goals').insert(
                parsed.goals.map((g: any) => ({
                  user_id: userId,
                  title: g.title,
                  target_amount: g.targetAmount,
                  current_amount: g.currentAmount,
                  deadline: g.deadline
                }))
              ));
            }

            if (parsed.categories?.length > 0) {
              migrationPromises.push(supabase.from('categories').upsert(
                parsed.categories.map((c: any) => ({
                  id: c.id,
                  user_id: userId,
                  name: c.name,
                  kind: c.kind,
                  color: c.color
                }))
              ));
            }

            await Promise.all(migrationPromises);
            console.log("Migração concluída!");
          } catch (e) {
            console.error("Erro ao migrar dados locais", e);
          }
        }

        // Criar ou atualizar perfil marcando como migrado
        await supabase.from('profiles').upsert({ id: userId, has_migrated: true });

        // Recarregar os dados agora que foram possivelmente migrados
        return fetchData();
      }

      // 2. Buscar dados reais do banco
      const [
        { data: transactions },
        { data: reminders },
        { data: goals },
        { data: categories },
        { data: userProfile }
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('reminders').select('*').order('due_date', { ascending: true }),
        supabase.from('goals').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('profiles').select('plan, base_salary').eq('id', userId).maybeSingle()
      ]);

      setState(prev => {
        const finalCategories = (categories && categories.length > 0)
          ? categories
          : ((profile?.has_migrated || !localStorage.getItem(getKey())) ? [] : SEED_CATEGORIES);

        return {
          ...prev,
          transactions: transactions ? transactions.map((t: any) => ({
            ...t,
            categoryId: t.category_id
          })) : [],
          reminders: reminders ? reminders.map((r: any) => ({
            ...r,
            dueDate: r.due_date
          })) : [],
          goals: goals ? goals.map((g: any) => ({
            ...g,
            targetAmount: Number(g.target_amount),
            currentAmount: Number(g.current_amount)
          })) : [],
          categories: finalCategories,
          userPlan: userProfile?.plan || prev.userPlan,
          baseSalary: userProfile?.base_salary || prev.baseSalary
        };
      });
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
    localStorage.setItem(`securitycash_plan_${userId || 'guest'}`, plan);
    if (userId) {
      supabase.from('profiles').upsert({ id: userId, plan }).then();
    }
  }, [userId]);

  const setBaseSalary = useCallback((salary: number) => {
    setState(prev => ({ ...prev, baseSalary: salary }));
    localStorage.setItem(`securitycash_salary_${userId || 'guest'}`, salary.toString());
    if (userId) {
      supabase.from('profiles').upsert({ id: userId, base_salary: salary }).then();
    }
  }, [userId]);

  const setUserName = useCallback((name: string) => {
    setState(prev => {
      const newState = { ...prev, userName: name };
      if (userId) {
        localStorage.setItem(getKey(), JSON.stringify(newState));
        supabase.auth.updateUser({
          data: { full_name: name }
        });
      }
      return newState;
    });
  }, [userId]);

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

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: { period: '30d', categoryId: 'all', search: '', type: 'all', startDate: '', endDate: '' }
    }));
  }, []);

  const resetDashboardFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      dashboardFilters: { period: '30d', startDate: '', endDate: '' }
    }));
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (userId) {
      const dbData = {
        ...t,
        category_id: t.categoryId,
        user_id: userId
      };
      delete (dbData as any).categoryId;

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbData])
        .select()
        .single();

      if (!error && data) {
        const mapped = { ...data, categoryId: data.category_id };
        setState(prev => ({ ...prev, transactions: [mapped, ...prev.transactions] }));
      } else if (error) {
        console.error("Erro ao adicionar transação", error);
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
      const dbUpdates = { ...updates };
      if (updates.categoryId) {
        (dbUpdates as any).category_id = updates.categoryId;
        delete (dbUpdates as any).categoryId;
      }

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
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

  const resetData = useCallback(async (includeCategories: boolean = false) => {
    if (userId) {
      setIsLoading(true);
      const promises = [
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('reminders').delete().eq('user_id', userId),
        supabase.from('goals').delete().eq('user_id', userId)
      ];
      if (includeCategories) {
        promises.push(supabase.from('categories').delete().eq('user_id', userId));
      }
      await Promise.all(promises);
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

  const addCategory = useCallback(async (c: Omit<Category, 'id'>): Promise<Category | null> => {
    if (userId) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...c, user_id: userId }])
        .select()
        .single();

      if (!error && data) {
        setState(prev => ({ ...prev, categories: [...prev.categories, data] }));
        return data;
      }
      return null;
    } else {
      const newCategory = { ...c, id: `cat_${Math.random().toString(36).substr(2, 9)}` };
      setState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
      return newCategory;
    }
  }, [userId]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    if (userId) {
      // Usar upsert para garantir que se for uma categoria padrão editada, ela seja salva vinculada ao usuário
      const category = state.categories.find(c => c.id === id);
      if (category) {
        const { error } = await supabase
          .from('categories')
          .upsert({
            ...category,
            ...updates,
            user_id: userId
          });

        if (!error) {
          setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
        } else {
          console.warn("Supabase bloqueou o update (possível erro de ID global). Clonando a categoria...");
          const newId = `cat_${Math.random().toString(36).substr(2, 9)}`;
          const newCategoryData = { ...category, ...updates, id: newId, user_id: userId };
          
          const { data: newCat, error: insertErr } = await supabase
            .from('categories')
            .insert([newCategoryData])
            .select()
            .single();

          if (!insertErr && newCat) {
             // Redirecionar todas as transações para a nova categoria no banco de dados automaticamente
             await supabase.from('transactions').update({ category_id: newId }).eq('category_id', id).eq('user_id', userId);
             
             // Atualizar o estado local imediatamente
             setState(prev => ({ 
               ...prev, 
               categories: prev.categories.map(c => c.id === id ? newCat : c),
               transactions: prev.transactions.map(t => t.categoryId === id ? { ...t, categoryId: newId } : t)
             }));
          } else {
            console.error("Erro ao tentar clonar categoria no Supabase", insertErr);
          }
        }
      }
    } else {
      setState(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
    }
  }, [userId, state.categories]);

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
        .insert([{
          title: r.title,
          amount: r.amount,
          status: r.status,
          user_id: userId,
          due_date: r.dueDate
        }])
        .select()
        .single();

      if (!error && data) {
        const mapped = { ...data, dueDate: data.due_date };
        setState(prev => ({ ...prev, reminders: [...prev.reminders, mapped] }));
      } else if (error) {
        console.error("Erro ao adicionar lembrete", error);
      }
    } else {
      const newReminder = { ...r, id: `rem_${Math.random().toString(36).substr(2, 9)}` };
      setState(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
    }
  }, [userId]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    if (userId) {
      const dbUpdates: any = { ...updates };
      if (updates.dueDate) {
        dbUpdates.due_date = updates.dueDate;
        delete dbUpdates.dueDate;
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

  const addTransactionsBulk = useCallback(async (newTransactions: Omit<Transaction, 'id'>[], newCategories: Omit<Category, 'id'>[] = []) => {
    // 1. Map de nomes de categorias para seus IDs finais
    const categoryIdMap: Record<string, string> = {};

    if (newCategories.length > 0) {
      for (const cat of newCategories) {
        // Verifica se a categoria já existe (case-insensitive)
        const existing = state.categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase() && c.kind === cat.kind);
        if (existing) {
          categoryIdMap[cat.name] = existing.id;
        } else {
          // Cria a nova categoria e armazena o ID
          const created = await addCategory(cat);
          if (created) {
            categoryIdMap[cat.name] = created.id;
          }
        }
      }
    }

    // 2. Prepara transações mapeando IDs de categorias sugeridas
    const transactionsWithIds = newTransactions.map(t => {
      // Se o CategoryID for o nome de uma categoria sugerida, troca pelo ID real
      const finalCategoryId = categoryIdMap[t.categoryId] || t.categoryId;
      return {
        ...t,
        categoryId: finalCategoryId,
        id: crypto.randomUUID()
      };
    });

    if (userId) {
      const dbTransactions = transactionsWithIds.map(t => {
        const dbData = {
          ...t,
          category_id: t.categoryId,
          user_id: userId
        };
        delete (dbData as any).categoryId;
        return dbData;
      });

      const { error } = await supabase.from('transactions').insert(dbTransactions);
      if (error) {
        console.error("Erro ao salvar transações em lote", error);
      } else {
        setState(prev => ({
          ...prev,
          transactions: [...prev.transactions, ...transactionsWithIds].sort((a, b) => b.date.localeCompare(a.date))
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, ...transactionsWithIds].sort((a, b) => b.date.localeCompare(a.date))
      }));
    }
  }, [addCategory, state.categories]);

  return {
    state,
    isLoading,
    setPlan,
    setBaseSalary,
    setUserName,
    updateFilters,
    updateDashboardFilters,
    resetData,
    fetchData,
    deleteAccount,
    resetFilters,
    resetDashboardFilters,
    addTransaction,
    addTransactionsBulk,
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
    deleteGoal
  };
};
