const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, clearDemoData, seedInitialDemoData } = require('../db');
const { requireAuth, checkPermission } = require('../auth');
const { logActivity } = require('../activity');
const { upload } = require('../upload');

// GET /api/settings (get all club settings)
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM club_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    // Count demo records
    const demoMembers = db.prepare('SELECT COUNT(*) as count FROM club_members WHERE is_demo = 1').get().count;
    const demoPrograms = db.prepare('SELECT COUNT(*) as count FROM programs WHERE is_demo = 1').get().count;
    const demoTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE is_demo = 1').get().count;
    const demoPhotos = db.prepare('SELECT COUNT(*) as count FROM photos WHERE is_demo = 1').get().count;
    const demoSponsors = db.prepare('SELECT COUNT(*) as count FROM sponsors WHERE is_demo = 1').get().count;

    const totalDemoCount = demoMembers + demoPrograms + demoTransactions + demoPhotos + demoSponsors;

    return res.json({
      success: true,
      data: {
        settings,
        demo_stats: {
          has_demo_data: totalDemoCount > 0,
          total_demo_records: totalDemoCount,
          members: demoMembers,
          programs: demoPrograms,
          transactions: demoTransactions,
          photos: demoPhotos,
          sponsors: demoSponsors
        }
      }
    });
  } catch (err) {
    console.error('[SETTINGS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings (update club settings)
router.put('/', requireAuth, upload.single('club_logo'), (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.prepare(`
      INSERT INTO club_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    if (req.file) {
      updateStmt.run('club_logo_url', `/uploads/posters/${req.file.filename}`);
    }

    const allowedKeys = [
      'club_name', 'club_full_name', 'club_tagline', 'club_description',
      'college_name', 'club_email', 'club_phone', 'club_address',
      'academic_year', 'club_logo_url', 'gallery_dp_url', 'video_dp_url'
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        updateStmt.run(key, updates[key]);
      }
    }

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Updated',
      change: 'Updated club profile, contact information, and institutional branding',
      new_value: updates
    });

    const rows = db.prepare('SELECT key, value FROM club_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    return res.json({
      success: true,
      message: 'Club settings updated successfully.',
      data: settings
    });
  } catch (err) {
    console.error('[SETTINGS UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

// GET /api/settings/permissions (retrieve STIC Website Handler configurable permissions)
router.get('/permissions', requireAuth, (req, res) => {
  try {
    const { getRolePermissions, PERMISSION_DEFINITIONS } = require('../auth');
    const permissions = getRolePermissions('STIC Website Handler', db);
    return res.json({
      success: true,
      data: {
        role: 'STIC Website Handler',
        permissions,
        definitions: PERMISSION_DEFINITIONS
      }
    });
  } catch (err) {
    console.error('[PERMISSIONS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
  }
});

// PUT /api/settings/permissions (update STIC Website Handler configurable permissions)
router.put('/permissions', requireAuth, (req, res) => {
  try {
    // Only leadership / representative accounts can update permissions
    if (req.user.role === 'STIC Website Handler') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. The STIC Website Handler cannot alter their own permission set. Only Club Leadership can configure website handler permissions.'
      });
    }

    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid permissions payload.' });
    }

    const { DEFAULT_HANDLER_PERMISSIONS, PERMISSION_DEFINITIONS } = require('../auth');
    const cleanPermissions = { ...DEFAULT_HANDLER_PERMISSIONS };

    PERMISSION_DEFINITIONS.forEach(def => {
      if (permissions[def.key] !== undefined) {
        cleanPermissions[def.key] = Boolean(permissions[def.key]);
      }
    });

    db.prepare(`
      INSERT INTO role_permissions (role, permissions_json, updated_at)
      VALUES ('STIC Website Handler', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(role) DO UPDATE SET permissions_json = excluded.permissions_json, updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(cleanPermissions));

    logActivity(req, {
      department: 'Website Handler Permissions',
      action: 'Updated',
      change: 'Updated configurable permissions matrix for STIC Website Handler',
      new_value: cleanPermissions
    });

    return res.json({
      success: true,
      message: 'STIC Website Handler permissions updated successfully.',
      data: {
        role: 'STIC Website Handler',
        permissions: cleanPermissions
      }
    });
  } catch (err) {
    console.error('[PERMISSIONS UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update permissions.' });
  }
});

// POST /api/settings/gallery-dp
router.post('/gallery-dp', requireAuth, upload.single('dp'), (req, res) => {
  try {
    let dpUrl = req.body.dp_url || null;
    if (req.file) {
      dpUrl = `/uploads/photos/${req.file.filename}`;
    }
    if (!dpUrl) {
      return res.status(400).json({ success: false, message: 'Please select or upload an image file.' });
    }

    db.prepare(`
      INSERT INTO club_settings (key, value, updated_at)
      VALUES ('gallery_dp_url', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(dpUrl);

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Updated',
      change: 'Updated Gallery Display Photo',
      new_value: { gallery_dp_url: dpUrl }
    });

    return res.json({ success: true, message: 'Gallery DP updated successfully.', gallery_dp_url: dpUrl });
  } catch (err) {
    console.error('[GALLERY DP UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update Gallery DP.' });
  }
});

// DELETE /api/settings/gallery-dp
router.delete('/gallery-dp', requireAuth, (req, res) => {
  try {
    db.prepare("DELETE FROM club_settings WHERE key = 'gallery_dp_url'").run();

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Deleted',
      change: 'Removed Gallery Display Photo'
    });

    return res.json({ success: true, message: 'Gallery DP removed successfully.' });
  } catch (err) {
    console.error('[GALLERY DP DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove Gallery DP.' });
  }
});

// POST /api/settings/video-dp
router.post('/video-dp', requireAuth, upload.single('dp'), (req, res) => {
  try {
    let dpUrl = req.body.dp_url || null;
    if (req.file) {
      dpUrl = `/uploads/photos/${req.file.filename}`;
    }
    if (!dpUrl) {
      return res.status(400).json({ success: false, message: 'Please select or upload an image file.' });
    }

    db.prepare(`
      INSERT INTO club_settings (key, value, updated_at)
      VALUES ('video_dp_url', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(dpUrl);

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Updated',
      change: 'Updated Video Archive Display Photo',
      new_value: { video_dp_url: dpUrl }
    });

    return res.json({ success: true, message: 'Video Archive DP updated successfully.', video_dp_url: dpUrl });
  } catch (err) {
    console.error('[VIDEO DP UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update Video Archive DP.' });
  }
});

// DELETE /api/settings/video-dp
router.delete('/video-dp', requireAuth, (req, res) => {
  try {
    db.prepare("DELETE FROM club_settings WHERE key = 'video_dp_url'").run();

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Deleted',
      change: 'Removed Video Archive Display Photo'
    });

    return res.json({ success: true, message: 'Video Archive DP removed successfully.' });
  } catch (err) {
    console.error('[VIDEO DP DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove Video Archive DP.' });
  }
});

// POST /api/settings/clear-demo-data (delete all sample/demo records)
router.post('/clear-demo-data', requireAuth, checkPermission('manage_system_security'), (req, res) => {
  try {
    const deletedCounts = clearDemoData();

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Deleted',
      change: `Cleared sample and demo data across all modules (${Object.values(deletedCounts).reduce((a, b) => a + b, 0)} records removed)`,
      previous_value: deletedCounts
    });

    return res.json({
      success: true,
      message: 'All demo records have been deleted successfully. The system now contains only genuine records.',
      deleted_counts: deletedCounts
    });
  } catch (err) {
    console.error('[CLEAR DEMO DATA ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to clear demo data.' });
  }
});

// POST /api/settings/reset-demo-data (re-seed demo records)
router.post('/reset-demo-data', requireAuth, checkPermission('manage_system_security'), (req, res) => {
  try {
    seedInitialDemoData();

    logActivity(req, {
      department: 'Settings & Security',
      action: 'Created',
      change: 'Restored initial sample and demo records for testing'
    });

    return res.json({
      success: true,
      message: 'Sample demo data has been restored for testing purposes.'
    });
  } catch (err) {
    console.error('[RESET DEMO DATA ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
});

// GET /api/settings/backup (download full JSON backup of the system)
router.get('/backup', requireAuth, checkPermission('manage_system_security'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, full_name, email, role, created_at FROM users').all();
    const departments = db.prepare('SELECT * FROM departments').all();
    const members = db.prepare('SELECT * FROM club_members').all();
    const programs = db.prepare('SELECT * FROM programs').all();
    const coordinators = db.prepare('SELECT * FROM program_coordinators').all();
    const photos = db.prepare('SELECT * FROM photos').all();
    const videos = db.prepare('SELECT * FROM videos').all();
    const documents = db.prepare('SELECT * FROM documents').all();
    const transactions = db.prepare('SELECT * FROM transactions').all();
    const sponsors = db.prepare('SELECT * FROM sponsors').all();
    const social = db.prepare('SELECT * FROM social_media_posts').all();
    const settings = db.prepare('SELECT * FROM club_settings').all();
    const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500').all();

    const backupData = {
      app: 'STIC – Innovate. Sustain. Impact.',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      exported_by: req.user.username,
      database: {
        users,
        departments,
        members,
        programs,
        coordinators,
        photos,
        videos,
        documents,
        transactions,
        sponsors,
        social,
        settings,
        auditLogs
      }
    };

    logAudit(req.user.id, 'BACKUP_EXPORT', 'system', 'json', 'Generated full JSON system backup');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=STIC_Backup_${Date.now()}.json`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('[BACKUP ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate backup.' });
  }
});

module.exports = router;
