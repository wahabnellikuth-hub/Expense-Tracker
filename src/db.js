import { db } from './firebase';
import { ref, get, set, child, remove } from 'firebase/database';

const defaultCategories = [
  { id: 'cat_1', name: 'Meals', icon: '🍽', target: 5000 },
  { id: 'cat_2', name: 'Junks', icon: '🍔', target: 2000 },
  { id: 'cat_3', name: 'Healthy', icon: '🥗', target: 3000 },
  { id: 'cat_4', name: 'Research', icon: '📚', target: 4000 },
  { id: 'cat_5', name: 'Travel', icon: '✈️', target: 6000 },
  { id: 'cat_6', name: 'Compulsory', icon: '📌', target: 5000 }
];

export const dbApi = {
  async getCategories() {
    try {
      const snapshot = await get(child(ref(db), 'categories'));
      let categories = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        categories = Object.values(data);
      }
      
      if (categories.length === 0) {
        for (const cat of defaultCategories) {
          await set(ref(db, 'categories/' + cat.id), cat);
          categories.push(cat);
        }
      }
      return categories;
    } catch (e) {
      console.error("Firebase categories error:", e);
      return defaultCategories; // Fallback to defaults so app loads
    }
  },
  
  async addCategory(category) {
    await set(ref(db, 'categories/' + category.id), category);
  },

  async updateCategory(category) {
    await set(ref(db, 'categories/' + category.id), category);
  },
  
  async deleteCategory(id) {
    await remove(ref(db, 'categories/' + id));
  },
  
  async updateCategoryTarget(id, newTarget) {
    const snapshot = await get(child(ref(db), 'categories/' + id));
    if (snapshot.exists()) {
      const cat = snapshot.val();
      cat.target = newTarget;
      await set(ref(db, 'categories/' + id), cat);
    }
  },

  async getExpenses() {
    try {
      const snapshot = await get(child(ref(db), 'expenses'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data);
      }
      return [];
    } catch (e) {
      console.error("Firebase expenses error:", e);
      return []; // Fallback to empty array
    }
  },

  async addExpense(expense) {
    await set(ref(db, 'expenses/' + expense.id), expense);
  },

  async updateExpense(expense) {
    await set(ref(db, 'expenses/' + expense.id), expense);
  },

  async deleteExpense(id) {
    await remove(ref(db, 'expenses/' + id));
  },

  async getSetting(key, defaultValue = null) {
    try {
      const snapshot = await get(child(ref(db), 'settings/' + key));
      if (snapshot.exists()) {
        return snapshot.val().value;
      }
      return defaultValue;
    } catch (e) {
      console.error("Firebase settings error:", e);
      return defaultValue;
    }
  },

  async setSetting(key, value) {
    await set(ref(db, 'settings/' + key), { value });
  }
};
