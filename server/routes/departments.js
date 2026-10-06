const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');

// GET /api/departments (all departments with lead & co-lead details & member count)
router.get('/', requireAuth, (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT 
        d.*,
        m.full_name as lead_name,
        m.email as lead_email,
        m.phone as lead_phone,
        m.profile_photo as lead_photo,
        m.college_id as lead_college_id,
        cm.full_name as co_lead_name,
        cm.email as co_lead_email,
        cm.phone as co_lead_phone,
        cm.profile_photo as co_lead_photo,
        cm.college_id as co_lead_college_id,
        (SELECT COUNT(*) FROM club_members mem WHERE mem.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      LEFT JOIN club_members cm ON d.co_lead_member_id = cm.id
      ORDER BY d.id ASC
    `).all();

    return res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    console.error('[DEPARTMENTS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve departments.' });
  }
});

// GET /api/departments/:id (single department with lead, co-lead & all its members)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const deptId = Number(req.params.id);
    const department = db.prepare(`
      SELECT 
        d.*,
        m.full_name as lead_name,
        m.email as lead_email,
        m.phone as lead_phone,
        m.profile_photo as lead_photo,
        m.college_id as lead_college_id,
        cm.full_name as co_lead_name,
        cm.email as co_lead_email,
        cm.phone as co_lead_phone,
        cm.profile_photo as co_lead_photo,
        cm.college_id as co_lead_college_id
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      LEFT JOIN club_members cm ON d.co_lead_member_id = cm.id
      WHERE d.id = ?
    `).get(deptId);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const members = db.prepare(`
      SELECT * FROM club_members
      WHERE department_id = ?
      ORDER BY full_name ASC
    `).all(deptId);

    return res.json({
      success: true,
      data: {
        ...department,
        members,
        member_count: members.length
      }
    });
  } catch (err) {
    console.error('[DEPARTMENT GET ID ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve department details.' });
  }
});

// POST /api/departments (create new department)
router.post('/', requireAuth, (req, res) => {
  try {
    const { name, description, lead_member_id, co_lead_member_id, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    const trimmedName = name.trim();
    const existing = db.prepare('SELECT id FROM departments WHERE name = ?').get(trimmedName);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A department with this name already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO departments (name, description, lead_member_id, co_lead_member_id, icon, is_demo)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(
      trimmedName,
      description || null,
      lead_member_id ? Number(lead_member_id) : null,
      co_lead_member_id ? Number(co_lead_member_id) : null,
      icon || 'Lightbulb'
    );

    const deptId = result.lastInsertRowid;
    if (lead_member_id) {
      db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, Number(lead_member_id));
    }
    if (co_lead_member_id) {
      db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, Number(co_lead_member_id));
    }

    const created = db.prepare(`
      SELECT 
        d.*,
        m.full_name as lead_name,
        m.email as lead_email,
        m.phone as lead_phone,
        m.profile_photo as lead_photo,
        m.college_id as lead_college_id,
        cm.full_name as co_lead_name,
        cm.email as co_lead_email,
        cm.phone as co_lead_phone,
        cm.profile_photo as co_lead_photo,
        cm.college_id as co_lead_college_id,
        (SELECT COUNT(*) FROM club_members mem WHERE mem.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      LEFT JOIN club_members cm ON d.co_lead_member_id = cm.id
      WHERE d.id = ?
    `).get(deptId);

    logActivity(req, {
      department: 'Departments & Teams',
      action: 'Created',
      change: `Created new department "${created.name}"`,
      new_value: created
    });

    return res.json({
      success: true,
      message: 'Department created successfully.',
      data: created
    });
  } catch (err) {
    console.error('[DEPARTMENT CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create department.' });
  }
});

// PUT /api/departments/:id (update name, description, lead, co-lead, icon)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const deptId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(deptId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const { name, description, lead_member_id, co_lead_member_id, icon } = req.body;

    let leadId = existing.lead_member_id;
    if (lead_member_id !== undefined) {
      if (lead_member_id !== null && lead_member_id !== '') {
        leadId = Number(lead_member_id);
        const leadMember = db.prepare('SELECT id FROM club_members WHERE id = ?').get(leadId);
        if (!leadMember) {
          return res.status(400).json({ success: false, message: 'Selected lead member does not exist.' });
        }
        db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, leadId);
      } else {
        leadId = null;
      }
    }

    let coLeadId = existing.co_lead_member_id;
    if (co_lead_member_id !== undefined) {
      if (co_lead_member_id !== null && co_lead_member_id !== '') {
        coLeadId = Number(co_lead_member_id);
        const coLeadMember = db.prepare('SELECT id FROM club_members WHERE id = ?').get(coLeadId);
        if (!coLeadMember) {
          return res.status(400).json({ success: false, message: 'Selected co-lead member does not exist.' });
        }
        db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, coLeadId);
      } else {
        coLeadId = null;
      }
    }

    db.prepare(`
      UPDATE departments SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        lead_member_id = ?,
        co_lead_member_id = ?,
        icon = COALESCE(?, icon),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description !== undefined ? description : null,
      leadId,
      coLeadId,
      icon || null,
      deptId
    );

    const updated = db.prepare(`
      SELECT 
        d.*,
        m.full_name as lead_name,
        m.email as lead_email,
        m.phone as lead_phone,
        m.profile_photo as lead_photo,
        m.college_id as lead_college_id,
        cm.full_name as co_lead_name,
        cm.email as co_lead_email,
        cm.phone as co_lead_phone,
        cm.profile_photo as co_lead_photo,
        cm.college_id as co_lead_college_id,
        (SELECT COUNT(*) FROM club_members mem WHERE mem.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      LEFT JOIN club_members cm ON d.co_lead_member_id = cm.id
      WHERE d.id = ?
    `).get(deptId);

    logActivity(req, {
      department: 'Departments & Teams',
      action: 'Updated',
      change: `Updated department "${updated.name}" details (Lead & Co-Lead)`,
      previous_value: existing,
      new_value: updated
    });

    return res.json({
      success: true,
      message: 'Department updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[DEPARTMENT UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update department.' });
  }
});

// POST /api/departments/:id/members (assign member to department)
router.post('/:id/members', requireAuth, (req, res) => {
  try {
    const deptId = Number(req.params.id);
    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    const member = db.prepare('SELECT * FROM club_members WHERE id = ?').get(Number(member_id));
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, Number(member_id));

    logActivity(req, {
      department: 'Departments & Teams',
      action: 'Updated',
      change: `Assigned member "${member.full_name}" to department ID ${deptId}`,
      new_value: { department_id: deptId, member_id: member.id, member_name: member.full_name }
    });

    return res.json({
      success: true,
      message: `Assigned ${member.full_name} to department successfully.`
    });
  } catch (err) {
    console.error('[DEPT ASSIGN MEMBER ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to assign member.' });
  }
});

// DELETE /api/departments/:id/members/:memberId (remove member from department)
router.delete('/:id/members/:memberId', requireAuth, (req, res) => {
  try {
    const deptId = Number(req.params.id);
    const memberId = Number(req.params.memberId);

    const member = db.prepare('SELECT * FROM club_members WHERE id = ? AND department_id = ?').get(memberId, deptId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this department.' });
    }

    // If this member was the department lead, unset lead
    db.prepare('UPDATE departments SET lead_member_id = NULL WHERE id = ? AND lead_member_id = ?').run(deptId, memberId);

    // If this member was the department co-lead, unset co-lead
    db.prepare('UPDATE departments SET co_lead_member_id = NULL WHERE id = ? AND co_lead_member_id = ?').run(deptId, memberId);

    // Unassign department
    db.prepare('UPDATE club_members SET department_id = NULL WHERE id = ?').run(memberId);

    logActivity(req, {
      department: 'Departments & Teams',
      action: 'Updated',
      change: `Removed member "${member.full_name}" from department ID ${deptId}`,
      previous_value: { department_id: deptId, member_id: member.id, member_name: member.full_name }
    });

    return res.json({
      success: true,
      message: `Removed ${member.full_name} from department.`
    });
  } catch (err) {
    console.error('[DEPT REMOVE MEMBER ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
});

module.exports = router;
