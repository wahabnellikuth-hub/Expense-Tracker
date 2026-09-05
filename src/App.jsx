import { useState, useMemo } from 'react';
import { Settings, Calendar as CalendarIcon, Download, Plus, Edit2, X, Trash2 } from 'lucide-react';
import { format, parseISO, isSameDay, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useData } from './hooks/useData';
import { getCategoryColorStyles, formatCurrency } from './colors';
import { exportToExcel } from './export';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonthDate, setCurrentMonthDate] = useState(startOfMonth(new Date()));
  
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const {
    categories,
    allExpenses,
    currentMonthExpenses,
    totalSpent,
    settings,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    updateCategoryTarget,
    updateSetting
  } = useData(currentMonth, currentYear);

  const [activeModal, setActiveModal] = useState(null); // 'expense', 'category', 'settings', 'date'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Computed for "Today / Selected Date"
  const selectedDateExpenses = useMemo(() => {
    return currentMonthExpenses.filter(exp => exp.date === selectedDate);
  }, [currentMonthExpenses, selectedDate]);
  const selectedDateTotal = selectedDateExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const dateLabel = isToday ? 'TODAY' : format(parseISO(selectedDate), 'dd MMM yyyy').toUpperCase();

  const handlePrevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));
  const handleNextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));

  if (loading) {
    return <div className="loading-screen">Loading Expense Tracker...</div>;
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header glass">
        <div className="header-left">
          <button className="month-selector" onClick={handlePrevMonth}>&lt;</button>
          <div className="month-display" onClick={() => setCurrentMonthDate(startOfMonth(new Date()))}>
            <CalendarIcon size={16} />
            <span className="font-bold">{format(currentMonthDate, 'MMMM yyyy')}</span>
          </div>
          <button className="month-selector" onClick={handleNextMonth}>&gt;</button>
        </div>
        <div className="header-right">
          <div className="current-date text-sm font-semibold">
            {format(new Date(), 'dd, EEE')}
          </div>
          <button className="settings-btn" onClick={() => setActiveModal('settings')}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* TOTAL EXPENSES */}
        <section className="total-expenses-card shadow-md">
          <h2 className="text-sm font-semibold text-muted">TOTAL EXPENSES</h2>
          <div className="total-amount font-bold text-4xl mt-2">
            {formatCurrency(totalSpent)}
          </div>
        </section>

        {/* CIRCULAR COUNTER */}
        <section className="circular-counter-section">
          <div className="circular-counter shadow-sm">
            <div className="counter-amount font-bold text-3xl">{formatCurrency(selectedDateTotal)}</div>
            <div className="counter-label text-xs font-semibold text-muted flex items-center justify-center gap-2 mt-1">
              {dateLabel}
              <button className="edit-date-btn" onClick={() => setActiveModal('date')}>
                <Edit2 size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* CATEGORY GRID */}
        <section className="categories-section">
          <div className="category-grid">
            {categories.map(cat => {
              const styles = getCategoryColorStyles(cat.percentage);
              return (
                <button 
                  key={cat.id} 
                  className={`category-card shadow-sm ${styles.className}`}
                  style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.text }}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveModal('expense');
                  }}
                >
                  <div className="cat-icon text-2xl mb-2">{cat.icon}</div>
                  <div className="cat-name font-semibold text-sm">{cat.name}</div>
                  <div className="cat-amounts text-xs mt-1 font-medium">
                    {formatCurrency(cat.spent)} / {formatCurrency(cat.target)}
                  </div>
                  <div className="cat-percentage text-xs font-bold mt-1">
                    {cat.percentage.toFixed(0)}%
                  </div>
                </button>
              );
            })}
            
            <button 
              className="category-card add-category-card shadow-sm"
              onClick={() => setActiveModal('category')}
            >
              <div className="cat-icon text-2xl mb-2 text-muted"><Plus size={24} /></div>
              <div className="cat-name font-semibold text-sm text-muted">Add Category</div>
            </button>
          </div>
        </section>

        {/* MONTHLY OVERVIEW */}
        <section className="monthly-overview shadow-sm">
          <h3 className="font-semibold mb-4 text-sm text-muted">MONTHLY OVERVIEW</h3>
          <div className="overview-stats">
            <div className="stat-row">
              <span className="stat-label">Total Target</span>
              <span className="stat-val font-semibold">{formatCurrency(categories.reduce((s, c) => s + c.target, 0))}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Spent</span>
              <span className="stat-val font-semibold">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Remaining</span>
              <span className="stat-val font-semibold">{formatCurrency(categories.reduce((s, c) => s + c.target, 0) - totalSpent)}</span>
            </div>
            <div className="stat-row mt-2 pt-2 border-t">
              <span className="stat-label font-medium">Used</span>
              <span className="stat-val font-bold">
                {categories.reduce((s, c) => s + c.target, 0) > 0 
                  ? ((totalSpent / categories.reduce((s, c) => s + c.target, 0)) * 100).toFixed(1) 
                  : 0}%
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* MODALS */}
      {activeModal === 'expense' && selectedCategory && (
        <ExpenseModal 
          category={selectedCategory} 
          defaultDate={selectedDate}
          onClose={() => setActiveModal(null)} 
          onAdd={async (amount, date, description) => {
            await addExpense({
              id: 'exp_' + Date.now(),
              categoryId: selectedCategory.id,
              amount: parseFloat(amount),
              date: date,
              description: description || '',
              timestamp: Date.now()
            });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'category' && (
        <CategoryModal 
          onClose={() => setActiveModal(null)} 
          onAdd={async (name, icon, target) => {
            await addCategory({
              id: 'cat_' + Date.now(),
              name,
              icon,
              target: parseFloat(target)
            });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal 
          categories={categories}
          settings={settings}
          currentMonthExpenses={currentMonthExpenses}
          onClose={() => setActiveModal(null)}
          onUpdateCategory={updateCategory}
          onUpdateTarget={updateCategoryTarget}
          onUpdateSetting={updateSetting}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          onExport={() => exportToExcel(categories, allExpenses, currentMonth, currentYear)}
        />
      )}

      {activeModal === 'date' && (
        <DateModal 
          currentDate={selectedDate}
          onClose={() => setActiveModal(null)}
          onSelect={(date) => {
            setSelectedDate(date);
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}

// Minimal inline components for modals
function ExpenseModal({ category, defaultDate, onClose, onAdd }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [description, setDescription] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-content shadow-lg rounded-2xl">
        <div className="modal-header justify-between flex items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <h3 className="font-bold text-lg">{category.name}</h3>
          </div>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="form-group mb-4">
          <label className="text-sm font-semibold text-muted mb-1 block">Amount (₹)</label>
          <input 
            type="number" 
            autoFocus
            className="input-field text-2xl font-bold" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="0"
          />
        </div>
        <div className="form-group mb-6">
          <label className="text-sm font-semibold text-muted mb-1 block">Description (Optional)</label>
          <input 
            type="text" 
            className="input-field" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="What was this for?"
          />
        </div>
        <div className="form-group mb-6">
          <label className="text-sm font-semibold text-muted mb-1 block">Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
        </div>
        <div className="modal-actions flex gap-4">
          <button className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary w-full" 
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={() => onAdd(amount, date, description)}
          >
            ✓ Add
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [target, setTarget] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-content shadow-lg rounded-2xl">
        <div className="modal-header justify-between flex items-center mb-6">
          <h3 className="font-bold text-lg">Add Category</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="form-group mb-4">
          <label className="text-sm font-semibold text-muted mb-1 block">Category Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Shopping"
          />
        </div>
        <div className="form-group mb-4 flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-muted mb-1 block">Icon (Emoji)</label>
            <input 
              type="text" 
              className="input-field text-center" 
              value={icon} 
              maxLength={2}
              onChange={e => setIcon(e.target.value)} 
            />
          </div>
          <div className="flex-[2]">
            <label className="text-sm font-semibold text-muted mb-1 block">Monthly Target (₹)</label>
            <input 
              type="number" 
              className="input-field" 
              value={target} 
              onChange={e => setTarget(e.target.value)} 
              placeholder="0"
            />
          </div>
        </div>
        <button 
          className="btn btn-primary w-full mt-4" 
          disabled={!name || !target || parseFloat(target) <= 0}
          onClick={() => onAdd(name, icon, target)}
        >
          Create Category
        </button>
      </div>
    </div>
  );
}

function SettingsModal({ categories, settings, currentMonthExpenses, onClose, onUpdateCategory, onUpdateTarget, onUpdateSetting, onUpdateExpense, onDeleteExpense, onExport }) {
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [editExpData, setEditExpData] = useState({ amount: '', date: '', description: '' });

  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editCatData, setEditCatData] = useState({ name: '', icon: '', target: '' });

  const handleSelectExpense = (e) => {
    const id = e.target.value;
    setSelectedExpenseId(id);
    if (id) {
      const exp = currentMonthExpenses.find(x => x.id === id);
      if (exp) {
        setEditExpData({ amount: exp.amount, date: exp.date, description: exp.description || '' });
      }
    }
  };

  const handleSaveEdit = () => {
    const exp = currentMonthExpenses.find(x => x.id === selectedExpenseId);
    if (!exp) return;
    onUpdateExpense({
      ...exp,
      amount: parseFloat(editExpData.amount),
      date: editExpData.date,
      description: editExpData.description
    });
    setSelectedExpenseId('');
  };

  const handleDeleteExpense = () => {
    if(window.confirm('Delete this expense?')) {
      onDeleteExpense(selectedExpenseId);
      setSelectedExpenseId('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal shadow-lg rounded-2xl">
        <div className="modal-header justify-between flex items-center mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> Settings</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="settings-section mb-6">
          <h4 className="font-semibold text-sm mb-3">Manage Categories</h4>
          <div className="targets-list flex flex-col gap-3">
            {categories.map(cat => {
              if (editingCategoryId === cat.id) {
                return (
                  <div key={cat.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input type="text" className="input-field p-2 w-1/4 text-center" value={editCatData.icon} onChange={e => setEditCatData({...editCatData, icon: e.target.value})} maxLength={2} placeholder="Icon" />
                      <input type="text" className="input-field p-2 w-3/4" value={editCatData.name} onChange={e => setEditCatData({...editCatData, name: e.target.value})} placeholder="Name" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-muted font-bold ml-2">₹</span>
                      <input type="number" className="input-field p-2 flex-1" value={editCatData.target} onChange={e => setEditCatData({...editCatData, target: e.target.value})} placeholder="Target" />
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button className="text-sm font-semibold text-muted px-2" onClick={() => setEditingCategoryId('')}>Cancel</button>
                      <button className="text-sm font-semibold text-[var(--color-green)] px-2" onClick={() => {
                        onUpdateCategory({...cat, name: editCatData.name, icon: editCatData.icon, target: parseFloat(editCatData.target) || 0});
                        setEditingCategoryId('');
                      }}>Save</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={cat.id} className="target-edit-row flex items-center justify-between gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 flex-1">
                    <span>{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">₹</span>
                    <span className="font-bold">{cat.target}</span>
                    <button 
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setEditCatData({ name: cat.name, icon: cat.icon, target: cat.target });
                      }}
                      title="Edit Category"
                      className="p-1 bg-white rounded shadow-sm ml-2"
                    >
                      <Edit2 size={14} className="text-muted"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="settings-section mb-6">
          <h4 className="font-semibold text-sm mb-3">Manage Recent Expenses</h4>
          <div className="flex flex-col gap-3">
            {currentMonthExpenses.length === 0 ? (
              <div className="text-muted text-sm">No expenses this month.</div>
            ) : (
              <select 
                className="input-field p-2 text-sm" 
                value={selectedExpenseId} 
                onChange={handleSelectExpense}
              >
                <option value="">-- Select an expense to edit --</option>
                {currentMonthExpenses.map(exp => {
                  const cat = categories.find(c => c.id === exp.categoryId);
                  const displayDate = format(parseISO(exp.date), 'dd MMM');
                  return (
                    <option key={exp.id} value={exp.id}>
                      {displayDate} • {cat?.name} • ₹{exp.amount} {exp.description ? `(${exp.description})` : ''}
                    </option>
                  );
                })}
              </select>
            )}

            {selectedExpenseId && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <input type="number" className="input-field p-2 w-1/3" value={editExpData.amount} onChange={e => setEditExpData({...editExpData, amount: e.target.value})} placeholder="Amt" />
                  <input type="date" className="input-field p-2 w-2/3" value={editExpData.date} onChange={e => setEditExpData({...editExpData, date: e.target.value})} />
                </div>
                <input type="text" className="input-field p-2" value={editExpData.description} onChange={e => setEditExpData({...editExpData, description: e.target.value})} placeholder="Description" />
                <div className="flex gap-2 justify-end mt-2">
                  <button className="text-sm font-semibold text-[var(--color-red)] px-3 py-1 bg-red-50 rounded-md" onClick={handleDeleteExpense}>Delete</button>
                  <button className="text-sm font-semibold text-[var(--color-green)] px-3 py-1 bg-green-50 rounded-md" onClick={handleSaveEdit}>Save Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-section mb-6">
          <h4 className="font-semibold text-sm mb-3">Preferences</h4>
          <div className="pref-row flex items-center justify-between">
            <span className="text-sm font-medium">Starting Date</span>
            <input 
              type="date"
              className="input-field w-auto p-1" 
              value={settings.startDate || ''} 
              onChange={(e) => onUpdateSetting('startDate', e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={onExport}>
          <Download size={18}/> Export to Excel
        </button>
      </div>
    </div>
  );
}

function DateModal({ currentDate, onClose, onSelect }) {
  const [date, setDate] = useState(currentDate);
  return (
    <div className="modal-overlay">
      <div className="modal-content shadow-lg rounded-2xl">
        <div className="modal-header justify-between flex items-center mb-6">
          <h3 className="font-bold text-lg">Select Date</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <input 
          type="date" 
          className="input-field mb-6" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
        />
        <button className="btn btn-primary w-full" onClick={() => onSelect(date)}>
          Confirm Date
        </button>
      </div>
    </div>
  );
}

export default App;
