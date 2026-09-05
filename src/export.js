import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToExcel = (categories, allExpenses, currentMonth, currentYear) => {
  // Filter expenses for current month
  const currentMonthExpenses = allExpenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const monthName = format(new Date(currentYear, currentMonth, 1), 'MMMM');

  // Sheet 1: Summary
  const totalTarget = categories.reduce((sum, cat) => sum + cat.target, 0);
  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const summaryData = [
    {
      Month: monthName,
      Year: currentYear,
      'Total Target': totalTarget,
      'Total Spent': totalSpent,
      Remaining: totalTarget - totalSpent,
      'Overall Percentage': totalTarget ? ((totalSpent / totalTarget) * 100).toFixed(1) + '%' : '0%'
    },
    {}, // Empty row
    { Category: 'Category', Target: 'Target', Spent: 'Spent', Remaining: 'Remaining', Percentage: 'Percentage', Status: 'Status' }
  ];

  categories.forEach(cat => {
    const spent = currentMonthExpenses
      .filter(exp => exp.categoryId === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const percentage = cat.target ? (spent / cat.target) * 100 : 0;
    
    let status = 'Safe';
    if (percentage > 25 && percentage <= 50) status = 'Warning';
    else if (percentage > 50 && percentage <= 75) status = 'Critical';
    else if (percentage > 75 && percentage <= 100) status = 'Exceeded';
    else if (percentage > 100) status = 'Danger';

    summaryData.push({
      Category: cat.name,
      Target: cat.target,
      Spent: spent,
      Remaining: cat.target - spent,
      Percentage: percentage.toFixed(1) + '%',
      Status: status
    });
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });

  // Sheet 2: Expenses
  const expensesData = currentMonthExpenses.map(exp => {
    const cat = categories.find(c => c.id === exp.categoryId);
    return {
      Date: exp.date,
      Category: cat ? cat.name : 'Unknown',
      Amount: exp.amount,
      Description: exp.description || '',
      Month: monthName,
      Year: currentYear,
      'Entry Timestamp': exp.timestamp ? new Date(exp.timestamp).toLocaleString() : ''
    };
  });
  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);

  // Sheet 3: Category Targets (all categories)
  const targetsData = categories.map(cat => {
    const spent = currentMonthExpenses
      .filter(exp => exp.categoryId === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const percentage = cat.target ? (spent / cat.target) * 100 : 0;
    
    let status = 'Safe';
    if (percentage > 25 && percentage <= 50) status = 'Warning';
    else if (percentage > 50 && percentage <= 75) status = 'Critical';
    else if (percentage > 75 && percentage <= 100) status = 'Exceeded';
    else if (percentage > 100) status = 'Danger';

    return {
      Category: cat.name,
      'Monthly Target': cat.target,
      'Current Spent': spent,
      Remaining: cat.target - spent,
      'Percentage Used': percentage.toFixed(1) + '%',
      Status: status
    };
  });
  const targetsSheet = XLSX.utils.json_to_sheet(targetsData);

  // Sheet 4: Daily Summary
  const dailyDataMap = {};
  currentMonthExpenses.forEach(exp => {
    if (!dailyDataMap[exp.date]) {
      dailyDataMap[exp.date] = { Date: exp.date, 'Total Daily Expense': 0 };
      categories.forEach(c => dailyDataMap[exp.date][c.name] = 0);
    }
    
    const cat = categories.find(c => c.id === exp.categoryId);
    if (cat) {
      dailyDataMap[exp.date][cat.name] += exp.amount;
    }
    dailyDataMap[exp.date]['Total Daily Expense'] += exp.amount;
  });

  const dailyData = Object.values(dailyDataMap).sort((a, b) => new Date(a.Date) - new Date(b.Date));
  const dailySheet = XLSX.utils.json_to_sheet(dailyData);

  // Workbook setup
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');
  XLSX.utils.book_append_sheet(wb, targetsSheet, 'Category Targets');
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Summary');

  // Download
  XLSX.writeFile(wb, `Expense_Tracker_${monthName}_${currentYear}.xlsx`);
};
