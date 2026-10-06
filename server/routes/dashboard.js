const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

router.get('/stats', requireAuth, (req, res) => {
  try {
    // Total members
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM club_members').get().count;
    const activeMembers = db.prepare("SELECT COUNT(*) as count FROM club_members WHERE status = 'Active'").get().count;

    // Total departments
    const totalDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;

    // Total programs & by status
    const totalPrograms = db.prepare('SELECT COUNT(*) as count FROM programs').get().count;
    const upcomingPrograms = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'Upcoming'").get().count;
    const completedPrograms = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'Completed'").get().count;
    const ongoingPrograms = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'Ongoing'").get().count;
    const plannedPrograms = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'Planned'").get().count;

    // Finance calculations
    const incomeRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Income'").get();
    const expenseRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'Expense'").get();
    const totalCollected = incomeRow.total;
    const totalSpent = expenseRow.total;
    const currentBalance = totalCollected - totalSpent;

    // Total sponsors
    const totalSponsorsCount = db.prepare('SELECT COUNT(*) as count FROM sponsors').get().count;
    const totalSponsorshipSum = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sponsors').get().total;

    // Programs this month and this year
    const currentYear = new Date().getFullYear();
    const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const yearPrefix = `${currentYear}%`;
    const monthPrefix = `${currentYear}-${currentMonthStr}%`;

    const programsThisYear = db.prepare("SELECT COUNT(*) as count FROM programs WHERE program_date LIKE ?").get(yearPrefix).count;
    const programsThisMonth = db.prepare("SELECT COUNT(*) as count FROM programs WHERE program_date LIKE ?").get(monthPrefix).count;

    // Monthly program counts for current year (Jan to Dec)
    const monthlyPrograms = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 1; m <= 12; m++) {
      const mStr = `${currentYear}-${String(m).padStart(2, '0')}%`;
      const count = db.prepare("SELECT COUNT(*) as count FROM programs WHERE program_date LIKE ?").get(mStr).count;
      monthlyPrograms.push({
        month: monthNames[m - 1],
        monthNum: m,
        count: count
      });
    }

    // Members by department with Lead name
    const deptStats = db.prepare(`
      SELECT 
        d.id,
        d.name,
        d.icon,
        d.description,
        m.full_name as lead_name,
        m.email as lead_email,
        (SELECT COUNT(*) FROM club_members cm WHERE cm.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      ORDER BY d.id ASC
    `).all();

    // Recent programs (latest 5)
    const recentPrograms = db.prepare(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM photos WHERE program_id = p.id) as photo_count,
        (SELECT COUNT(*) FROM documents WHERE program_id = p.id) as doc_count,
        (SELECT COUNT(*) FROM program_coordinators WHERE program_id = p.id) as coordinator_count,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Income') as income,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Expense') as expense
      FROM programs p
      ORDER BY p.program_date DESC, p.id DESC
      LIMIT 5
    `).all().map(p => ({
      ...p,
      balance: p.income - p.expense
    }));

    // Recent financial transactions (latest 5)
    const recentTransactions = db.prepare(`
      SELECT t.*, p.name as program_name 
      FROM transactions t
      LEFT JOIN programs p ON t.program_id = p.id
      ORDER BY t.date DESC, t.id DESC
      LIMIT 5
    `).all();

    // Recent system audit logs / activity
    const recentActivities = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    // Club general settings
    const settingsRows = db.prepare('SELECT key, value FROM club_settings').all();
    const clubSettings = {};
    settingsRows.forEach(r => { clubSettings[r.key] = r.value; });

    return res.json({
      success: true,
      data: {
        summary: {
          totalMembers,
          activeMembers,
          totalDepartments,
          totalPrograms,
          upcomingPrograms,
          completedPrograms,
          ongoingPrograms,
          plannedPrograms,
          totalCollected,
          totalSpent,
          currentBalance,
          totalSponsorsCount,
          totalSponsorshipSum,
          programsThisYear,
          programsThisMonth,
          currentYear
        },
        monthlyPrograms,
        departments: deptStats,
        recentPrograms,
        recentTransactions,
        recentActivities,
        clubSettings
      }
    });
  } catch (err) {
    console.error('[DASHBOARD STATS ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
});

module.exports = router;
