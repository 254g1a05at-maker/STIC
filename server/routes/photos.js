const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');
const { upload, uploadsBase } = require('../upload');

// GET /api/photos (list photos, optional program_id filter)
router.get('/', requireAuth, (req, res) => {
  try {
    const { program_id } = req.query;
    let query = `
      SELECT p.*, pr.name as program_name, pr.program_code
      FROM photos p
      LEFT JOIN programs pr ON p.program_id = pr.id
    `;
    const params = [];

    if (program_id) {
      query += ` WHERE p.program_id = ?`;
      params.push(Number(program_id));
    }

    query += ` ORDER BY p.id DESC`;
    const photos = db.prepare(query).all(...params);
    return res.json({ success: true, count: photos.length, data: photos });
  } catch (err) {
    console.error('[PHOTOS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve photos.' });
  }
});

// POST /api/photos (upload photo or provide URL)
router.post('/', requireAuth, upload.array('photo', 10), (req, res) => {
  try {
    const { program_id, caption, photo_url } = req.body;
    const progId = program_id ? Number(program_id) : null;

    const insertedPhotos = [];
    const insertStmt = db.prepare(`
      INSERT INTO photos (program_id, caption, photo_url, file_name, uploaded_by, is_demo)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = `/uploads/photos/${file.filename}`;
        const result = insertStmt.run(
          progId,
          caption ? caption.trim() : file.originalname,
          fileUrl,
          file.originalname,
          req.user.username
        );
        insertedPhotos.push({
          id: result.lastInsertRowid,
          photo_url: fileUrl,
          caption: caption || file.originalname
        });
      }
    } else if (photo_url && photo_url.trim()) {
      // Or external photo URL
      const result = insertStmt.run(
        progId,
        caption ? caption.trim() : 'Program Photograph',
        photo_url.trim(),
        path.basename(photo_url.trim()),
        req.user.username
      );
      insertedPhotos.push({
        id: result.lastInsertRowid,
        photo_url: photo_url.trim(),
        caption: caption || 'Program Photograph'
      });
    } else {
      return res.status(400).json({ success: false, message: 'No photo file or URL provided.' });
    }

    logActivity(req, {
      department: 'Photos Gallery',
      action: 'Created',
      change: `Uploaded ${insertedPhotos.length} photo(s): ${insertedPhotos.map(p => p.caption).join(', ')}`,
      new_value: insertedPhotos
    });

    return res.status(201).json({
      success: true,
      message: `${insertedPhotos.length} photo(s) uploaded successfully.`,
      data: insertedPhotos
    });
  } catch (err) {
    console.error('[PHOTO UPLOAD ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload photo.' });
  }
});

// PUT /api/photos/:id (edit caption)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const photoId = Number(req.params.id);
    const { caption, program_id } = req.body;

    const existing = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    db.prepare(`
      UPDATE photos SET
        caption = COALESCE(?, caption),
        program_id = COALESCE(?, program_id)
      WHERE id = ?
    `).run(
      caption !== undefined ? caption : existing.caption,
      program_id !== undefined ? (program_id ? Number(program_id) : null) : existing.program_id,
      photoId
    );

    const updated = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);

    logActivity(req, {
      department: 'Photos Gallery',
      action: 'Updated',
      change: `Updated photo #${photoId} caption to "${updated.caption}"`,
      previous_value: { caption: existing.caption, program_id: existing.program_id },
      new_value: { caption: updated.caption, program_id: updated.program_id }
    });

    return res.json({ success: true, message: 'Photo updated.', data: updated });
  } catch (err) {
    console.error('[PHOTO UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update photo.' });
  }
});

// DELETE /api/photos/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const photoId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    // Try to remove local file if in /uploads/
    if (existing.photo_url && existing.photo_url.startsWith('/uploads/')) {
      const localFilePath = path.join(uploadsBase, existing.photo_url.replace('/uploads/', ''));
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) { /* ignore */ }
      }
    }

    db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);

    logActivity(req, {
      department: 'Photos Gallery',
      action: 'Deleted',
      change: `Deleted photo #${photoId} ("${existing.caption || existing.file_name}")`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    console.error('[PHOTO DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete photo.' });
  }
});

module.exports = router;
