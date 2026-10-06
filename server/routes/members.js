const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, checkPermission } = require('../auth');
const { logActivity } = require('../activity');
const { upload } = require('../upload');

// GET /api/members (list with search, filter, and sort)
router.get('/', requireAuth, (req, res) => {
  try {
    const { search, department_id, year, branch, section, status, role, sort_by, order } = req.query;

    let query = `
      SELECT 
        m.*,
        d.name as department_name,
        d.icon as department_icon,
        (SELECT COUNT(*) FROM program_coordinators pc WHERE pc.member_id = m.id) as programs_coordinated_count
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (m.full_name LIKE ? OR m.college_id LIKE ? OR m.email LIKE ? OR m.phone LIKE ? OR m.position LIKE ? OR m.section LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (section) {
      query += ` AND (m.section = ? OR m.notes LIKE ? OR m.branch LIKE ?)`;
      params.push(section, `%Section: ${section}%`, `%(${section})%`);
    }

    if (department_id) {
      if (department_id === 'unassigned') {
        query += ` AND m.department_id IS NULL`;
      } else {
        query += ` AND m.department_id = ?`;
        params.push(Number(department_id));
      }
    }

    if (year) {
      query += ` AND m.year = ?`;
      params.push(year);
    }

    if (branch) {
      query += ` AND m.branch = ?`;
      params.push(branch);
    }

    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    if (role) {
      query += ` AND m.position LIKE ?`;
      params.push(`%${role}%`);
    }

    // Sorting
    let orderByClause = 'ORDER BY m.full_name ASC';
    if (sort_by === 'department') {
      orderByClause = `ORDER BY d.name ${order === 'DESC' ? 'DESC' : 'ASC'}, m.full_name ASC`;
    } else if (sort_by === 'year') {
      orderByClause = `ORDER BY m.year ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    } else if (sort_by === 'joining_date') {
      orderByClause = `ORDER BY m.joining_date ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    } else if (sort_by === 'name_desc') {
      orderByClause = 'ORDER BY m.full_name DESC';
    } else {
      orderByClause = `ORDER BY m.full_name ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }

    query += ` ${orderByClause}`;

    const members = db.prepare(query).all(...params);
    return res.json({ success: true, count: members.length, data: members });
  } catch (err) {
    console.error('[MEMBERS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve members.' });
  }
});

// GET /api/members/:id (single member with details & coordinated programs)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const member = db.prepare(`
      SELECT 
        m.*,
        d.name as department_name,
        d.icon as department_icon
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Coordinated programs
    const coordinatedPrograms = db.prepare(`
      SELECT p.*, pc.role_title
      FROM program_coordinators pc
      JOIN programs p ON pc.program_id = p.id
      WHERE pc.member_id = ?
      ORDER BY p.program_date DESC
    `).all(req.params.id);

    return res.json({
      success: true,
      data: {
        ...member,
        coordinated_programs: coordinatedPrograms
      }
    });
  } catch (err) {
    console.error('[MEMBER GET ID ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve member details.' });
  }
});

// POST /api/members (create member)
router.post('/', requireAuth, checkPermission('manage_members'), upload.single('avatar'), (req, res) => {
  try {
    const {
      full_name,
      college_id,
      email,
      phone,
      year,
      branch,
      section,
      position,
      department_id,
      joining_date,
      status,
      notes,
      profile_photo_url,
      profile_photo
    } = req.body;

    if (!full_name || !college_id || !email) {
      return res.status(400).json({ success: false, message: 'Full name, College ID, and Email are required.' });
    }

    // Check duplicate college ID
    const existing = db.prepare('SELECT id FROM club_members WHERE college_id = ?').get(college_id.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: `Member with College ID "${college_id}" already exists.` });
    }

    let profilePhoto = profile_photo || profile_photo_url || null;
    if (req.file) {
      profilePhoto = `/uploads/avatars/${req.file.filename}`;
    }

    const deptId = department_id ? Number(department_id) : null;
    const memberStatus = status || 'Active';
    const joinDate = joining_date || new Date().toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO club_members (
        full_name, college_id, email, phone, year, branch, section, position, 
        department_id, profile_photo, joining_date, status, notes, 
        is_demo, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      full_name.trim(),
      college_id.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      year || '1st Year',
      branch ? branch.trim() : 'General Engineering',
      section ? section.trim() : null,
      position ? position.trim() : 'Club Member',
      deptId,
      profilePhoto,
      joinDate,
      memberStatus,
      notes ? notes.trim() : null,
      req.user.username,
      req.user.username
    );

    const newMemberId = result.lastInsertRowid;
    const createdMember = db.prepare(`
      SELECT m.*, d.name as department_name 
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE m.id = ?
    `).get(newMemberId);

    logActivity(req, {
      department: 'Club Members',
      action: 'Created',
      change: `Added member "${full_name}" (${college_id}) – ${position || 'Club Member'}`,
      new_value: {
        full_name,
        college_id,
        email,
        phone,
        year,
        branch,
        position: position || 'Club Member',
        status: memberStatus
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Member added successfully.',
      data: createdMember
    });
  } catch (err) {
    console.error('[MEMBER CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create member.' });
  }
});

// PUT /api/members/:id (update member)
router.put('/:id', requireAuth, checkPermission('manage_members'), upload.single('avatar'), (req, res) => {
  try {
    const memberId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM club_members WHERE id = ?').get(memberId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const {
      full_name,
      college_id,
      email,
      phone,
      year,
      branch,
      section,
      position,
      department_id,
      joining_date,
      status,
      notes,
      profile_photo_url,
      profile_photo
    } = req.body;

    if (college_id && college_id.trim() !== existing.college_id) {
      const duplicate = db.prepare('SELECT id FROM club_members WHERE college_id = ? AND id != ?').get(college_id.trim(), memberId);
      if (duplicate) {
        return res.status(400).json({ success: false, message: `College ID "${college_id}" already taken.` });
      }
    }

    let profilePhoto = existing.profile_photo;
    if (req.file) {
      profilePhoto = `/uploads/avatars/${req.file.filename}`;
    } else if (profile_photo !== undefined) {
      profilePhoto = profile_photo;
    } else if (profile_photo_url !== undefined) {
      profilePhoto = profile_photo_url;
    }

    const deptId = department_id !== undefined ? (department_id ? Number(department_id) : null) : existing.department_id;

    db.prepare(`
      UPDATE club_members SET
        full_name = COALESCE(?, full_name),
        college_id = COALESCE(?, college_id),
        email = COALESCE(?, email),
        phone = ?,
        year = COALESCE(?, year),
        branch = COALESCE(?, branch),
        section = ?,
        position = COALESCE(?, position),
        department_id = ?,
        profile_photo = ?,
        joining_date = COALESCE(?, joining_date),
        status = COALESCE(?, status),
        notes = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      full_name ? full_name.trim() : null,
      college_id ? college_id.trim() : null,
      email ? email.trim() : null,
      phone !== undefined ? phone : existing.phone,
      year || null,
      branch ? branch.trim() : null,
      section !== undefined ? (section ? section.trim() : null) : existing.section,
      position ? position.trim() : null,
      deptId,
      profilePhoto,
      joining_date || null,
      status || null,
      notes !== undefined ? notes : existing.notes,
      req.user.username,
      memberId
    );

    const updated = db.prepare(`
      SELECT m.*, d.name as department_name 
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      WHERE m.id = ?
    `).get(memberId);

    logActivity(req, {
      department: 'Club Members',
      action: 'Updated',
      change: `Updated member "${updated.full_name}" (${updated.college_id})`,
      previous_value: {
        full_name: existing.full_name,
        college_id: existing.college_id,
        email: existing.email,
        phone: existing.phone,
        year: existing.year,
        branch: existing.branch,
        position: existing.position,
        department_id: existing.department_id,
        status: existing.status
      },
      new_value: {
        full_name: updated.full_name,
        college_id: updated.college_id,
        email: updated.email,
        phone: updated.phone,
        year: updated.year,
        branch: updated.branch,
        position: updated.position,
        department_id: updated.department_id,
        status: updated.status
      }
    });

    return res.json({
      success: true,
      message: 'Member updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[MEMBER UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update member.' });
  }
});

// DELETE /api/members/:id (delete member)
router.delete('/:id', requireAuth, checkPermission('manage_members'), (req, res) => {
  try {
    const memberId = Number(req.params.id);
    const existing = db.prepare('SELECT full_name, college_id FROM club_members WHERE id = ?').get(memberId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Unset department lead if this member was a department lead
    db.prepare('UPDATE departments SET lead_member_id = NULL WHERE lead_member_id = ?').run(memberId);

    // Delete coordinator entries
    db.prepare('DELETE FROM program_coordinators WHERE member_id = ?').run(memberId);

    // Delete member
    db.prepare('DELETE FROM club_members WHERE id = ?').run(memberId);

    logActivity(req, {
      department: 'Club Members',
      action: 'Deleted',
      change: `Deleted member "${existing.full_name}" (${existing.college_id})`,
      previous_value: {
        full_name: existing.full_name,
        college_id: existing.college_id
      }
    });

    return res.json({ success: true, message: `Member ${existing.full_name} deleted successfully.` });
  } catch (err) {
    console.error('[MEMBER DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete member.' });
  }
});

module.exports = router;
