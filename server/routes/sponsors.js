const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');
const { upload } = require('../upload');

// GET /api/sponsors (list all sponsors with program info & total sum)
router.get('/', requireAuth, (req, res) => {
  try {
    const { program_id, search } = req.query;

    let query = `
      SELECT s.*, p.name as program_name, p.program_code
      FROM sponsors s
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (program_id) {
      query += ` AND s.program_id = ?`;
      params.push(Number(program_id));
    }

    if (search && search.trim()) {
      query += ` AND (s.sponsor_name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.sponsorship_type LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY s.sponsorship_date DESC, s.id DESC`;

    const sponsors = db.prepare(query).all(...params);
    const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sponsors').get().total;

    return res.json({
      success: true,
      total_sponsors: sponsors.length,
      total_sponsorship_amount: totalAmount,
      data: sponsors
    });
  } catch (err) {
    console.error('[SPONSORS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sponsors.' });
  }
});

// POST /api/sponsors (create sponsor with agreement upload)
router.post('/', requireAuth, upload.single('agreement'), (req, res) => {
  try {
    const {
      sponsor_name,
      contact_person,
      phone,
      email,
      amount,
      sponsorship_date,
      program_id,
      sponsorship_type,
      notes,
      agreement_url
    } = req.body;

    if (!sponsor_name || !sponsorship_date) {
      return res.status(400).json({ success: false, message: 'Sponsor name and date are required.' });
    }

    let agreement = agreement_url || null;
    if (req.file) {
      agreement = `/uploads/documents/${req.file.filename}`;
    }

    const progId = program_id ? Number(program_id) : null;
    const amt = amount ? parseFloat(amount) : 0;

    const result = db.prepare(`
      INSERT INTO sponsors (
        program_id, sponsor_name, contact_person, phone, email, 
        amount, sponsorship_date, sponsorship_type, agreement_url, 
        notes, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      progId,
      sponsor_name.trim(),
      contact_person ? contact_person.trim() : null,
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      amt,
      sponsorship_date,
      sponsorship_type || 'Gold Sponsor',
      agreement,
      notes ? notes.trim() : null
    );

    const sponsorId = result.lastInsertRowid;
    const created = db.prepare(`
      SELECT s.*, p.name as program_name 
      FROM sponsors s 
      LEFT JOIN programs p ON s.program_id = p.id 
      WHERE s.id = ?
    `).get(sponsorId);

    logActivity(req, {
      department: 'Sponsorships',
      action: 'Created',
      change: `Added sponsor "${sponsor_name}" (₹${amt.toLocaleString('en-IN')} · ${sponsorship_type || 'Gold Sponsor'})`,
      new_value: {
        sponsor_name,
        amount: amt,
        sponsorship_type: sponsorship_type || 'Gold Sponsor',
        sponsorship_date,
        contact_person,
        email,
        phone
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Sponsor added successfully.',
      data: created
    });
  } catch (err) {
    console.error('[SPONSOR CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to add sponsor.' });
  }
});

// PUT /api/sponsors/:id (edit sponsor)
router.put('/:id', requireAuth, upload.single('agreement'), (req, res) => {
  try {
    const sponsorId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM sponsors WHERE id = ?').get(sponsorId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    }

    const {
      sponsor_name,
      contact_person,
      phone,
      email,
      amount,
      sponsorship_date,
      program_id,
      sponsorship_type,
      notes,
      agreement_url
    } = req.body;

    let agreement = existing.agreement_url;
    if (req.file) {
      agreement = `/uploads/documents/${req.file.filename}`;
    } else if (agreement_url !== undefined) {
      agreement = agreement_url;
    }

    const progId = program_id !== undefined ? (program_id ? Number(program_id) : null) : existing.program_id;
    const amt = amount !== undefined ? parseFloat(amount) : existing.amount;

    db.prepare(`
      UPDATE sponsors SET
        program_id = ?,
        sponsor_name = COALESCE(?, sponsor_name),
        contact_person = ?,
        phone = ?,
        email = ?,
        amount = ?,
        sponsorship_date = COALESCE(?, sponsorship_date),
        sponsorship_type = COALESCE(?, sponsorship_type),
        agreement_url = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      progId,
      sponsor_name ? sponsor_name.trim() : null,
      contact_person !== undefined ? contact_person : existing.contact_person,
      phone !== undefined ? phone : existing.phone,
      email !== undefined ? email : existing.email,
      amt,
      sponsorship_date || null,
      sponsorship_type || null,
      agreement,
      notes !== undefined ? notes : existing.notes,
      sponsorId
    );

    const updated = db.prepare(`
      SELECT s.*, p.name as program_name 
      FROM sponsors s 
      LEFT JOIN programs p ON s.program_id = p.id 
      WHERE s.id = ?
    `).get(sponsorId);

    logActivity(req, {
      department: 'Sponsorships',
      action: 'Updated',
      change: `Updated sponsor "${updated.sponsor_name}"`,
      previous_value: {
        sponsor_name: existing.sponsor_name,
        amount: existing.amount,
        sponsorship_type: existing.sponsorship_type,
        contact_person: existing.contact_person,
        email: existing.email,
        phone: existing.phone,
        sponsorship_date: existing.sponsorship_date
      },
      new_value: {
        sponsor_name: updated.sponsor_name,
        amount: updated.amount,
        sponsorship_type: updated.sponsorship_type,
        contact_person: updated.contact_person,
        email: updated.email,
        phone: updated.phone,
        sponsorship_date: updated.sponsorship_date
      }
    });

    return res.json({
      success: true,
      message: 'Sponsor updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[SPONSOR UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update sponsor.' });
  }
});

// DELETE /api/sponsors/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const sponsorId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM sponsors WHERE id = ?').get(sponsorId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sponsor not found.' });
    }

    db.prepare('DELETE FROM sponsors WHERE id = ?').run(sponsorId);

    logActivity(req, {
      department: 'Sponsorships',
      action: 'Deleted',
      change: `Deleted sponsor "${existing.sponsor_name}" (₹${existing.amount})`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Sponsor deleted successfully.' });
  } catch (err) {
    console.error('[SPONSOR DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete sponsor.' });
  }
});

module.exports = router;
