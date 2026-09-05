import { openDB } from 'idb';

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        // Default categories
        catStore.put({ id: 'cat_1', name: 'Meals', icon: '🍽', target: 5000 });
        catStore.put({ id: 'cat_2', name: 'Junks', icon: '🍔', target: 2000 });
        catStore.put({ id: 'cat_3', name: 'Healthy', icon: '🥗', target: 3000 });
        catStore.put({ id: 'cat_4', name: 'Research', icon: '📚', target: 4000 });
        catStore.put({ id: 'cat_5', name: 'Travel', icon: '✈️', target: 6000 });
        catStore.put({ id: 'cat_6', name: 'Compulsory', icon: '📌', target: 5000 });
      }
      
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('categoryId', 'categoryId');
        expenseStore.createIndex('date', 'date');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const dbApi = {
  async getCategories() {
    const db = await initDB();
    return db.getAll('categories');
  },
  
  async addCategory(category) {
    const db = await initDB();
    await db.put('categories', category);
  },

  async updateCategory(category) {
    const db = await initDB();
    await db.put('categories', category);
  },
  
  async updateCategoryTarget(id, newTarget) {
    const db = await initDB();
    const cat = await db.get('categories', id);
    if (cat) {
      cat.target = newTarget;
      await db.put('categories', cat);
    }
  },

  async getExpenses() {
    const db = await initDB();
    return db.getAll('expenses');
  },

  async addExpense(expense) {
    const db = await initDB();
    await db.put('expenses', expense);
  },

  async updateExpense(expense) {
    const db = await initDB();
    await db.put('expenses', expense);
  },

  async deleteExpense(id) {
    const db = await initDB();
    await db.delete('expenses', id);
  },

  async getSetting(key, defaultValue = null) {
    const db = await initDB();
    const val = await db.get('settings', key);
    return val !== undefined ? val : defaultValue;
  },

  async setSetting(key, value) {
    const db = await initDB();
    await db.put('settings', value, key);
  }
};
