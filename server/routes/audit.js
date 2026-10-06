const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/audit-logs
router.get('/', requireAuth, (req, res) => {
  try {
    const { limit, offset, entity_type } = req.query;
    const l = limit ? parseInt(limit, 10) : 100;
    const o = offset ? parseInt(offset, 10) : 0;

    let query = 'SELECT * FROM audit_logs';
    const params = [];

    if (entity_type) {
      query += ' WHERE entity_type = ?';
      params.push(entity_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(l, o);

    const logs = db.prepare(query).all(...params);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    return res.json({
      success: true,
      total: totalCount,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    console.error('[AUDIT GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;
