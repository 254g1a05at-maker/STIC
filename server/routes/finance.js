const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { requireAuth, checkPermission, getRolePermissions } = require('../auth');
const { logActivity } = require('../activity');
const { upload, uploadsBase } = require('../upload');

// Enforce Finance Section Access:
// Only Finance Lead, Club Leadership/Representatives, and superadmin are authorized.
// Content and Documentation Lead, Social Media Lead, Technical Lead, and unauthorized Website Handler are strictly restricted.
function requireFinanceAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = req.user.role;
  const restrictedRoles = [
    'Content and Documentation Lead',
    'Social Media Lead',
    'Technical Lead'
  ];

  if (restrictedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: `Access Denied: The "${role}" role is restricted from accessing the Finance & Accounts section. Only the Finance Lead and Club Administration have access.`
    });
  }

  if (role === 'STIC Website Handler') {
    const permissions = getRolePermissions(role, db);
    if (!permissions.manage_finance) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: The STIC Website Handler does not have finance permissions.'
      });
    }
  }

  next();
}

router.use(requireAuth);
router.use(requireFinanceAccess);

function generateTransactionCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `TXN-${currentYear}-`;
  const lastRow = db.prepare(`
    SELECT transaction_code FROM transactions 
    WHERE transaction_code LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextNum = 1;
  if (lastRow && lastRow.transaction_code) {
    const parts = lastRow.transaction_code.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// GET /api/finance/overview (totals, category breakdown, monthly trends)
router.get('/overview', (req, res) => {
  try {
    const { year } = req.query;

    // Detect active financial year if not explicitly provided
    let selectedYear = year ? parseInt(year, 10) : null;
    if (!selectedYear || isNaN(selectedYear)) {
      const latestTxn = db.prepare(`
        SELECT strftime('%Y', date) as yr 
        FROM transactions 
        WHERE date IS NOT NULL AND date != ''
        ORDER BY date DESC LIMIT 1
      `).get();
      selectedYear = latestTxn && latestTxn.yr ? parseInt(latestTxn.yr, 10) : new Date().getFullYear();
    }
    const yearPrefix = `${selectedYear}%`;

    // 1. Overall Totals across all time directly from database
    const incomeTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Income'").get().total;
    const expenseTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Expense'").get().total;
    const netBalance = incomeTotal - expenseTotal;
    const totalTransactionsCount = db.prepare("SELECT COUNT(*) as c FROM transactions").get().c;

    // 2. Totals for selected year
    const yearIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'Income' AND (strftime('%Y', date) = CAST(? AS TEXT) OR date LIKE ?)
    `).get(selectedYear, yearPrefix).total;

    const yearExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'Expense' AND (strftime('%Y', date) = CAST(? AS TEXT) OR date LIKE ?)
    `).get(selectedYear, yearPrefix).total;
    const yearBalance = yearIncome - yearExpense;

    // 3. Expenses by Category (HAVING total > 0 so zero-total or deleted categories disappear automatically)
    const expensesByCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'Expense'
      GROUP BY category
      HAVING total > 0
      ORDER BY total DESC
    `).all();

    // 4. Incomes by Category
    const incomesByCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'Income'
      GROUP BY category
      HAVING total > 0
      ORDER BY total DESC
    `).all();

    // 5. Incomes & Expenses by Program + Central Treasury
    const financeByProgram = db.prepare(`
      SELECT 
        p.id,
        p.program_code,
        p.name as program_name,
        p.program_date,
        p.status,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Income') as income,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Expense') as expense
      FROM programs p
      ORDER BY p.program_date DESC
    `).all().map(p => ({
      ...p,
      balance: p.income - p.expense
    }));

    // Check if any general club transactions exist without program_id
    const generalIncome = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE program_id IS NULL AND type = 'Income'").get().total;
    const generalExpense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE program_id IS NULL AND type = 'Expense'").get().total;

    if (generalIncome > 0 || generalExpense > 0) {
      financeByProgram.unshift({
        id: null,
        program_code: 'STIC-CENTRAL',
        name: 'Central Club Accounts (General Fund)',
        program_name: 'Central Club Accounts (General Fund)',
        program_date: 'General',
        status: 'Active',
        income: generalIncome,
        expense: generalExpense,
        balance: generalIncome - generalExpense
      });
    }

    // 6. Monthly Trends for selected year using SQLite month grouping
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];

    const monthlyRows = db.prepare(`
      SELECT 
        CAST(strftime('%m', date) AS INTEGER) as m_num,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE (strftime('%Y', date) = CAST(? AS TEXT) OR date LIKE ?)
      GROUP BY m_num
    `).all(selectedYear, yearPrefix);

    const monthMap = {};
    for (const r of monthlyRows) {
      if (r.m_num >= 1 && r.m_num <= 12) {
        monthMap[r.m_num] = {
          income: Number(r.income || 0),
          expense: Number(r.expense || 0)
        };
      }
    }

    for (let m = 1; m <= 12; m++) {
      const data = monthMap[m] || { income: 0, expense: 0 };
      monthlyTrends.push({
        month: months[m - 1],
        monthNum: m,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense
      });
    }

    // 7. Available years for dropdown switcher
    const yearRows = db.prepare(`
      SELECT DISTINCT strftime('%Y', date) as yr 
      FROM transactions 
      WHERE date IS NOT NULL AND date != ''
      ORDER BY yr DESC
    `).all();
    const availableYears = yearRows.map(r => parseInt(r.yr, 10)).filter(y => !isNaN(y));
    if (!availableYears.includes(selectedYear)) {
      availableYears.unshift(selectedYear);
    }

    return res.json({
      success: true,
      data: {
        allTime: {
          totalIncome: incomeTotal,
          totalExpense: expenseTotal,
          netBalance: netBalance,
          totalCount: totalTransactionsCount
        },
        selectedYear: {
          year: selectedYear,
          income: yearIncome,
          expense: yearExpense,
          balance: yearBalance
        },
        availableYears,
        expensesByCategory,
        incomesByCategory,
        financeByProgram,
        monthlyTrends
      }
    });
  } catch (err) {
    console.error('[FINANCE OVERVIEW ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve finance overview.' });
  }
});

// GET /api/finance/transactions (list transactions with full filtering)
router.get('/transactions', requireAuth, (req, res) => {
  try {
    const { type, category, program_id, payment_method, search, date_from, date_to } = req.query;

    let query = `
      SELECT t.*, p.name as program_name, p.program_code
      FROM transactions t
      LEFT JOIN programs p ON t.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (program_id) {
      if (program_id === 'general') {
        query += ` AND t.program_id IS NULL`;
      } else {
        query += ` AND t.program_id = ?`;
        params.push(Number(program_id));
      }
    }

    if (payment_method) {
      query += ` AND t.payment_method = ?`;
      params.push(payment_method);
    }

    if (date_from) {
      query += ` AND t.date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND t.date <= ?`;
      params.push(date_to);
    }

    if (search && search.trim()) {
      query += ` AND (t.transaction_code LIKE ? OR t.description LIKE ? OR t.source_vendor LIKE ? OR t.category LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY t.date DESC, t.id DESC`;

    const txns = db.prepare(query).all(...params);
    return res.json({ success: true, count: txns.length, data: txns });
  } catch (err) {
    console.error('[TRANSACTIONS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
  }
});

// POST /api/finance/transactions (create transaction with receipt)
router.post('/transactions', requireAuth, checkPermission('manage_finance'), upload.single('receipt'), (req, res) => {
  try {
    const {
      transaction_code,
      program_id,
      type,
      amount,
      category,
      description,
      date,
      payment_method,
      source_vendor,
      notes,
      receipt_url
    } = req.body;

    if (!type || amount === undefined || amount === null || amount === '' || !category || !date) {
      return res.status(400).json({ success: false, message: 'Type, amount, category, and date are required.' });
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative.' });
    }

    const code = (transaction_code && transaction_code.trim()) ? transaction_code.trim() : generateTransactionCode();

    let receipt = receipt_url || null;
    if (req.file) {
      receipt = `/uploads/receipts/${req.file.filename}`;
    }

    const progId = program_id ? Number(program_id) : null;

    const result = db.prepare(`
      INSERT INTO transactions (
        transaction_code, program_id, type, amount, category, 
        description, date, payment_method, source_vendor, receipt_url, 
        notes, added_by, is_demo, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      code,
      progId,
      type,
      amt,
      category,
      description ? description.trim() : null,
      date,
      payment_method || 'UPI',
      source_vendor ? source_vendor.trim() : null,
      receipt,
      notes ? notes.trim() : null,
      req.user.username,
      req.user.username,
      req.user.username
    );

    const txnId = result.lastInsertRowid;
    const created = db.prepare(`
      SELECT t.*, p.name as program_name 
      FROM transactions t 
      LEFT JOIN programs p ON t.program_id = p.id 
      WHERE t.id = ?
    `).get(txnId);

    logActivity(req, {
      department: 'Finance & Accounts',
      action: 'Created',
      change: `Recorded ${type} transaction ${code}: ₹${amt.toLocaleString('en-IN')} for "${category}"${description ? ` (${description})` : ''}`,
      new_value: {
        code,
        type,
        amount: amt,
        category,
        date,
        payment_method,
        source_vendor,
        description
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully.',
      data: created
    });
  } catch (err) {
    console.error('[TRANSACTION CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to record transaction.' });
  }
});

// PUT /api/finance/transactions/:id (edit transaction)
router.put('/transactions/:id', requireAuth, checkPermission('manage_finance'), upload.single('receipt'), (req, res) => {
  try {
    const txnId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txnId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const {
      program_id,
      type,
      amount,
      category,
      description,
      date,
      payment_method,
      source_vendor,
      notes,
      receipt_url
    } = req.body;

    let receipt = existing.receipt_url;
    if (req.file) {
      receipt = `/uploads/receipts/${req.file.filename}`;
    } else if (receipt_url !== undefined) {
      receipt = receipt_url;
    }

    const amt = amount !== undefined ? parseFloat(amount) : existing.amount;
    const progId = program_id !== undefined ? (program_id ? Number(program_id) : null) : existing.program_id;

    db.prepare(`
      UPDATE transactions SET
        program_id = ?,
        type = COALESCE(?, type),
        amount = ?,
        category = COALESCE(?, category),
        description = ?,
        date = COALESCE(?, date),
        payment_method = COALESCE(?, payment_method),
        source_vendor = ?,
        notes = ?,
        receipt_url = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      progId,
      type || null,
      amt,
      category || null,
      description !== undefined ? description : existing.description,
      date || null,
      payment_method || null,
      source_vendor !== undefined ? source_vendor : existing.source_vendor,
      notes !== undefined ? notes : existing.notes,
      receipt,
      req.user.username,
      txnId
    );

    const updated = db.prepare(`
      SELECT t.*, p.name as program_name 
      FROM transactions t 
      LEFT JOIN programs p ON t.program_id = p.id 
      WHERE t.id = ?
    `).get(txnId);

    logActivity(req, {
      department: 'Finance & Accounts',
      action: 'Updated',
      change: `Updated transaction ${updated.transaction_code} (${updated.type} · ${updated.category})`,
      previous_value: {
        transaction_code: existing.transaction_code,
        type: existing.type,
        amount: existing.amount,
        category: existing.category,
        date: existing.date,
        payment_method: existing.payment_method,
        source_vendor: existing.source_vendor,
        description: existing.description
      },
      new_value: {
        transaction_code: updated.transaction_code,
        type: updated.type,
        amount: updated.amount,
        category: updated.category,
        date: updated.date,
        payment_method: updated.payment_method,
        source_vendor: updated.source_vendor,
        description: updated.description
      }
    });

    return res.json({
      success: true,
      message: 'Transaction updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[TRANSACTION UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update transaction.' });
  }
});

// POST /api/finance/transactions/batch-delete (delete multiple selected records)
router.post('/transactions/batch-delete', requireAuth, checkPermission('manage_finance'), (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of transaction IDs to delete.' });
    }

    const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    if (numericIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid transaction IDs provided.' });
    }

    const deleteStmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    const getInfoStmt = db.prepare('SELECT transaction_code, amount, type FROM transactions WHERE id = ?');

    let deletedCount = 0;
    let totalAmount = 0;

    const executeBatch = db.transaction((idList) => {
      for (const id of idList) {
        const row = getInfoStmt.get(id);
        if (row) {
          deleteStmt.run(id);
          deletedCount++;
          totalAmount += Number(row.amount || 0);
        }
      }
    });

    executeBatch(numericIds);

    logActivity(req, {
      department: 'Finance & Accounts',
      action: 'Deleted',
      change: `Batch deleted ${deletedCount} transaction(s) totaling ₹${totalAmount.toLocaleString('en-IN')}`,
      previous_value: { count: deletedCount, totalAmount, ids: numericIds }
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} transaction(s).`,
      deletedCount,
      totalAmount
    });
  } catch (err) {
    console.error('[BATCH DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete selected transactions.' });
  }
});

// POST /api/finance/reset-summary (safe recalculate or audited complete reset)
router.post('/reset-summary', requireAuth, (req, res) => {
  try {
    const { mode, confirmation } = req.body;

    if (mode === 'delete_all') {
      if (confirmation !== 'CONFIRM RESET') {
        return res.status(400).json({
          success: false,
          message: 'Safety protection: To wipe all financial records, you must type CONFIRM RESET exactly.'
        });
      }

      const count = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
      db.prepare('DELETE FROM transactions').run();
      logActivity(req, {
        department: 'Finance & Accounts',
        action: 'Deleted',
        change: `Purged all financial records (${count} transactions wiped)`,
        previous_value: { count }
      });

      return res.json({
        success: true,
        message: `Financial records reset successfully. Purged ${count} transaction records.`
      });
    }

    // Default mode: 'recalculate' or 'refresh'
    return res.json({
      success: true,
      message: 'Financial summary display safely refreshed and recalculated from the database.'
    });
  } catch (err) {
    console.error('[FINANCE RESET ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to manage financial summary.' });
  }
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', requireAuth, checkPermission('manage_finance'), (req, res) => {
  try {
    const txnId = Number(req.params.id);
    const existing = db.prepare('SELECT transaction_code, amount, type FROM transactions WHERE id = ?').get(txnId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(txnId);
    logActivity(req, {
      department: 'Finance & Accounts',
      action: 'Deleted',
      change: `Deleted transaction ${existing.transaction_code} (${existing.type} of ₹${existing.amount})`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('[TRANSACTION DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
});

module.exports = router;
