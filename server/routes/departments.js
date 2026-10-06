const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');

// GET /api/departments (all departments with lead details & member count)
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
        (SELECT COUNT(*) FROM club_members cm WHERE cm.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      ORDER BY d.id ASC
    `).all();

    return res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    console.error('[DEPARTMENTS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve departments.' });
  }
});

// GET /api/departments/:id (single department with all its members)
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
        m.college_id as lead_college_id
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
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

// PUT /api/departments/:id (update name, description, lead)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const deptId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(deptId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const { name, description, lead_member_id, icon } = req.body;

    let leadId = null;
    if (lead_member_id !== undefined && lead_member_id !== null && lead_member_id !== '') {
      leadId = Number(lead_member_id);
      const leadMember = db.prepare('SELECT id FROM club_members WHERE id = ?').get(leadId);
      if (!leadMember) {
        return res.status(400).json({ success: false, message: 'Selected lead member does not exist.' });
      }
      // Automatically ensure lead member is in this department if they aren't already
      db.prepare('UPDATE club_members SET department_id = ? WHERE id = ?').run(deptId, leadId);
    }

    db.prepare(`
      UPDATE departments SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        lead_member_id = ?,
        icon = COALESCE(?, icon),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description !== undefined ? description : null,
      leadId,
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
        (SELECT COUNT(*) FROM club_members cm WHERE cm.department_id = d.id) as member_count
      FROM departments d
      LEFT JOIN club_members m ON d.lead_member_id = m.id
      WHERE d.id = ?
    `).get(deptId);

    logActivity(req, {
      department: 'Departments & Teams',
      action: 'Updated',
      change: `Updated department "${updated.name}" details`,
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
