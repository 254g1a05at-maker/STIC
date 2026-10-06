import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  CreditCard,
  Building,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  PieChart,
  BarChart3,
  MoreVertical,
  Calculator,
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Eye
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function FinanceView({ showToast, openAddTrigger, onCloseAddTrigger, allPrograms, onFinanceChange }) {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [chartKey, setChartKey] = useState(Date.now());

  // KPI Management Menus & Modals
  const [activeMenu, setActiveMenu] = useState(null); // 'income' | 'expense' | 'balance' | null
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState('Income'); // 'Income' | 'Expense'
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('');
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [wipeConfirmationText, setWipeConfirmationText] = useState('');
  const [showAdvancedWipe, setShowAdvancedWipe] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [expChartType, setExpChartType] = useState('pie'); // 'pie' | 'bar'
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [progFormData, setProgFormData] = useState({
    name: '',
    program_date: new Date().toISOString().split('T')[0],
    venue: 'Campus Auditorium',
    program_type: 'Workshop',
    initial_income: '',
    initial_expense: ''
  });

  // Form State
  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    category: 'Registration',
    program_id: '',
    description: '',
    source_vendor: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI'
  });
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, [typeFilter, categoryFilter, programFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    if (openAddTrigger) {
      handleOpenAddModal();
      if (onCloseAddTrigger) onCloseAddTrigger();
    }
  }, [openAddTrigger]);

  // Click outside to close active KPI menus
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.kpi-actions-row')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchData = async (yearToUse) => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (programFilter) params.program_id = programFilter;
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const activeYear = yearToUse !== undefined ? yearToUse : selectedYear;
      const [overRes, txnRes] = await Promise.all([
        api.getFinanceOverview(activeYear || undefined),
        api.getTransactions(params)
      ]);
      setOverview(overRes.data);
      if (!selectedYear && overRes.data?.selectedYear?.year) {
        setSelectedYear(overRes.data.selectedYear.year);
      }
      setTransactions(txnRes.data || []);
      setChartKey(Date.now());
    } catch (err) {
      showToast('error', 'Error loading finance records', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const handleOpenAddModal = (customType) => {
    setEditingTxn(null);
    const chosenType = customType || 'Income';
    setFormData({
      type: chosenType,
      amount: '',
      category: chosenType === 'Income' ? 'Registration' : 'Food',
      program_id: allPrograms && allPrograms.length > 0 ? allPrograms[0].id : '',
      description: '',
      source_vendor: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'UPI'
    });
    setCustomCategory('');
    setReceiptFile(null);
    setIsFormOpen(true);
  };

  const handleOpenAddIncomeModal = () => handleOpenAddModal('Income');
  const handleOpenAddExpenseModal = () => handleOpenAddModal('Expense');

  const handleOpenEditModal = (txn) => {
    setEditingTxn(txn);
    const presetExpenseCats = ['Food', 'Printing', 'Certificates', 'Decoration', 'Transportation', 'Equipment', 'Marketing', 'Venue', 'Refreshments', 'Prize Pool', 'Honorarium'];
    const presetIncomeCats = ['Registration', 'Sponsorship', 'Donations', 'Club contribution'];
    const isPreset = (txn.type === 'Income' ? presetIncomeCats : presetExpenseCats).includes(txn.category);

    setFormData({
      type: txn.type,
      amount: txn.amount,
      category: isPreset ? txn.category : 'Other',
      program_id: txn.program_id || '',
      description: txn.description || '',
      source_vendor: txn.source_vendor || '',
      notes: txn.notes || '',
      date: txn.date,
      payment_method: txn.payment_method || 'UPI'
    });
    setCustomCategory(isPreset ? '' : txn.category);
    setReceiptFile(null);
    setIsFormOpen(true);
  };

  const handleOpenDeleteRecordsModal = (type) => {
    setDeleteModalType(type);
    setSelectedDeleteIds([]);
    setDeleteSearchQuery('');
    setIsDeleteModalOpen(true);
  };

  const handleToggleDeleteId = (id) => {
    setSelectedDeleteIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const activeRecordsForDelete = transactions.filter(t => t.type === deleteModalType);
  const displayedDeleteRecords = activeRecordsForDelete.filter(t => {
    if (!deleteSearchQuery) return true;
    const q = deleteSearchQuery.toLowerCase();
    return (
      (t.transaction_code && t.transaction_code.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.source_vendor && t.source_vendor.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.program_name && t.program_name.toLowerCase().includes(q)) ||
      (String(t.amount).includes(q))
    );
  });

  const isAllSelected = displayedDeleteRecords.length > 0 &&
    displayedDeleteRecords.every(r => selectedDeleteIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const displayedIds = new Set(displayedDeleteRecords.map(r => r.id));
      setSelectedDeleteIds(prev => prev.filter(id => !displayedIds.has(id)));
    } else {
      const newIds = new Set([...selectedDeleteIds, ...displayedDeleteRecords.map(r => r.id)]);
      setSelectedDeleteIds(Array.from(newIds));
    }
  };

  const totalSelectedDeleteAmount = selectedDeleteIds.reduce((sum, id) => {
    const item = transactions.find(t => t.id === id);
    return sum + (item ? Number(item.amount) : 0);
  }, 0);

  const handleExecuteBatchDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedDeleteIds.length} selected ${deleteModalType.toLowerCase()} record(s) from the database? All totals and balances will be recalculated immediately.`)) {
      return;
    }

    try {
      const res = await api.batchDeleteTransactions(selectedDeleteIds);
      showToast('success', 'Records Deleted', res.message || `Deleted ${selectedDeleteIds.length} records.`);
      setIsDeleteModalOpen(false);
      setSelectedDeleteIds([]);
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Batch Delete Failed', err.message);
    }
  };

  const handleRefreshSummaryDisplay = async () => {
    try {
      await api.resetFinanceSummary({ mode: 'recalculate' });
      setTypeFilter('');
      setCategoryFilter('');
      setProgramFilter('');
      setSearch('');
      setDateFrom('');
      setDateTo('');
      await fetchData();
      if (onFinanceChange) onFinanceChange();
      setIsResetModalOpen(false);
      showToast('success', 'Summary Refreshed', 'Financial summary and charts successfully re-synchronized from the database.');
    } catch (err) {
      showToast('error', 'Refresh Failed', err.message);
    }
  };

  const handleExecuteWipeRecords = async () => {
    if (wipeConfirmationText !== 'CONFIRM RESET') {
      showToast('error', 'Confirmation Required', 'You must type CONFIRM RESET exactly to proceed.');
      return;
    }

    try {
      const res = await api.resetFinanceSummary({ mode: 'delete_all', confirmation: 'CONFIRM RESET' });
      showToast('success', 'Finances Reset', res.message);
      setIsResetModalOpen(false);
      setWipeConfirmationText('');
      setShowAdvancedWipe(false);
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Reset Failed', err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let finalCategory = formData.category;
    if (formData.category === 'Other') {
      if (!customCategory.trim()) {
        showToast('error', 'Validation Error', 'Please enter your custom category description/name.');
        return;
      }
      finalCategory = customCategory.trim();
    }

    if (!formData.amount || !finalCategory || !formData.date) {
      showToast('error', 'Validation Error', 'Amount, category, and date are required.');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(k => {
        if (k === 'category') {
          data.append('category', finalCategory);
        } else {
          data.append(k, formData[k] !== null && formData[k] !== undefined ? formData[k] : '');
        }
      });
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      if (editingTxn) {
        await api.updateTransaction(editingTxn.id, data);
        showToast('success', 'Transaction Updated', 'Financial record modified successfully.');
      } else {
        await api.createTransaction(data);
        showToast('success', 'Transaction Recorded', `${formData.type} of ${formatINR(formData.amount)} added under ${finalCategory}.`);
      }

      setIsFormOpen(false);
      setCustomCategory('');
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Failed to save transaction', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteTransaction(deleteCandidate.id);
      showToast('success', 'Transaction Deleted', 'Record removed and balances recalculated.');
      setDeleteCandidate(null);
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Spreadsheet Expense Sheet State
  const [userCategories, setUserCategories] = useState([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [spreadsheetSearch, setSpreadsheetSearch] = useState('');
  const saveTimeoutRef = React.useRef({});

  const defaultCategories = [
    'Food', 'Printing', 'Certificates', 'Decoration', 'Transportation',
    'Equipment', 'Marketing', 'Venue', 'Refreshments', 'Prize Pool', 'Honorarium'
  ];

  const allCategoriesList = Array.from(new Set([
    ...defaultCategories,
    ...userCategories,
    ...(transactions || []).map(r => r.category).filter(Boolean)
  ]));

  const handleAddCustomCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      showToast('error', 'Validation Error', 'Please enter a category name.');
      return;
    }
    if (allCategoriesList.includes(trimmed)) {
      showToast('error', 'Duplicate Category', `Category "${trimmed}" already exists.`);
      return;
    }
    setUserCategories(prev => [...prev, trimmed]);
    setNewCatInput('');
    setIsCategoryManagerOpen(false);
    showToast('success', 'Category Created', `New category "${trimmed}" added successfully.`);
  };

  const handleDeleteCustomCategory = (catName) => {
    setUserCategories(prev => prev.filter(c => c !== catName));
    showToast('success', 'Category Removed', `Category "${catName}" removed from custom list.`);
  };

  const handleCreateProgramSummary = async (e) => {
    e.preventDefault();
    if (!progFormData.name.trim() || !progFormData.program_date) {
      showToast('error', 'Validation Error', 'Program name and date are required.');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', progFormData.name.trim());
      data.append('program_date', progFormData.program_date);
      data.append('venue', progFormData.venue.trim() || 'Campus Auditorium');
      data.append('program_type', progFormData.program_type || 'Workshop');
      data.append('status', 'Completed');

      const res = await api.createProgram(data);
      const newProg = res.data;

      const initInc = parseFloat(progFormData.initial_income);
      if (!isNaN(initInc) && initInc > 0) {
        const incData = new FormData();
        incData.append('type', 'Income');
        incData.append('amount', initInc);
        incData.append('category', 'Registration');
        incData.append('description', `Initial Income for ${progFormData.name}`);
        incData.append('date', progFormData.program_date);
        incData.append('program_id', newProg.id);
        incData.append('payment_method', 'UPI');
        await api.createTransaction(incData);
      }

      const initExp = parseFloat(progFormData.initial_expense);
      if (!isNaN(initExp) && initExp > 0) {
        const expData = new FormData();
        expData.append('type', 'Expense');
        expData.append('amount', initExp);
        expData.append('category', 'Food');
        expData.append('description', `Initial Expense for ${progFormData.name}`);
        expData.append('date', progFormData.program_date);
        expData.append('program_id', newProg.id);
        expData.append('payment_method', 'UPI');
        await api.createTransaction(expData);
      }

      showToast('success', 'Program Created', `Financial summary for "${progFormData.name}" added successfully.`);
      setIsAddProgramModalOpen(false);
      setProgFormData({
        name: '',
        program_date: new Date().toISOString().split('T')[0],
        venue: 'Campus Auditorium',
        program_type: 'Workshop',
        initial_income: '',
        initial_expense: ''
      });
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Failed to add program', err.message);
    }
  };

  const handleDeleteProgramSummary = async (programId, programName) => {
    if (!window.confirm(`Delete program "${programName}" and its financial summary?`)) {
      return;
    }
    try {
      await api.deleteProgram(programId);
      showToast('success', 'Program Deleted', `Program "${programName}" deleted.`);
      await fetchData();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  const isAddingRowRef = React.useRef(false);

  const handleAddSpreadsheetRow = async () => {
    if (isAddingRowRef.current) return;
    isAddingRowRef.current = true;

    // Clear search so new row is immediately visible
    setSpreadsheetSearch('');

    const defaultCat = allCategoriesList[0] || 'Food';
    const today = new Date().toISOString().split('T')[0];
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const tempRow = {
      id: tempId,
      type: 'Expense',
      amount: 0,
      category: defaultCat,
      description: '',
      date: today,
      payment_method: 'UPI'
    };

    // Instant local state update for 0ms editable row appearance
    setTransactions(prev => [tempRow, ...prev]);

    try {
      const data = new FormData();
      data.append('type', 'Expense');
      data.append('amount', 0);
      data.append('category', defaultCat);
      data.append('description', '');
      data.append('date', today);
      data.append('payment_method', 'UPI');

      const res = await api.createTransaction(data);
      if (res && res.data) {
        setTransactions(prev => prev.map(t => {
          if (t.id === tempId) {
            return { ...res.data, ...t, id: res.data.id };
          }
          return t;
        }));
      }
      showToast('success', 'Row Added', 'New spreadsheet expense row created.');
      const overRes = await api.getFinanceOverview(selectedYear || undefined);
      if (overRes?.data) setOverview(overRes.data);
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      showToast('error', 'Failed to add row', err.message || 'Server error creating row');
    } finally {
      isAddingRowRef.current = false;
    }
  };

  const handleInlineCellUpdate = (id, field, value) => {
    // 1. Instant local state update for instant recalculation of totals & charts!
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    }));

    // 2. Debounced save to database backend if not a temporary row in-flight
    if (String(id).startsWith('temp-')) return;

    if (saveTimeoutRef.current[id]) {
      clearTimeout(saveTimeoutRef.current[id]);
    }
    saveTimeoutRef.current[id] = setTimeout(async () => {
      try {
        const txn = transactions.find(t => t.id === id);
        const data = new FormData();
        data.append('type', 'Expense');
        data.append('date', field === 'date' ? value : (txn?.date || new Date().toISOString().split('T')[0]));
        data.append('description', field === 'description' ? value : (txn?.description || ''));
        data.append('category', field === 'category' ? value : (txn?.category || 'Food'));
        data.append('amount', field === 'amount' ? (Number(value) || 0) : (Number(txn?.amount) || 0));
        data.append('program_id', field === 'program_id' ? (value ? Number(value) : '') : (txn?.program_id || ''));
        data.append('payment_method', txn?.payment_method || 'UPI');

        await api.updateTransaction(id, data);
        const overRes = await api.getFinanceOverview(selectedYear || undefined);
        if (overRes?.data) setOverview(overRes.data);
        if (onFinanceChange) onFinanceChange();
      } catch (err) {
        console.error('Cell update error:', err);
      }
    }, 400);
  };

  const handleDeleteSpreadsheetRow = async (id) => {
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('success', 'Row Deleted', 'Expense entry removed.');
      if (!String(id).startsWith('temp-')) {
        await api.deleteTransaction(id);
        const overRes = await api.getFinanceOverview(selectedYear || undefined);
        if (overRes?.data) setOverview(overRes.data);
        if (onFinanceChange) onFinanceChange();
      }
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Dynamic palette for expense category charts
  const categoryPalette = [
    '#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
    '#e11d48', '#059669', '#0284c7', '#d97706', '#7c3aed',
    '#0891b2', '#db2777', '#ea580c', '#4f46e5', '#0d9488'
  ];

  // Dynamic Real-time Program Summaries directly from active transactions state!
  const programMap = {};

  const baseProgramsList = (allPrograms && allPrograms.length > 0)
    ? allPrograms
    : (overview?.financeByProgram || []);

  baseProgramsList.forEach(p => {
    const id = p.id;
    programMap[id] = {
      id: id,
      program_name: p.name || p.program_name,
      program_date: p.program_date || p.date || new Date().toISOString().split('T')[0],
      income: Number(p.total_income !== undefined ? p.total_income : (p.income || 0)),
      expense: 0
    };
  });

  const GENERAL_ID = 'general';
  programMap[GENERAL_ID] = {
    id: GENERAL_ID,
    program_name: 'General Operations / Central Treasury',
    program_date: 'N/A',
    income: 0,
    expense: 0
  };

  (transactions || []).forEach(t => {
    const pId = t.program_id ? Number(t.program_id) : GENERAL_ID;
    const amt = Number(t.amount) || 0;

    if (!programMap[pId]) {
      programMap[pId] = {
        id: pId,
        program_name: t.program_name || `Program #${pId}`,
        program_date: t.date || new Date().toISOString().split('T')[0],
        income: 0,
        expense: 0
      };
    }

    if (t.type === 'Income') {
      if (pId === GENERAL_ID || !baseProgramsList.some(bp => Number(bp.id) === Number(pId))) {
        programMap[pId].income += amt;
      }
    } else {
      programMap[pId].expense += amt;
    }
  });

  const computedProgramSummaries = Object.values(programMap).map(p => ({
    ...p,
    balance: p.income - p.expense
  })).filter(p => p.id !== GENERAL_ID || p.income > 0 || p.expense > 0);

  // Dynamic Expense Aggregations directly from active state for instant real-time calculations!
  const expenseRows = (transactions || []).filter(t => t.type === 'Expense');
  const displayedExpenseRows = expenseRows.filter(r => {
    if (!spreadsheetSearch) return true;
    const q = spreadsheetSearch.toLowerCase();
    return (
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      (r.date && r.date.toLowerCase().includes(q)) ||
      String(r.amount).includes(q)
    );
  });

  const totalExpenseSum = expenseRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Group by category dynamically from current state
  const categoryTotalsMap = {};
  const categoryCountsMap = {};

  expenseRows.forEach(r => {
    const cat = r.category || 'Other';
    const amt = Number(r.amount) || 0;
    categoryTotalsMap[cat] = (categoryTotalsMap[cat] || 0) + amt;
    categoryCountsMap[cat] = (categoryCountsMap[cat] || 0) + 1;
  });

  const expCategories = Object.keys(categoryTotalsMap).map(cat => ({
    category: cat,
    total: categoryTotalsMap[cat],
    count: categoryCountsMap[cat]
  })).sort((a, b) => b.total - a.total);

  const hasExpenseData = expCategories.length > 0 && expCategories.some(c => Number(c.total) > 0);

  // Pie Chart Data
  const expChartData = {
    labels: expCategories.map(c => c.category),
    datasets: [
      {
        data: expCategories.map(c => Number(c.total)),
        backgroundColor: expCategories.map((_, idx) => categoryPalette[idx % categoryPalette.length]),
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  const expChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter, sans-serif' },
          boxWidth: 12,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const val = ctx.parsed || 0;
            const pct = totalExpenseSum > 0 ? ((val / totalExpenseSum) * 100).toFixed(1) : 0;
            return ` ${label}: ₹${Number(val).toLocaleString('en-IN')} (${pct}%)`;
          }
        }
      }
    }
  };

  // Bar Chart Data for Expenses by Category
  const expCategoryBarData = {
    labels: expCategories.map(c => c.category),
    datasets: [
      {
        label: 'Money Spent (₹)',
        data: expCategories.map(c => Number(c.total)),
        backgroundColor: expCategories.map((_, idx) => categoryPalette[idx % categoryPalette.length]),
        borderRadius: 4
      }
    ]
  };

  const expCategoryBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y || 0;
            const pct = totalExpenseSum > 0 ? ((val / totalExpenseSum) * 100).toFixed(1) : 0;
            return ` ₹${Number(val).toLocaleString('en-IN')} (${pct}% of total spent)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.35)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
        }
      }
    }
  };

  // Chart 2: Monthly Cash Flows Bar Graph (Money Collected vs Money Spent)
  const monthlyTrends = overview?.monthlyTrends || [];
  const hasMonthlyData = monthlyTrends.length > 0 && monthlyTrends.some(m => Number(m.income) > 0 || Number(m.expense) > 0);
  const monthlyChartData = {
    labels: monthlyTrends.map(m => m.month),
    datasets: [
      {
        label: 'Money Collected',
        data: monthlyTrends.map(m => Number(m.income) || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        hoverBackgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Money Spent',
        data: monthlyTrends.map(m => Number(m.expense) || 0),
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        hoverBackgroundColor: '#f43f5e',
        borderRadius: 4
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter, sans-serif' },
          boxWidth: 12,
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label || '';
            const val = ctx.parsed.y || 0;
            return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.35)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
        }
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <IndianRupee size={26} color="var(--primary-light)" />
            Finance & Accounts Management
          </h1>
          <p>
            Complete financial transparency, audit trail, program accounts, and dynamic balance calculations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> + Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Cards: All-time & Year-to-Date Totals with Dedicated Management Controls */}
      {overview && (
        <div className="finance-kpi-grid">
          {/* 1. TOTAL MONEY COLLECTED */}
          <div className="kpi-card kpi-card-finance-income">
            <div className="kpi-icon-wrap kpi-icon-emerald"><TrendingUp size={24} /></div>
            <div className="kpi-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="kpi-label">TOTAL MONEY COLLECTED</div>
                <div className="kpi-actions-row">
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>+ INFLOW</span>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-success"
                    onClick={() => handleOpenAddIncomeModal()}
                    title="Add Money Collected / Income Record"
                  >
                    <Plus size={12} /> + INSERT / ADD
                  </button>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    onClick={() => handleOpenDeleteRecordsModal('Income')}
                    title="Delete Money Collected Records"
                  >
                    <Trash2 size={12} /> DELETE
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`kpi-menu-btn ${activeMenu === 'income' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === 'income' ? null : 'income');
                      }}
                      title="Collections Management Menu"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenu === 'income' && (
                      <div className="kpi-dropdown-menu">
                        <button
                          className="kpi-dropdown-item"
                          onClick={() => {
                            setActiveMenu(null);
                            handleOpenAddIncomeModal();
                          }}
                        >
                          <Plus size={14} color="#10b981" /> + Add Collection
                        </button>
                        <button
                          className="kpi-dropdown-item"
                          onClick={() => {
                            setActiveMenu(null);
                            setTypeFilter('Income');
                            document.getElementById('transactions-ledger')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Eye size={14} color="#38bdf8" /> View Collections
                        </button>
                        <button
                          className="kpi-dropdown-item danger-item"
                          onClick={() => {
                            setActiveMenu(null);
                            handleOpenDeleteRecordsModal('Income');
                          }}
                        >
                          <Trash2 size={14} color="#fb7185" /> Delete Collection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="kpi-value" style={{ color: '#34d399', fontSize: '1.8rem', marginTop: '2px' }}>
                {formatINR(overview.allTime.totalIncome)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div className="kpi-subtext">Year {overview.selectedYear?.year}: {formatINR(overview.selectedYear?.income)}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-success"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => handleOpenAddIncomeModal()}
                  >
                    <Plus size={11} /> + Add
                  </button>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => handleOpenDeleteRecordsModal('Income')}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TOTAL MONEY SPENT */}
          <div className="kpi-card kpi-card-finance-expense">
            <div className="kpi-icon-wrap kpi-icon-rose"><TrendingDown size={24} /></div>
            <div className="kpi-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="kpi-label">TOTAL MONEY SPENT</div>
                <div className="kpi-actions-row">
                  <span className="badge badge-danger" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>- OUTFLOW</span>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    onClick={() => handleOpenAddExpenseModal()}
                    title="Add Money Spent / Expense Record"
                  >
                    <Plus size={12} /> + INSERT / ADD
                  </button>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    onClick={() => handleOpenDeleteRecordsModal('Expense')}
                    title="Delete Money Spent Records"
                  >
                    <Trash2 size={12} /> DELETE
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`kpi-menu-btn ${activeMenu === 'expense' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === 'expense' ? null : 'expense');
                      }}
                      title="Expenses Management Menu"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenu === 'expense' && (
                      <div className="kpi-dropdown-menu">
                        <button
                          className="kpi-dropdown-item"
                          onClick={() => {
                            setActiveMenu(null);
                            handleOpenAddExpenseModal();
                          }}
                        >
                          <Plus size={14} color="#fb7185" /> + Add Expense
                        </button>
                        <button
                          className="kpi-dropdown-item"
                          onClick={() => {
                            setActiveMenu(null);
                            setTypeFilter('Expense');
                            document.getElementById('transactions-ledger')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Eye size={14} color="#38bdf8" /> View Expenses
                        </button>
                        <button
                          className="kpi-dropdown-item danger-item"
                          onClick={() => {
                            setActiveMenu(null);
                            handleOpenDeleteRecordsModal('Expense');
                          }}
                        >
                          <Trash2 size={14} color="#fb7185" /> Delete Expense
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="kpi-value" style={{ color: '#fb7185', fontSize: '1.8rem', marginTop: '2px' }}>
                {formatINR(overview.allTime.totalExpense)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div className="kpi-subtext">Year {overview.selectedYear?.year}: {formatINR(overview.selectedYear?.expense)}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => handleOpenAddExpenseModal()}
                  >
                    <Plus size={11} /> + Add
                  </button>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-danger"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => handleOpenDeleteRecordsModal('Expense')}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. STIC NET BALANCE */}
          <div className="kpi-card kpi-card-finance-balance">
            <div className="kpi-icon-wrap kpi-icon-cyan"><IndianRupee size={24} /></div>
            <div className="kpi-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="kpi-label">STIC NET BALANCE</div>
                <div className="kpi-actions-row">
                  <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>= NET BALANCE</span>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-info"
                    onClick={() => setIsResetModalOpen(true)}
                    title="Manage / Reset STIC Net Balance"
                  >
                    <Trash2 size={12} /> DELETE / RESET
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`kpi-menu-btn ${activeMenu === 'balance' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === 'balance' ? null : 'balance');
                      }}
                      title="Net Balance Menu"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenu === 'balance' && (
                      <div className="kpi-dropdown-menu">
                        <button
                          className="kpi-dropdown-item"
                          onClick={() => {
                            setActiveMenu(null);
                            setIsCalcModalOpen(true);
                          }}
                        >
                          <Calculator size={14} color="#38bdf8" /> View Calculation
                        </button>
                        <button
                          className="kpi-dropdown-item danger-item"
                          onClick={() => {
                            setActiveMenu(null);
                            setIsResetModalOpen(true);
                          }}
                        >
                          <RefreshCw size={14} color="#f59e0b" /> Reset/Manage Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="kpi-value" style={{ color: overview.allTime.netBalance >= 0 ? '#34d399' : '#fb7185', fontSize: '1.8rem', marginTop: '2px' }}>
                {formatINR(overview.allTime.netBalance)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div className="kpi-subtext">Formula: Total Collected - Total Spent</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-info"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => setIsCalcModalOpen(true)}
                  >
                    <Calculator size={11} /> Formula
                  </button>
                  <button
                    type="button"
                    className="kpi-pill-btn kpi-pill-btn-info"
                    style={{ fontSize: '0.64rem', padding: '2px 7px' }}
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    <RefreshCw size={11} /> Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Spreadsheet-style Expense Management System */}
      <div className="stic-card" style={{ marginBottom: '24px' }}>
        <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#fb7185" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Spreadsheet Expense Sheet ({expenseRows.length} entries)
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0 }}>
                Flexible, spreadsheet-style expense sheet · Add unlimited rows, edit inline, create custom categories — totals and charts update instantly
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-search-box" style={{ width: '200px' }}>
              <Search size={14} className="search-icon-pos" />
              <input
                type="text"
                placeholder="Search expense sheet..."
                value={spreadsheetSearch}
                onChange={(e) => setSpreadsheetSearch(e.target.value)}
                style={{ padding: '5px 10px 5px 30px', fontSize: '0.78rem' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsCategoryManagerOpen(true)}
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={13} /> Manage Categories ({allCategoriesList.length})
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAddSpreadsheetRow}
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={14} /> + Add New Row
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="stic-table spreadsheet-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '130px' }}>Date *</th>
                  <th>Expense Item / Description *</th>
                  <th style={{ width: '170px' }}>Category *</th>
                  <th style={{ width: '210px' }}>Program / Event</th>
                  <th style={{ width: '140px' }}>Amount (₹) *</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenseRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem' }}>
                      No expense rows found in the sheet. Click <strong>"+ Add New Row"</strong> to create unlimited expense entries.
                    </td>
                  </tr>
                ) : (
                  displayedExpenseRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => handleInlineCellUpdate(row.id, 'date', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.description || ''}
                          onChange={(e) => handleInlineCellUpdate(row.id, 'description', e.target.value)}
                          placeholder="e.g. Printing flex banners for Expo..."
                          style={{ fontSize: '0.84rem' }}
                        />
                      </td>
                      <td>
                        <select
                          value={row.category || 'Food'}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW_CAT') {
                              setIsCategoryManagerOpen(true);
                            } else {
                              handleInlineCellUpdate(row.id, 'category', e.target.value);
                            }
                          }}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {allCategoriesList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="ADD_NEW_CAT" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
                            + Create New Category...
                          </option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={row.program_id || ''}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW_PROG') {
                              setIsAddProgramModalOpen(true);
                            } else {
                              handleInlineCellUpdate(row.id, 'program_id', e.target.value ? Number(e.target.value) : null);
                            }
                          }}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">General Operations</option>
                          {(baseProgramsList || []).map((p) => (
                            <option key={p.id} value={p.id}>{p.name || p.program_name}</option>
                          ))}
                          <option value="ADD_NEW_PROG" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
                            + Create New Program...
                          </option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={row.amount || ''}
                          onChange={(e) => handleInlineCellUpdate(row.id, 'amount', e.target.value)}
                          placeholder="0"
                          style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fb7185' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteSpreadsheetRow(row.id)}
                          title="Delete Expense Row"
                        >
                          <Trash2 size={15} style={{ color: '#fb7185' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Spreadsheet Footer Summary Bar */}
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            fontSize: '0.86rem'
          }}>
            <div style={{ color: 'var(--text-muted)' }}>
              Sheet Total: <strong style={{ color: 'var(--text-main)' }}>{expenseRows.length}</strong> row(s)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                Total Expenses:{' '}
                <strong style={{ color: '#fb7185', fontSize: '1.05rem', fontWeight: 800 }}>
                  {formatINR(totalExpenseSum)}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddSpreadsheetRow}
                style={{ fontSize: '0.78rem' }}
              >
                <Plus size={14} /> + Add Row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Finance Analytics Charts (Real-time Database Connection) */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px', marginBottom: '24px' }}>
          {/* 1. Monthly Cash Flows Bar Graph */}
          <div className="stic-card" style={{ marginBottom: 0 }}>
            <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><BarChart3 size={18} color="var(--primary-light)" /> Monthly Cash Flows ({overview.selectedYear?.year || selectedYear})</h3>
              {overview.availableYears && overview.availableYears.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year:</span>
                  <select
                    value={selectedYear || overview.selectedYear?.year}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value, 10);
                      setSelectedYear(yr);
                      fetchData(yr);
                    }}
                    className="form-select"
                    style={{ padding: '2px 8px', fontSize: '0.78rem', height: '28px', minWidth: '80px' }}
                  >
                    {overview.availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="card-body">
              {hasMonthlyData ? (
                <div style={{ height: '240px' }}>
                  <Bar
                    key={`bar-${chartKey}`}
                    data={monthlyChartData}
                    options={monthlyChartOptions}
                  />
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                  <BarChart3 size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>No financial data available</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Expenses by Category Chart Card (Pie & Bar Graph Views) */}
          <div className="stic-card" style={{ marginBottom: 0 }}>
            <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                {expChartType === 'pie' ? <PieChart size={18} color="#f43f5e" /> : <BarChart3 size={18} color="#f43f5e" />}
                Expenses by Category ({expCategories.length})
              </h3>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${expChartType === 'pie' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setExpChartType('pie')}
                  style={{ padding: '3px 10px', fontSize: '0.74rem', border: 'none' }}
                >
                  <PieChart size={13} /> Pie Chart
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${expChartType === 'bar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setExpChartType('bar')}
                  style={{ padding: '3px 10px', fontSize: '0.74rem', border: 'none' }}
                >
                  <BarChart3 size={13} /> Bar Graph
                </button>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
              {hasExpenseData ? (
                <>
                  <div style={{ height: '230px', width: '100%' }}>
                    {expChartType === 'pie' ? (
                      <Pie
                        key={`pie-${chartKey}`}
                        data={expChartData}
                        options={expChartOptions}
                      />
                    ) : (
                      <Bar
                        key={`bar-cat-${chartKey}`}
                        data={expCategoryBarData}
                        options={expCategoryBarOptions}
                      />
                    )}
                  </div>

                  {/* All Category Amounts Breakdown Grid */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      All Categories & Amounts Spent ({formatINR(totalExpenseSum)})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                      {expCategories.map((c, idx) => {
                        const color = categoryPalette[idx % categoryPalette.length];
                        const pct = totalExpenseSum > 0 ? ((Number(c.total) / totalExpenseSum) * 100).toFixed(1) : 0;
                        return (
                          <div
                            key={c.category}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.category}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 700 }}>
                                {formatINR(c.total)} <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>({pct}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                  <PieChart size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>No expense data available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Program-wise Financial Breakdown Table */}
      <div className="stic-card" style={{ marginBottom: '24px' }}>
        <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Individual Program Financial Summaries
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0 }}>
              Track money collected, spent, and remaining balance program-wise
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddProgramModalOpen(true)}
            style={{ fontSize: '0.78rem' }}
          >
            <Plus size={14} /> + Add Program
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="stic-table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Date</th>
                  <th>Money Collected (₹)</th>
                  <th>Money Spent (₹)</th>
                  <th>Remaining Balance (₹)</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(computedProgramSummaries.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem' }}>
                      No program financial summaries found. Click <strong>"+ Add Program"</strong> to create a program financial summary.
                    </td>
                  </tr>
                ) : (
                  computedProgramSummaries.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.program_name}</td>
                      <td>{p.program_date}</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>{formatINR(p.income)}</td>
                      <td style={{ fontWeight: 700, color: '#fb7185' }}>{formatINR(p.expense)}</td>
                      <td style={{ fontWeight: 800, color: p.balance >= 0 ? '#34d399' : '#fb7185' }}>
                        {formatINR(p.balance)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.id !== 'general' && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDeleteProgramSummary(p.id, p.program_name)}
                            title="Delete Program Financial Summary"
                          >
                            <Trash2 size={15} style={{ color: '#fb7185' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Ledger & Filters */}
      <div className="stic-card" id="transactions-ledger">
        <div className="card-header-bar">
          <h3>STIC Master Financial Transactions Ledger ({transactions.length})</h3>
        </div>

        <div className="card-body">
          {/* Filters Bar */}
          <div className="filter-bar" style={{ marginBottom: '16px' }}>
            <div className="filter-search-box">
              <Search size={16} className="search-icon-pos" />
              <input
                type="text"
                placeholder="Search transaction code, description, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="Income">Income (Money Collected)</option>
              <option value="Expense">Expense (Money Spent)</option>
            </select>

            <select
              className="filter-select"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
            >
              <option value="">All Programs / Operations</option>
              {(allPrograms || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="general">General Operations</option>
            </select>

            <input
              type="date"
              className="filter-select"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From Date"
            />
            <input
              type="date"
              className="filter-select"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To Date"
            />
          </div>

          {/* Ledger Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No transactions match your search criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="stic-table">
                <thead>
                  <tr>
                    <th>Ref Code</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Program</th>
                    <th>Date & Method</th>
                    <th>Vendor / Source</th>
                    <th>Receipt</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                        {txn.transaction_code}
                      </td>
                      <td>
                        <span className={`badge ${txn.type === 'Income' ? 'badge-success' : 'badge-danger'}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td><span className="badge badge-neutral">{txn.category}</span></td>
                      <td style={{ fontWeight: 800, color: txn.type === 'Income' ? '#34d399' : '#fb7185', whiteSpace: 'nowrap' }}>
                        {txn.type === 'Income' ? '+' : '-'} {formatINR(txn.amount)}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {txn.program_name || 'General Operations'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div>{txn.date}</div>
                        <div>via {txn.payment_method}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {txn.source_vendor || '—'}
                      </td>
                      <td>
                        {txn.receipt_url ? (
                          <a href={txn.receipt_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                            Receipt
                          </a>
                        ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>None</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => handleOpenEditModal(txn)} title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button className="btn-icon" onClick={() => setDeleteCandidate(txn)} title="Delete">
                            <Trash2 size={13} style={{ color: '#fb7185' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                <IndianRupee size={20} color="var(--primary-light)" />
                {editingTxn
                  ? `Edit Transaction: ${editingTxn.transaction_code}`
                  : formData.type === 'Income'
                    ? '+ INSERT / ADD: Record Money Collected (Inflow)'
                    : '+ INSERT / ADD: Record Money Spent (Outflow)'}
              </h3>
              <button className="btn-icon" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          type: newType,
                          category: newType === 'Income' ? 'Registration' : 'Food'
                        });
                      }}
                    >
                      <option value="Income">Income (Money Collected)</option>
                      <option value="Expense">Expense (Money Spent)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (₹ INR) *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      required
                      placeholder="e.g. 5000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {formData.type === 'Income' ? 'Collection Category *' : 'Expense Category *'}
                    </label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, category: val });
                        if (val !== 'Other') setCustomCategory('');
                      }}
                    >
                      {formData.type === 'Income' ? (
                        <>
                          <option value="Registration">Registration</option>
                          <option value="Sponsorship">Sponsorship</option>
                          <option value="Donations">Donations</option>
                          <option value="Club contribution">Club contribution</option>
                          <option value="Other">+ Custom Category / Other...</option>
                        </>
                      ) : (
                        <>
                          <option value="Food">Food & Refreshments</option>
                          <option value="Printing">Printing & Flex Banners</option>
                          <option value="Certificates">Certificates & Mementos</option>
                          <option value="Decoration">Decoration & Stage Setup</option>
                          <option value="Transportation">Transportation & Travel</option>
                          <option value="Equipment">Equipment & Audio/Visual</option>
                          <option value="Marketing">Marketing & Promotion</option>
                          <option value="Venue">Venue & Stall Booking</option>
                          <option value="Refreshments">Refreshments & Catering</option>
                          <option value="Prize Pool">Prize Pool & Cash Awards</option>
                          <option value="Honorarium">Guest Honorarium & Hospitality</option>
                          <option value="Other">+ Custom Category / Other...</option>
                        </>
                      )}
                    </select>
                  </div>

                  {formData.category === 'Other' && (
                    <div className="form-group form-full" style={{ background: 'rgba(56, 189, 248, 0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                      <label className="form-label" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        Enter Custom Category / Purpose *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Prize Money, Guest Accommodation, Hardware Kits, Stage Lights..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        style={{ fontSize: '0.88rem' }}
                      />
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '4px', margin: 0 }}>
                        This custom category will immediately appear on the Expenses Pie Chart & Bar Graph with its exact amount spent.
                      </p>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Linked Program</label>
                    <select
                      className="form-select"
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    >
                      <option value="">General Club Operations (No Program)</option>
                      {(allPrograms || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transaction Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {formData.type === 'Income' ? 'Collection Method' : 'Payment Method'}
                    </label>
                    <select
                      className="form-select"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online Gateway</option>
                    </select>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">
                      {formData.type === 'Income' ? 'Source / Collected From' : 'Vendor / Person Paid'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={formData.type === 'Income' ? 'e.g. Tech Sponsor, Student Participant, Donor...' : 'e.g. GreenPrint Press, Campus Canteen...'}
                      value={formData.source_vendor}
                      onChange={(e) => setFormData({ ...formData, source_vendor: e.target.value })}
                    />
                  </div>

                  {formData.type === 'Expense' && (
                    <div className="form-group form-full">
                      <label className="form-label">Receipt / Invoice File (optional)</label>
                      <input
                        type="file"
                        className="form-input"
                        onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                      />
                    </div>
                  )}

                  <div className="form-group form-full">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Purpose or line-item breakdown..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Notes / Internal Remarks</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Additional audit notes or internal record notes..."
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTxn ? 'OK / Save Changes' : 'OK / Submit Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Records Modal (Selective Deletion with Checkboxes) */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card delete-records-modal-card">
            <div className="modal-header">
              <h3 style={{ color: deleteModalType === 'Income' ? '#34d399' : '#fb7185' }}>
                <Trash2 size={20} />
                Delete {deleteModalType === 'Income' ? 'Money Collected / Inflow' : 'Money Spent / Outflow'} Records
              </h3>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Select individual {deleteModalType.toLowerCase()} records from the persistent database to delete.
                The <strong>{deleteModalType === 'Income' ? 'Total Money Collected' : 'Total Money Spent'}</strong>,{' '}
                <strong>STIC Net Balance</strong>, and all charts will recalculate automatically after deletion.
              </p>

              {/* Filter and Select All Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', gap: '10px' }}>
                <div className="filter-search-box" style={{ flex: 1, minWidth: '180px' }}>
                  <Search size={14} className="search-icon-pos" />
                  <input
                    type="text"
                    placeholder={`Search ${deleteModalType.toLowerCase()} records by code, vendor, category...`}
                    value={deleteSearchQuery}
                    onChange={(e) => setDeleteSearchQuery(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 10px 6px 30px' }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleToggleSelectAll}
                  style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Records Checkbox List */}
              <div className="delete-records-list">
                {displayedDeleteRecords.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    No {deleteModalType.toLowerCase()} records found.
                  </div>
                ) : (
                  displayedDeleteRecords.map((txn) => {
                    const isChecked = selectedDeleteIds.includes(txn.id);
                    return (
                      <div
                        key={txn.id}
                        className={`delete-record-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleToggleDeleteId(txn.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDeleteId(txn.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', accentColor: '#fb7185', width: '16px', height: '16px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{txn.category}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem' }}>
                              {txn.transaction_code}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>• {txn.date}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {txn.source_vendor ? <span><strong>{txn.source_vendor}</strong> · </span> : null}
                            {txn.description || 'No description'}
                            {txn.program_name ? <span style={{ color: 'var(--primary-light)', marginLeft: '6px' }}>({txn.program_name})</span> : null}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: deleteModalType === 'Income' ? '#34d399' : '#fb7185', whiteSpace: 'nowrap' }}>
                            {deleteModalType === 'Income' ? '+' : '-'} {formatINR(txn.amount)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            via {txn.payment_method}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Summary Bar */}
              <div style={{
                 display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.84rem'
              }}>
                <div>
                  Selected: <strong style={{ color: 'var(--text-main)' }}>{selectedDeleteIds.length}</strong> record(s)
                </div>
                <div>
                  Total to Deduct:{' '}
                  <strong style={{ color: deleteModalType === 'Income' ? '#34d399' : '#fb7185', fontSize: '0.95rem' }}>
                    {formatINR(totalSelectedDeleteAmount)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={selectedDeleteIds.length === 0}
                onClick={handleExecuteBatchDelete}
              >
                <Trash2 size={15} /> OK / Delete Selected ({selectedDeleteIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Net Balance Calculation Modal */}
      {isCalcModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-cyan)' }}>
                <Calculator size={20} /> STIC Net Balance Calculation
              </h3>
              <button className="btn-icon" onClick={() => setIsCalcModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '18px',
                fontFamily: 'Inter, sans-serif'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>1. Total Money Collected (Active Inflows)</span>
                  <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1.05rem' }}>
                    + {formatINR(overview?.allTime?.totalIncome)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '2px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>2. Total Money Spent (Active Outflows)</span>
                  <span style={{ fontWeight: 800, color: '#fb7185', fontSize: '1.05rem' }}>
                    - {formatINR(overview?.allTime?.totalExpense)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>STIC NET BALANCE</span>
                  <span style={{
                    fontWeight: 900,
                    fontSize: '1.35rem',
                    color: (overview?.allTime?.netBalance || 0) >= 0 ? '#34d399' : '#fb7185'
                  }}>
                    = {formatINR(overview?.allTime?.netBalance)}
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                  <Info size={15} /> Database Guarantee
                </div>
                The Net Balance is strictly computed by the database engine as <code>SUM(Income) - SUM(Expense)</code> across all persistent transactions. It cannot be manually altered or forged.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setIsCalcModalOpen(false)}>
                OK / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Net Balance Reset / Manage Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#f59e0b' }}>
                <AlertTriangle size={20} /> Manage / Reset Financial Summary
              </h3>
              <button className="btn-icon" onClick={() => { setIsResetModalOpen(false); setShowAdvancedWipe(false); setWipeConfirmationText(''); }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Protection Explanatory Box */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                color: '#fbbf24',
                marginBottom: '18px'
              }}>
                <strong>Safety Protection Notice:</strong>
                <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                  The STIC Net Balance is an active mathematical formula: <code>Total Collected - Total Spent</code>.
                  Resetting or managing this section will <strong>NOT</strong> delete your underlying income/expense records unless explicitly chosen below.
                </p>
              </div>

              {/* Two Clear Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Option 1: Safe Reset/Refresh */}
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.92rem' }}>
                      Option 1: Delete/Reset Summary Display (Safe)
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>RECOMMENDED</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Safely resets all active filters and forces an immediate real-time recalculation of the summary cards, bar graph, and pie chart directly from the persistent database without touching any financial records.
                  </p>
                  <div style={{ marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleRefreshSummaryDisplay}
                    >
                      <RefreshCw size={14} /> Reset / Refresh Summary Display
                    </button>
                  </div>
                </div>

                {/* Option 2: Delete Financial Records */}
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#fb7185', fontSize: '0.92rem' }}>
                      Option 2: Delete Financial Records
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>DESTRUCTIVE</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Choose specific collection or expense records to remove from the database, or proceed to audited club reset.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setIsResetModalOpen(false);
                        handleOpenDeleteRecordsModal('Income');
                      }}
                    >
                      <Trash2 size={13} /> Select Incomes to Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setIsResetModalOpen(false);
                        handleOpenDeleteRecordsModal('Expense');
                      }}
                    >
                      <Trash2 size={13} /> Select Expenses to Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setShowAdvancedWipe(!showAdvancedWipe)}
                    >
                      {showAdvancedWipe ? 'Hide Wipe Option' : 'Audit Reset All Records...'}
                    </button>
                  </div>

                  {showAdvancedWipe && (
                    <div style={{
                      marginTop: '10px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.3)'
                    }}>
                      <div style={{ color: '#fb7185', fontWeight: 600, fontSize: '0.78rem', marginBottom: '6px' }}>
                        Type "CONFIRM RESET" to permanently purge all financial transactions:
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="CONFIRM RESET"
                          value={wipeConfirmationText}
                          onChange={(e) => setWipeConfirmationText(e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={wipeConfirmationText !== 'CONFIRM RESET'}
                          onClick={handleExecuteWipeRecords}
                        >
                          Wipe Records
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsResetModalOpen(false); setShowAdvancedWipe(false); setWipeConfirmationText(''); }}
              >
                OK / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#fb7185' }}>Delete Transaction</h3>
              <button className="btn-icon" onClick={() => setDeleteCandidate(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Delete transaction <strong>{deleteCandidate.transaction_code}</strong> ({deleteCandidate.type} of {formatINR(deleteCandidate.amount)})?
                Club and program balances will be recalculated immediately.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>OK / Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                <Filter size={18} color="var(--primary-light)" />
                Expense Category Manager
              </h3>
              <button className="btn-icon" onClick={() => setIsCategoryManagerOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCustomCategory}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Create New Expense Category *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Prize Pool, Guest Hospitality, Badges..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Active Expense Categories ({allCategoriesList.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {allCategoriesList.map((cat) => (
                      <span key={cat} className="badge badge-neutral" style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {cat}
                        {userCategories.includes(cat) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomCategory(cat)}
                            style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: 0 }}
                            title="Remove Category"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryManagerOpen(false)}>
                  OK / Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Program Financial Summary Modal */}
      {isAddProgramModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProgramModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                <Plus size={18} color="var(--primary-light)" />
                Add Program Financial Summary
              </h3>
              <button type="button" className="btn-icon" onClick={() => setIsAddProgramModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateProgramSummary}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Program Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. STIC Annual Tech Symposium 2026"
                    value={progFormData.name}
                    onChange={(e) => setProgFormData({ ...progFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Program Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={progFormData.program_date}
                      onChange={(e) => setProgFormData({ ...progFormData, program_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Type</label>
                    <select
                      className="form-select"
                      value={progFormData.program_type}
                      onChange={(e) => setProgFormData({ ...progFormData, program_type: e.target.value })}
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Technical Expo">Technical Expo</option>
                      <option value="Guest Lecture">Guest Lecture</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Campus Auditorium / Seminar Hall A"
                    value={progFormData.venue}
                    onChange={(e) => setProgFormData({ ...progFormData, venue: e.target.value })}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Money Collected (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={progFormData.initial_income}
                      onChange={(e) => setProgFormData({ ...progFormData, initial_income: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Money Spent (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={progFormData.initial_expense}
                      onChange={(e) => setProgFormData({ ...progFormData, initial_expense: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddProgramModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={15} /> Save Program Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
