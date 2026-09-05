import { useState, useEffect, useCallback } from 'react';
import { dbApi } from '../db';
import { isSameMonth, parseISO, format } from 'date-fns';

export function useData(currentMonth, currentYear) {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({ startDate: format(new Date(), 'yyyy-MM-dd') });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const cats = await dbApi.getCategories();
    const exps = await dbApi.getExpenses();
    const defaultSd = format(new Date(), 'yyyy-MM-dd');
    let sd = await dbApi.getSetting('startDate', defaultSd);
    if (sd === '1') sd = defaultSd; // Handle existing DBs with '1'
    
    setCategories(cats);
    setExpenses(exps);
    setSettings({ startDate: sd });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived state for the selected month
  const currentMonthExpenses = expenses.filter(exp => {
    const expDate = parseISO(exp.date); // assuming YYYY-MM-DD
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoriesWithSpent = categories.map(cat => {
    const spent = currentMonthExpenses
      .filter(exp => exp.categoryId === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      ...cat,
      spent,
      percentage: cat.target > 0 ? (spent / cat.target) * 100 : 0
    };
  });

  const addExpense = async (expense) => {
    await dbApi.addExpense(expense);
    await loadData();
  };

  const updateExpense = async (expense) => {
    await dbApi.updateExpense(expense);
    await loadData();
  };

  const deleteExpense = async (id) => {
    await dbApi.deleteExpense(id);
    await loadData();
  };

  const addCategory = async (category) => {
    await dbApi.addCategory(category);
    await loadData();
  };

  const updateCategory = async (category) => {
    await dbApi.updateCategory(category);
    await loadData();
  };

  const deleteCategory = async (id) => {
    await dbApi.deleteCategory(id);
    await loadData();
  };

  const updateCategoryTarget = async (id, target) => {
    await dbApi.updateCategoryTarget(id, target);
    await loadData();
  };

  const updateSetting = async (key, value) => {
    await dbApi.setSetting(key, value);
    await loadData();
  };

  return {
    categories: categoriesWithSpent,
    allExpenses: expenses,
    currentMonthExpenses,
    totalSpent,
    settings,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryTarget,
    updateSetting
  };
}
