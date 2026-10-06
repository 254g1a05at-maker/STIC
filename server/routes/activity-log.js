const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/activity-log (Newest first, immutable, persistent)
router.get('/', requireAuth, (req, res) => {
  try {
    const { role, department, action, search, date, limit, offset } = req.query;
    const l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const o = Math.max(parseInt(offset, 10) || 0, 0);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (department && department !== 'all') {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (action && action !== 'all') {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    if (date) {
      whereClause += ' AND log_date = ?';
      params.push(date.trim());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause += ' AND (change_summary LIKE ? OR role LIKE ? OR department LIKE ? OR user_name LIKE ?)';
      params.push(term, term, term, term);
    }

    // Get total count matching criteria
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM activity_logs ${whereClause}`);
    const totalCount = totalStmt.get(...params).count;

    // Fetch entries: newest first
    const dataStmt = db.prepare(`
      SELECT 
        id,
        role,
        user_name,
        department,
        action,
        change_summary,
        previous_value,
        new_value,
        log_date,
        log_time,
        timestamp_ist,
        created_at
      FROM activity_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);

    const logs = dataStmt.all(...params, l, o);

    // Get distinct filter values for quick-filtering
    const departments = db.prepare('SELECT DISTINCT department FROM activity_logs WHERE department IS NOT NULL ORDER BY department ASC').all().map(r => r.department);
    const roles = db.prepare('SELECT DISTINCT role FROM activity_logs WHERE role IS NOT NULL ORDER BY role ASC').all().map(r => r.role);

    return res.json({
      success: true,
      total: totalCount,
      count: logs.length,
      limit: l,
      offset: o,
      data: logs,
      filters: {
        departments,
        roles
      }
    });
  } catch (err) {
    console.error('[ACTIVITY LOG GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activity log records.' });
  }
});

// Explicitly reject any modification attempts to ensure immutability
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: 'Activity log records are strictly immutable. Manual edits, fabrication, or deletion are prohibited.'
    });
  }
  next();
});

module.exports = router;
