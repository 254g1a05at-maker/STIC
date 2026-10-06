const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'stic.db');
const db = new Database(dbPath);

// Reset club_members to populate clean 10 representatives + regular members
db.prepare('DELETE FROM club_members').run();

const depts = db.prepare('SELECT id, name FROM departments').all();
const deptMap = {};
depts.forEach(d => { deptMap[d.name] = d.id; });

const demoMembers = [
  {
    full_name: 'Aarav Sharma',
    college_id: 'STIC-2024-001',
    email: 'aarav.sharma@stic-club.org',
    phone: '+91 98111 22334',
    year: '4th Year',
    branch: 'Computer Science & Engineering',
    position: 'President',
    department_id: deptMap['Technical & Innovation'] || null,
    profile_photo: '/uploads/avatars/WhatsApp_Image_2026-09-26_at_12_14_04_AM-1790398575475-666308.jpeg',
    joining_date: '2024-08-15',
    status: 'Active',
    notes: 'Leading smart campus solar monitoring prototype.'
  },
  {
    full_name: 'Ananya Deshmukh',
    college_id: 'STIC-2024-002',
    email: 'ananya.d@stic-club.org',
    phone: '+91 98222 33445',
    year: '3rd Year',
    branch: 'Environmental Engineering',
    position: 'Co-President',
    department_id: deptMap['Content & Documentation'] || null,
    profile_photo: '/uploads/avatars/WhatsApp_Image_2026-09-25_at_11_50_00_PM-1790398599057-587919.jpeg',
    joining_date: '2024-09-01',
    status: 'Active',
    notes: 'Lead editor for STIC Annual Green Report.'
  },
  {
    full_name: 'Rohan Mehra',
    college_id: 'STIC-2025-003',
    email: 'rohan.mehra@stic-club.org',
    phone: '+91 98333 44556',
    year: '3rd Year',
    branch: 'Mechanical Engineering',
    position: 'Vice President',
    department_id: deptMap['Finance & Sponsorship'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_3.png',
    joining_date: '2025-01-10',
    status: 'Active',
    notes: 'Secured CleanTech Corp associate sponsorship.'
  },
  {
    full_name: 'Pooja Iyer',
    college_id: 'STIC-2025-004',
    email: 'pooja.iyer@stic-club.org',
    phone: '+91 98444 55667',
    year: '2nd Year',
    branch: 'Electronics & Communication',
    position: 'Co-Vice President',
    department_id: deptMap['Social Media & Publicity'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_4.png',
    joining_date: '2025-02-05',
    status: 'Active',
    notes: 'Manages STIC Instagram reels and YouTube channel.'
  },
  {
    full_name: 'Vikram Singh',
    college_id: 'STIC-2025-005',
    email: 'vikram.singh@stic-club.org',
    phone: '+91 98555 66778',
    year: '3rd Year',
    branch: 'Civil & Infrastructure Engg',
    position: 'Secretary',
    department_id: deptMap['Event Coordinators'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_5.png',
    joining_date: '2025-02-12',
    status: 'Active',
    notes: 'Coordinated campus e-waste drive and seminar hall logistics.'
  },
  {
    full_name: 'Kaviraj Patel',
    college_id: 'STIC-2025-006',
    email: 'kaviraj.patel@stic-club.org',
    phone: '+91 98666 77889',
    year: '3rd Year',
    branch: 'Computer Science & Engineering',
    position: 'Technical Lead',
    department_id: deptMap['Technical & Innovation'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_6.png',
    joining_date: '2025-03-01',
    status: 'Active',
    notes: 'Leads visual design, event posters, and digital assets.'
  },
  {
    full_name: 'Neha Verma',
    college_id: 'STIC-2025-007',
    email: 'neha.verma@stic-club.org',
    phone: '+91 98777 88990',
    year: '4th Year',
    branch: 'Information Technology',
    position: 'Content and Documentation Lead',
    department_id: deptMap['Content & Documentation'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_7.png',
    joining_date: '2025-03-15',
    status: 'Active',
    notes: 'Directs student research papers and sustainability patents.'
  },
  {
    full_name: 'Siddharth Nair',
    college_id: 'STIC-2025-008',
    email: 'siddharth.nair@stic-club.org',
    phone: '+91 98888 99001',
    year: '2nd Year',
    branch: 'Electrical & Electronics Engg',
    position: 'Social Media Lead',
    department_id: deptMap['Social Media & Publicity'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_8.png',
    joining_date: '2025-04-02',
    status: 'Active',
    notes: 'Manages embedded sensors and green grid IoT prototypes.'
  },
  {
    full_name: 'Sneha Kulkarni',
    college_id: 'STIC-2025-009',
    email: 'sneha.kulkarni@stic-club.org',
    phone: '+91 98999 00112',
    year: '3rd Year',
    branch: 'Computer Science & Engineering',
    position: 'Finance Lead',
    department_id: deptMap['Finance & Sponsorship'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_9.png',
    joining_date: '2025-04-20',
    status: 'Active',
    notes: 'Handles industry partnerships and corporate guest lectures.'
  },
  {
    full_name: 'Aditya Varma',
    college_id: 'STIC-2025-010',
    email: 'aditya.varma@stic-club.org',
    phone: '+91 98000 11223',
    year: '3rd Year',
    branch: 'Mechanical Engineering',
    position: 'Event Manager',
    department_id: deptMap['Event Coordinators'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_10.png',
    joining_date: '2025-05-05',
    status: 'Active',
    notes: 'Manages stage setup, audio-visual gear, and logistics.'
  },
  {
    full_name: 'Divya Reddy',
    college_id: 'STIC-2025-011',
    email: 'divya.reddy@stic-club.org',
    phone: '+91 98123 45678',
    year: '2nd Year',
    branch: 'Computer Science & Engineering',
    position: 'Event Manager',
    department_id: deptMap['Event Coordinators'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_11.png',
    joining_date: '2025-06-01',
    status: 'Active',
    notes: 'Event manager coordinating workshop schedules and speaker hospitality.'
  },
  {
    full_name: 'Rahul Kapoor',
    college_id: 'STIC-2025-012',
    email: 'rahul.kapoor@stic-club.org',
    phone: '+91 98234 56789',
    year: '1st Year',
    branch: 'Information Technology',
    position: 'Event Manager',
    department_id: deptMap['Event Coordinators'] || null,
    profile_photo: '/uploads/avatars/rep_avatar_12.png',
    joining_date: '2025-07-15',
    status: 'Active',
    notes: 'Event manager handling participant registration desks and certificates.'
  },
  {
    full_name: 'Meera Nambiar',
    college_id: 'STIC-2025-013',
    email: 'meera.n@stic-club.org',
    phone: '+91 98345 67890',
    year: '2nd Year',
    branch: 'Electronics & Communication',
    position: 'Club Member',
    department_id: deptMap['Social Media & Publicity'] || null,
    profile_photo: null,
    joining_date: '2025-08-10',
    status: 'Active',
    notes: 'Creates social media stories and campus flyer designs.'
  }
];

const insertMember = db.prepare(`
  INSERT INTO club_members 
  (full_name, college_id, email, phone, year, branch, position, department_id, profile_photo, joining_date, status, notes, is_demo, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'system')
`);

for (const m of demoMembers) {
  insertMember.run(
    m.full_name, m.college_id, m.email, m.phone, m.year, m.branch,
    m.position, m.department_id, m.profile_photo, m.joining_date, m.status, m.notes
  );
}

const count = db.prepare('SELECT COUNT(*) as cnt FROM club_members').get().cnt;
console.log('Successfully seeded database with total members:', count);
