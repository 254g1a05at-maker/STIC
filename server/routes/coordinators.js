const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

// GET /api/coordinators (members with their coordinated programs list)
router.get('/', requireAuth, (req, res) => {
  try {
    const members = db.prepare(`
      SELECT 
        m.id,
        m.full_name,
        m.college_id,
        m.email,
        m.phone,
        m.year,
        m.branch,
        m.position,
        m.profile_photo,
        d.name as department_name,
        (SELECT COUNT(*) FROM program_coordinators pc WHERE pc.member_id = m.id) as programs_count
      FROM club_members m
      LEFT JOIN departments d ON m.department_id = d.id
      ORDER BY programs_count DESC, m.full_name ASC
    `).all();

    const getPrograms = db.prepare(`
      SELECT 
        p.id,
        p.program_code,
        p.name,
        p.program_date,
        p.status,
        p.venue,
        p.program_type,
        pc.role_title
      FROM program_coordinators pc
      JOIN programs p ON pc.program_id = p.id
      WHERE pc.member_id = ?
      ORDER BY p.program_date DESC
    `);

    const coordinatorsData = members.map(m => {
      const programs = getPrograms.all(m.id);
      return {
        ...m,
        programs
      };
    });

    return res.json({
      success: true,
      total_coordinators: coordinatorsData.filter(c => c.programs_count > 0).length,
      data: coordinatorsData
    });
  } catch (err) {
    console.error('[COORDINATORS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve coordinators data.' });
  }
});

module.exports = router;
