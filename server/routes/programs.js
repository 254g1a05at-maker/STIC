const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');
const { upload } = require('../upload');

// Generate next unique program code like STIC-2026-003
function generateProgramCode() {
  const currentYear = new Date().getFullYear();
  const prefix = `STIC-${currentYear}-`;
  const lastRow = db.prepare(`
    SELECT program_code FROM programs 
    WHERE program_code LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`);

  let nextNum = 1;
  if (lastRow && lastRow.program_code) {
    const parts = lastRow.program_code.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// GET /api/programs (list with filters & calculations)
router.get('/', requireAuth, (req, res) => {
  try {
    const { search, status, program_type, year, month, date_from, date_to } = req.query;

    let query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM photos WHERE program_id = p.id) as photo_count,
        (SELECT COUNT(*) FROM videos WHERE program_id = p.id) as video_count,
        (SELECT COUNT(*) FROM documents WHERE program_id = p.id) as doc_count,
        (SELECT COUNT(*) FROM program_coordinators WHERE program_id = p.id) as coordinator_count,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Income') as total_income,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE program_id = p.id AND type = 'Expense') as total_expense
      FROM programs p
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.program_code LIKE ? OR p.venue LIKE ? OR p.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (program_type) {
      query += ` AND p.program_type = ?`;
      params.push(program_type);
    }

    if (year) {
      query += ` AND p.program_date LIKE ?`;
      params.push(`${year}%`);
    }

    if (month && year) {
      query += ` AND p.program_date LIKE ?`;
      params.push(`${year}-${String(month).padStart(2, '0')}%`);
    }

    if (date_from) {
      query += ` AND p.program_date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND p.program_date <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY p.program_date DESC, p.id DESC`;

    const rawPrograms = db.prepare(query).all(...params);

    // Attach coordinators list to each program
    const getCoordinators = db.prepare(`
      SELECT 
        m.id as member_id,
        m.full_name,
        m.college_id,
        m.email,
        m.phone,
        m.profile_photo,
        pc.role_title
      FROM program_coordinators pc
      JOIN club_members m ON pc.member_id = m.id
      WHERE pc.program_id = ?
    `);

    const programs = rawPrograms.map(p => {
      const coordinators = getCoordinators.all(p.id);
      return {
        ...p,
        total_balance: p.total_income - p.total_expense,
        coordinators
      };
    });

    const totalConducted = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'Completed'").get().count;

    return res.json({
      success: true,
      total_programs: programs.length,
      total_conducted: totalConducted,
      data: programs
    });
  } catch (err) {
    console.error('[PROGRAMS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve programs.' });
  }
});

// GET /api/programs/:id (individual program detailed page)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const programId = Number(req.params.id);
    const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(programId);

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found.' });
    }

    // 1. Coordinators
    const coordinators = db.prepare(`
      SELECT 
        m.id,
        m.full_name,
        m.college_id,
        m.email,
        m.phone,
        m.year,
        m.branch,
        m.profile_photo,
        pc.role_title
      FROM program_coordinators pc
      JOIN club_members m ON pc.member_id = m.id
      WHERE pc.program_id = ?
      ORDER BY m.full_name ASC
    `).all(programId);

    // 2. Photos
    const photos = db.prepare('SELECT * FROM photos WHERE program_id = ? ORDER BY id DESC').all(programId);

    // 3. Videos
    const videos = db.prepare('SELECT * FROM videos WHERE program_id = ? ORDER BY id DESC').all(programId);

    // 4. Documents
    const documents = db.prepare('SELECT * FROM documents WHERE program_id = ? ORDER BY id DESC').all(programId);

    // 5. Finance Transactions (Income & Expense)
    const transactions = db.prepare('SELECT * FROM transactions WHERE program_id = ? ORDER BY date DESC, id DESC').all(programId);
    
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeList = [];
    const expenseList = [];

    transactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += t.amount;
        incomeList.push(t);
      } else {
        totalExpense += t.amount;
        expenseList.push(t);
      }
    });

    const balance = totalIncome - totalExpense;

    // 6. Sponsors
    const sponsors = db.prepare('SELECT * FROM sponsors WHERE program_id = ? ORDER BY sponsorship_date DESC').all(programId);
    const totalSponsorship = sponsors.reduce((acc, s) => acc + (s.amount || 0), 0);

    // 7. Social Media Posts
    const socialPosts = db.prepare('SELECT * FROM social_media_posts WHERE program_id = ? ORDER BY publication_date DESC, id DESC').all(programId);

    return res.json({
      success: true,
      data: {
        ...program,
        coordinators,
        photos,
        videos,
        documents,
        finance: {
          total_income: totalIncome,
          total_expense: totalExpense,
          balance: balance,
          transactions,
          income_list: incomeList,
          expense_list: expenseList
        },
        sponsors: {
          list: sponsors,
          total_amount: totalSponsorship
        },
        social_media: socialPosts
      }
    });
  } catch (err) {
    console.error('[PROGRAM GET ID ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve program details.' });
  }
});

// POST /api/programs (create program)
router.post('/', requireAuth, upload.single('poster'), (req, res) => {
  try {
    const {
      name,
      program_code,
      program_date,
      start_time,
      end_time,
      venue,
      program_type,
      description,
      participants_count,
      status,
      coordinator_ids, // array or JSON string of member IDs
      coordinator_role,
      poster_url
    } = req.body;

    if (!name || !program_date) {
      return res.status(400).json({ success: false, message: 'Program name and date are required.' });
    }

    const code = (program_code && program_code.trim()) ? program_code.trim() : generateProgramCode();

    // Check duplicate code
    const existing = db.prepare('SELECT id FROM programs WHERE program_code = ?').get(code);
    if (existing) {
      return res.status(400).json({ success: false, message: `Program Code "${code}" is already in use.` });
    }

    let poster = poster_url || null;
    if (req.file) {
      poster = `/uploads/posters/${req.file.filename}`;
    }

    const insertProg = db.prepare(`
      INSERT INTO programs (
        program_code, name, program_date, start_time, end_time, venue,
        program_type, description, participants_count, status, poster_url,
        is_demo, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const result = insertProg.run(
      code,
      name.trim(),
      program_date,
      start_time || null,
      end_time || null,
      venue ? venue.trim() : 'Campus Auditorium',
      program_type || 'Workshop',
      description ? description.trim() : null,
      participants_count ? Number(participants_count) : 0,
      status || 'Planned',
      poster,
      req.user.username,
      req.user.username
    );

    const programId = result.lastInsertRowid;

    // Attach coordinators if passed
    if (coordinator_ids) {
      let ids = [];
      try {
        ids = Array.isArray(coordinator_ids) ? coordinator_ids : JSON.parse(coordinator_ids);
      } catch (e) {
        if (typeof coordinator_ids === 'string') {
          ids = coordinator_ids.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      const insertCoord = db.prepare(`
        INSERT OR IGNORE INTO program_coordinators (program_id, member_id, role_title)
        VALUES (?, ?, ?)
      `);
      ids.forEach(mId => {
        if (mId) insertCoord.run(programId, Number(mId), coordinator_role || 'Coordinator');
      });
    }

    const created = db.prepare('SELECT * FROM programs WHERE id = ?').get(programId);
    logActivity(req, {
      department: 'Programs & Events',
      action: 'Created',
      change: `Created program "${name}" (${code}) scheduled for ${program_date}`,
      new_value: {
        name,
        program_code: code,
        program_date,
        venue,
        program_type,
        description
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Program created successfully.',
      data: created
    });
  } catch (err) {
    console.error('[PROGRAM CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create program.' });
  }
});

// PUT /api/programs/:id (update program)
router.put('/:id', requireAuth, upload.single('poster'), (req, res) => {
  try {
    const programId = Number(req.params.id);
    let existing = db.prepare('SELECT * FROM programs WHERE id = ?').get(programId);
    if (!existing && req.body && req.body.program_code) {
      existing = db.prepare('SELECT * FROM programs WHERE program_code = ?').get(req.body.program_code.trim());
    }
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Program not found.' });
    }
    const effectiveId = existing.id;

    const {
      name,
      program_code,
      program_date,
      start_time,
      end_time,
      venue,
      program_type,
      description,
      participants_count,
      status,
      coordinator_ids,
      poster_url
    } = req.body;

    if (program_code && program_code.trim() !== existing.program_code) {
      const duplicate = db.prepare('SELECT id FROM programs WHERE program_code = ? AND id != ?').get(program_code.trim(), effectiveId);
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Program Code "${program_code}" is already in use.` });
      }
    }

    let poster = existing.poster_url;
    if (req.file) {
      poster = `/uploads/posters/${req.file.filename}`;
    } else if (poster_url !== undefined) {
      poster = poster_url;
    }

    db.prepare(`
      UPDATE programs SET
        name = COALESCE(?, name),
        program_code = COALESCE(?, program_code),
        program_date = COALESCE(?, program_date),
        start_time = ?,
        end_time = ?,
        venue = COALESCE(?, venue),
        program_type = COALESCE(?, program_type),
        description = ?,
        participants_count = COALESCE(?, participants_count),
        status = COALESCE(?, status),
        poster_url = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      program_code ? program_code.trim() : null,
      program_date || null,
      start_time !== undefined ? start_time : existing.start_time,
      end_time !== undefined ? end_time : existing.end_time,
      venue ? venue.trim() : null,
      program_type || null,
      description !== undefined ? description : existing.description,
      participants_count !== undefined ? Number(participants_count) : null,
      status || null,
      poster,
      req.user.username,
      effectiveId
    );

    // Update coordinators if explicitly provided
    if (coordinator_ids !== undefined) {
      let ids = [];
      try {
        ids = Array.isArray(coordinator_ids) ? coordinator_ids : JSON.parse(coordinator_ids);
      } catch (e) {
        if (typeof coordinator_ids === 'string') {
          ids = coordinator_ids.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      db.prepare('DELETE FROM program_coordinators WHERE program_id = ?').run(effectiveId);
      const insertCoord = db.prepare(`
        INSERT OR IGNORE INTO program_coordinators (program_id, member_id, role_title)
        VALUES (?, ?, ?)
      `);
      ids.forEach(mId => {
        if (mId) insertCoord.run(effectiveId, Number(mId), 'Coordinator');
      });
    }

    const updated = db.prepare('SELECT * FROM programs WHERE id = ?').get(effectiveId);

    logActivity(req, {
      department: 'Programs & Events',
      action: 'Updated',
      change: `Updated program "${updated.name}" (${updated.program_code})`,
      previous_value: {
        name: existing.name,
        program_code: existing.program_code,
        program_date: existing.program_date,
        venue: existing.venue,
        program_type: existing.program_type,
        status: existing.status,
        description: existing.description
      },
      new_value: {
        name: updated.name,
        program_code: updated.program_code,
        program_date: updated.program_date,
        venue: updated.venue,
        program_type: updated.program_type,
        status: updated.status,
        description: updated.description
      }
    });

    return res.json({
      success: true,
      message: 'Program updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[PROGRAM UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update program.' });
  }
});

// DELETE /api/programs/:id (cascade deletion handled by SQLite ON DELETE CASCADE)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const programId = Number(req.params.id);
    let existing = db.prepare('SELECT id, name, program_code FROM programs WHERE id = ?').get(programId);
    if (!existing && req.query && req.query.program_code) {
      existing = db.prepare('SELECT id, name, program_code FROM programs WHERE program_code = ?').get(req.query.program_code.trim());
    }
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Program not found.' });
    }
    const effectiveId = existing.id;

    // Delete program (cascades to program_coordinators, photos, videos, documents, social_media_posts, and sets null on transactions/sponsors)
    db.prepare('DELETE FROM programs WHERE id = ?').run(effectiveId);

    logActivity(req, {
      department: 'Programs & Events',
      action: 'Deleted',
      change: `Deleted program "${existing.name}" (${existing.program_code}) and associated records`,
      previous_value: {
        name: existing.name,
        program_code: existing.program_code
      }
    });

    return res.json({
      success: true,
      message: `Program "${existing.name}" and associated records deleted successfully.`
    });
  } catch (err) {
    console.error('[PROGRAM DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete program.' });
  }
});

// POST /api/programs/:id/coordinators (add coordinator)
router.post('/:id/coordinators', requireAuth, (req, res) => {
  try {
    const programId = Number(req.params.id);
    const { member_id, role_title } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    const member = db.prepare('SELECT full_name FROM club_members WHERE id = ?').get(Number(member_id));
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    db.prepare(`
      INSERT OR REPLACE INTO program_coordinators (program_id, member_id, role_title)
      VALUES (?, ?, ?)
    `).run(programId, Number(member_id), role_title || 'Event Coordinator');

    logActivity(req, {
      department: 'Programs & Events',
      action: 'Updated',
      change: `Assigned ${member.full_name} as ${role_title || 'Event Coordinator'} to program ID ${programId}`,
      new_value: { program_id: programId, member_name: member.full_name, role_title: role_title || 'Event Coordinator' }
    });

    return res.json({ success: true, message: `Added ${member.full_name} as coordinator.` });
  } catch (err) {
    console.error('[ADD COORDINATOR ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to add coordinator.' });
  }
});

// DELETE /api/programs/:id/coordinators/:memberId (remove coordinator)
router.delete('/:id/coordinators/:memberId', requireAuth, (req, res) => {
  try {
    const programId = Number(req.params.id);
    const memberId = Number(req.params.memberId);

    db.prepare('DELETE FROM program_coordinators WHERE program_id = ? AND member_id = ?').run(programId, memberId);
    logActivity(req, {
      department: 'Programs & Events',
      action: 'Updated',
      change: `Removed coordinator (Member ID: ${memberId}) from program ID ${programId}`,
      previous_value: { program_id: programId, member_id: memberId }
    });

    return res.json({ success: true, message: 'Coordinator removed successfully.' });
  } catch (err) {
    console.error('[REMOVE COORDINATOR ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove coordinator.' });
  }
});

module.exports = router;
