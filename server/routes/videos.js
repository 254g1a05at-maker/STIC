const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');
const { upload, uploadsBase } = require('../upload');

// GET /api/videos (list with optional program_id filter)
router.get('/', requireAuth, (req, res) => {
  try {
    const { program_id } = req.query;
    let query = `
      SELECT v.*, p.name as program_name, p.program_code
      FROM videos v
      LEFT JOIN programs p ON v.program_id = p.id
    `;
    const params = [];

    if (program_id) {
      query += ` WHERE v.program_id = ?`;
      params.push(Number(program_id));
    }

    query += ` ORDER BY v.id DESC`;
    const videos = db.prepare(query).all(...params);
    return res.json({ success: true, count: videos.length, data: videos });
  } catch (err) {
    console.error('[VIDEOS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve videos.' });
  }
});

// POST /api/videos (create video via URL or file upload)
router.post('/', requireAuth, upload.single('video'), (req, res) => {
  try {
    const { title, description, video_url, program_id } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Video title is required.' });
    }

    let finalUrl = '';
    let videoType = 'link';

    if (req.file) {
      finalUrl = `/uploads/videos/${req.file.filename}`;
      videoType = 'file';
    } else if (video_url && video_url.trim()) {
      finalUrl = video_url.trim();
      videoType = 'link';
    } else {
      return res.status(400).json({ success: false, message: 'Please provide either a video file or a video link (YouTube, Drive, etc.).' });
    }

    const progId = program_id ? Number(program_id) : null;

    const result = db.prepare(`
      INSERT INTO videos (program_id, title, description, video_url, video_type, uploaded_by, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      progId,
      title.trim(),
      description ? description.trim() : null,
      finalUrl,
      videoType,
      req.user.username
    );

    const videoId = result.lastInsertRowid;
    const created = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);

    logActivity(req, {
      department: 'Videos Archive',
      action: 'Created',
      change: `Added video "${title}" (${videoType})`,
      new_value: {
        title,
        video_type: videoType,
        video_url: finalUrl,
        program_id: progId,
        description
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Video added successfully.',
      data: created
    });
  } catch (err) {
    console.error('[VIDEO CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to add video.' });
  }
});

// PUT /api/videos/:id (edit video details)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const videoId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    const { title, description, video_url, program_id } = req.body;

    db.prepare(`
      UPDATE videos SET
        title = COALESCE(?, title),
        description = ?,
        video_url = COALESCE(?, video_url),
        program_id = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description : existing.description,
      video_url ? video_url.trim() : null,
      program_id !== undefined ? (program_id ? Number(program_id) : null) : existing.program_id,
      videoId
    );

    const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);

    logActivity(req, {
      department: 'Videos Archive',
      action: 'Updated',
      change: `Updated video #${videoId} ("${updated.title}")`,
      previous_value: {
        title: existing.title,
        description: existing.description,
        video_url: existing.video_url,
        program_id: existing.program_id
      },
      new_value: {
        title: updated.title,
        description: updated.description,
        video_url: updated.video_url,
        program_id: updated.program_id
      }
    });

    return res.json({ success: true, message: 'Video updated successfully.', data: updated });
  } catch (err) {
    console.error('[VIDEO UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update video.' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const videoId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    if (existing.video_url && existing.video_url.startsWith('/uploads/')) {
      const localFilePath = path.join(uploadsBase, existing.video_url.replace('/uploads/', ''));
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) { /* ignore */ }
      }
    }

    db.prepare('DELETE FROM videos WHERE id = ?').run(videoId);

    logActivity(req, {
      department: 'Videos Archive',
      action: 'Deleted',
      change: `Deleted video #${videoId} ("${existing.title}")`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('[VIDEO DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete video.' });
  }
});

module.exports = router;
