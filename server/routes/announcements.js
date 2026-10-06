const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, checkPermission } = require('../auth');
const { logActivity } = require('../activity');

// GET /api/announcements (list all announcements)
router.get('/', (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = 'SELECT * FROM website_announcements';
    const params = [];

    if (activeOnly === 'true') {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const announcements = db.prepare(query).all(...params);
    return res.json({ success: true, data: announcements });
  } catch (err) {
    console.error('[ANNOUNCEMENTS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve website announcements.' });
  }
});

// POST /api/announcements (create announcement)
router.post('/', requireAuth, checkPermission('manage_announcements'), (req, res) => {
  try {
    const { title, content, category, priority, link_url, link_label, display_order, is_active } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement title is required.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement content description is required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO website_announcements 
      (title, content, category, priority, link_url, link_label, display_order, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      content.trim(),
      category || 'Announcement',
      priority || 'normal',
      link_url ? link_url.trim() : null,
      link_label ? link_label.trim() : null,
      display_order !== undefined ? parseInt(display_order, 10) : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      req.user.full_name || req.user.role
    );

    const created = db.prepare('SELECT * FROM website_announcements WHERE id = ?').get(result.lastInsertRowid);
    logActivity(req, {
      department: 'Website & Announcements',
      action: 'Created',
      change: `Created announcement "${title}" (${category || 'Announcement'})`,
      new_value: created
    });

    return res.status(201).json({
      success: true,
      message: 'Website announcement published successfully.',
      data: created
    });
  } catch (err) {
    console.error('[ANNOUNCEMENT POST ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
});

// PUT /api/announcements/:id (update announcement)
router.put('/:id', requireAuth, checkPermission('manage_announcements'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, link_url, link_label, display_order, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM website_announcements WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const stmt = db.prepare(`
      UPDATE website_announcements
      SET title = ?, content = ?, category = ?, priority = ?, link_url = ?, link_label = ?, 
          display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title ? title.trim() : existing.title,
      content ? content.trim() : existing.content,
      category || existing.category,
      priority || existing.priority,
      link_url !== undefined ? (link_url ? link_url.trim() : null) : existing.link_url,
      link_label !== undefined ? (link_label ? link_label.trim() : null) : existing.link_label,
      display_order !== undefined ? parseInt(display_order, 10) : existing.display_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM website_announcements WHERE id = ?').get(id);

    logActivity(req, {
      department: 'Website & Announcements',
      action: 'Updated',
      change: `Updated announcement "${updated.title}"`,
      previous_value: existing,
      new_value: updated
    });

    return res.json({
      success: true,
      message: 'Announcement updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[ANNOUNCEMENT PUT ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update announcement.' });
  }
});

// PATCH /api/announcements/:id/toggle (toggle active status)
router.patch('/:id/toggle', requireAuth, checkPermission('manage_announcements'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, is_active, title FROM website_announcements WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const nextStatus = existing.is_active ? 0 : 1;
    db.prepare('UPDATE website_announcements SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextStatus, id);

    logActivity(req, {
      department: 'Website & Announcements',
      action: 'Updated',
      change: `Toggled announcement "${existing.title}" to ${nextStatus ? 'Active' : 'Inactive'}`,
      previous_value: { is_active: existing.is_active },
      new_value: { is_active: nextStatus }
    });

    return res.json({
      success: true,
      message: `Announcement "${existing.title}" is now ${nextStatus ? 'visible on website' : 'hidden from website'}.`,
      is_active: nextStatus
    });
  } catch (err) {
    console.error('[ANNOUNCEMENT TOGGLE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle announcement status.' });
  }
});

// DELETE /api/announcements/:id (delete announcement)
router.delete('/:id', requireAuth, checkPermission('manage_announcements'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, title FROM website_announcements WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    db.prepare('DELETE FROM website_announcements WHERE id = ?').run(id);

    logActivity(req, {
      department: 'Website & Announcements',
      action: 'Deleted',
      change: `Deleted announcement "${existing.title}"`,
      previous_value: existing
    });

    return res.json({
      success: true,
      message: `Announcement "${existing.title}" has been deleted.`
    });
  } catch (err) {
    console.error('[ANNOUNCEMENT DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
});

module.exports = router;
