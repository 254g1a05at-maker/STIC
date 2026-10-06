const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/search?q=query
router.get('/', requireAuth, (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        query: q,
        results: {
          members: [],
          programs: [],
          documents: [],
          photos: [],
          videos: [],
          transactions: [],
          sponsors: []
        },
        total_matches: 0
      });
    }

    const term = `%${q}%`;

    // 1. Members
    const members = db.prepare(`
      SELECT m.id, m.full_name, m.college_id, m.email, m.position, m.year, m.branch, d.name as department_name
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE m.full_name LIKE ? OR m.college_id LIKE ? OR m.email LIKE ? OR m.phone LIKE ? OR m.position LIKE ?
      LIMIT 10
    `).all(term, term, term, term, term);

    // 2. Programs
    const programs = db.prepare(`
      SELECT id, program_code, name, program_date, venue, program_type, status
      FROM programs
      WHERE name LIKE ? OR program_code LIKE ? OR venue LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(term, term, term, term);

    // 3. Documents
    const documents = db.prepare(`
      SELECT d.id, d.title, d.category, d.file_name, d.file_url, d.program_id, p.name as program_name
      FROM documents d
      LEFT JOIN programs p ON d.program_id = p.id
      WHERE d.title LIKE ? OR d.description LIKE ? OR d.file_name LIKE ? OR d.category LIKE ?
      LIMIT 10
    `).all(term, term, term, term);

    // 4. Photos
    const photos = db.prepare(`
      SELECT ph.id, ph.caption, ph.photo_url, ph.program_id, p.name as program_name
      FROM photos ph
      LEFT JOIN programs p ON ph.program_id = p.id
      WHERE ph.caption LIKE ?
      LIMIT 10
    `).all(term);

    // 5. Videos
    const videos = db.prepare(`
      SELECT v.id, v.title, v.description, v.video_url, v.video_type, v.program_id, p.name as program_name
      FROM videos v
      LEFT JOIN programs p ON v.program_id = p.id
      WHERE v.title LIKE ? OR v.description LIKE ?
      LIMIT 10
    `).all(term, term);

    // 6. Transactions
    const transactions = db.prepare(`
      SELECT t.id, t.transaction_code, t.type, t.amount, t.category, t.description, t.date, p.name as program_name
      FROM transactions t
      LEFT JOIN programs p ON t.program_id = p.id
      WHERE t.transaction_code LIKE ? OR t.description LIKE ? OR t.category LIKE ? OR t.source_vendor LIKE ?
      LIMIT 10
    `).all(term, term, term, term);

    // 7. Sponsors
    const sponsors = db.prepare(`
      SELECT s.id, s.sponsor_name, s.contact_person, s.amount, s.sponsorship_type, p.name as program_name
      FROM sponsors s
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE s.sponsor_name LIKE ? OR s.contact_person LIKE ? OR s.notes LIKE ?
      LIMIT 10
    `).all(term, term, term);

    const totalMatches = members.length + programs.length + documents.length + photos.length + videos.length + transactions.length + sponsors.length;

    return res.json({
      success: true,
      query: q,
      results: {
        members,
        programs,
        documents,
        photos,
        videos,
        transactions,
        sponsors
      },
      total_matches: totalMatches
    });
  } catch (err) {
    console.error('[SEARCH ERROR]', err);
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

module.exports = router;
