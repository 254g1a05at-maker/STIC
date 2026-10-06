const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'stic.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency & integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    -- USERS (Admin / Leadership Accounts)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DEPARTMENTS
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      lead_member_id INTEGER,
      co_lead_member_id INTEGER,
      icon TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- CLUB MEMBERS
    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      college_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      year TEXT,
      branch TEXT,
      section TEXT,
      position TEXT DEFAULT 'Member',
      department_id INTEGER,
      profile_photo TEXT,
      joining_date DATE,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      is_demo INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    -- Add foreign key constraint link from departments to lead_member_id if possible
    -- Note: departments.lead_member_id references club_members(id) ON DELETE SET NULL

    -- PROGRAMS / EVENTS
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      program_date DATE NOT NULL,
      start_time TEXT,
      end_time TEXT,
      venue TEXT,
      program_type TEXT DEFAULT 'Workshop',
      description TEXT,
      participants_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Planned',
      poster_url TEXT,
      is_demo INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- PROGRAM COORDINATORS (Many-to-Many between Programs & Club Members)
    CREATE TABLE IF NOT EXISTS program_coordinators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      role_title TEXT DEFAULT 'Coordinator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES club_members(id) ON DELETE CASCADE,
      UNIQUE(program_id, member_id)
    );

    -- PROGRAM PHOTOS
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      caption TEXT,
      photo_url TEXT NOT NULL,
      file_name TEXT,
      uploaded_by TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    -- PROGRAM VIDEOS
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      video_type TEXT DEFAULT 'link', -- 'file' or 'link'
      uploaded_by TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    -- CONTENT & DOCUMENTATION (Global & Program-level)
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      file_type TEXT,
      category TEXT DEFAULT 'Report',
      uploaded_by TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    -- FINANCE TRANSACTIONS
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_code TEXT UNIQUE NOT NULL,
      program_id INTEGER,
      type TEXT NOT NULL, -- 'Income' or 'Expense'
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      payment_method TEXT DEFAULT 'UPI',
      source_vendor TEXT,
      receipt_url TEXT,
      notes TEXT,
      added_by TEXT,
      is_demo INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
    );

    -- SPONSORSHIP MANAGEMENT
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      sponsor_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      amount REAL NOT NULL DEFAULT 0,
      sponsorship_date DATE NOT NULL,
      sponsorship_type TEXT DEFAULT 'Gold Sponsor',
      agreement_url TEXT,
      notes TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
    );

    -- SOCIAL MEDIA & PUBLICITY POSTS (Instagram Sync + Archive)
    CREATE TABLE IF NOT EXISTS social_media_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER,
      platform TEXT NOT NULL DEFAULT 'Instagram', -- 'Instagram', 'YouTube', 'LinkedIn', 'Facebook', 'Other'
      post_type TEXT DEFAULT 'Post', -- 'Post', 'Reel', 'Video', 'Article'
      post_url TEXT NOT NULL,
      caption TEXT,
      poster_url TEXT,
      publication_date DATE,
      posted_by TEXT,
      is_demo INTEGER DEFAULT 0,
      instagram_media_id TEXT UNIQUE,
      media_type TEXT,
      thumbnail_url TEXT,
      permalink TEXT,
      published_at TEXT,
      published_at_ist TEXT,
      sync_status TEXT DEFAULT 'synced',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    -- OFFICIAL STIC LINKS (Manageable Club Social & Web Links)
    CREATE TABLE IF NOT EXISTS official_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Globe',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SETTINGS (Key-Value)
    CREATE TABLE IF NOT EXISTS club_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ROLE PERMISSIONS (For STIC Website Handler & Configurable Access)
    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT PRIMARY KEY,
      permissions_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- WEBSITE ANNOUNCEMENTS (Notices, Banners & Updates Displayed on Website)
    CREATE TABLE IF NOT EXISTS website_announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Announcement',
      priority TEXT DEFAULT 'normal',
      link_url TEXT,
      link_label TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_by TEXT DEFAULT 'STIC Website Handler',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- CONTENT & DOCUMENTATION TEMPLATES (STIC Template Generator)
    CREATE TABLE IF NOT EXISTS document_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Event Report',
      design_layout TEXT NOT NULL DEFAULT 'centered_report',
      header_title TEXT NOT NULL DEFAULT 'EVENT REPORT',
      header_subtitle TEXT DEFAULT 'CSE – STIC · Innovate • Sustain • Impact',
      show_logo INTEGER DEFAULT 1,
      logo_align TEXT DEFAULT 'center',
      show_date INTEGER DEFAULT 1,
      default_date_label TEXT DEFAULT 'Date:',
      show_recipient INTEGER DEFAULT 1,
      default_recipient TEXT DEFAULT '',
      show_subject INTEGER DEFAULT 1,
      default_subject TEXT DEFAULT '',
      default_matter TEXT DEFAULT '',
      show_signature INTEGER DEFAULT 1,
      signature_salutation TEXT DEFAULT 'Regards,',
      signature_name TEXT DEFAULT 'CSE – STIC',
      signature_title TEXT DEFAULT 'Sustainable Technology & Innovation Club',
      footer_text TEXT DEFAULT 'CSE – STIC · Department of Computer Science & Engineering · Innovate • Sustain • Impact',
      is_default INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- CUSTOM USER UPLOADED TEMPLATES (Docx, Pptx, Pdf)
    CREATE TABLE IF NOT EXISTS custom_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      detected_placeholders TEXT DEFAULT '[]',
      category TEXT DEFAULT 'Custom Template',
      description TEXT,
      created_by TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AUDIT LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ACTIVITY LOGS (Persistent, Immutable, Real Indian Standard Time)
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      user_name TEXT,
      department TEXT NOT NULL,
      action TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      log_date TEXT NOT NULL,
      log_time TEXT NOT NULL,
      timestamp_ist TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_activity_logs_id_desc ON activity_logs(id DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_role ON activity_logs(role);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_department ON activity_logs(department);
  `);

  // Migrate users table if avatar_url column is missing
  try {
    const userCols = db.prepare("PRAGMA table_info(users)").all();
    if (!userCols.some(c => c.name === 'avatar_url')) {
      db.prepare("ALTER TABLE users ADD COLUMN avatar_url TEXT").run();
      console.log('[DB] Added avatar_url column to users table');
    }
  } catch (e) {
    console.error('Error migrating users.avatar_url:', e);
  }

  // Migrate transactions table if notes column missing
  try {
    db.exec("ALTER TABLE transactions ADD COLUMN notes TEXT;");
  } catch (e) {
    // Column already exists
  }

  // Migrate club_members table if section column is missing
  try {
    const memberCols = db.prepare("PRAGMA table_info(club_members)").all();
    if (!memberCols.some(c => c.name === 'section')) {
      db.prepare("ALTER TABLE club_members ADD COLUMN section TEXT").run();
      console.log('[DB] Added section column to club_members table');
    }
  } catch (e) {
    console.error('Error migrating club_members.section:', e);
  }

  // Backfill section from notes if not set
  try {
    db.prepare(`
      UPDATE club_members 
      SET section = TRIM(SUBSTR(notes, 10)) 
      WHERE notes LIKE 'Section: %' AND (section IS NULL OR section = '')
    `).run();
  } catch (e) {}

  // Migrate social_media_posts table for Instagram Sync fields
  const socialColumns = [
    "ALTER TABLE social_media_posts ADD COLUMN instagram_media_id TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN media_type TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN thumbnail_url TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN permalink TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN published_at TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN published_at_ist TEXT;",
    "ALTER TABLE social_media_posts ADD COLUMN sync_status TEXT DEFAULT 'synced';",
    "ALTER TABLE social_media_posts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;"
  ];
  socialColumns.forEach(cmd => {
    try { db.exec(cmd); } catch (e) {}
  });
  try {
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_social_media_posts_ig_id ON social_media_posts(instagram_media_id);");
    db.exec("CREATE INDEX IF NOT EXISTS idx_social_media_posts_published ON social_media_posts(published_at DESC);");
  } catch (e) {}

  // Seed default templates if empty
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM document_templates').get().count;
  if (templateCount === 0) {
    const insertTpl = db.prepare(`
      INSERT INTO document_templates (
        name, type, design_layout, header_title, header_subtitle,
        show_logo, logo_align, show_date, default_date_label,
        show_recipient, default_recipient, show_subject, default_subject,
        default_matter, show_signature, signature_salutation, signature_name, signature_title,
        footer_text, is_default, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'admin')
    `);

    insertTpl.run(
      'Official Event Report',
      'Event Report',
      'centered_report',
      'EVENT REPORT',
      'CSE – STIC · Innovate • Sustain • Impact',
      1,
      'center',
      1,
      'Date:',
      1,
      'To,\nThe Faculty Advisor / Head of Department,\nDepartment of Computer Science & Engineering,\nCollege Campus',
      1,
      'Subject: Official Event Completion Report & Documentation',
      'The Sustainable Technology & Innovation Club (STIC) successfully organized an interactive workshop on 25 September 2026 at the college seminar hall.\n\nA total of 120 students and faculty members participated in the hands-on session. Key highlights included real-time demonstrations of energy-efficient computing models, project presentations by student teams, and an open green innovation challenge.\n\nThe workshop concluded with positive participant feedback and an agreement to initiate new student-led sustainable computing projects under STIC.',
      1,
      'Thank you.\n\nRegards,',
      'CSE – STIC',
      'Sustainable Technology & Innovation Club',
      'CSE – STIC · Department of Computer Science & Engineering · Innovate • Sustain • Impact'
    );

    insertTpl.run(
      'Sponsorship Proposal Letter',
      'Sponsorship Proposal',
      'formal_letterhead',
      'SPONSORSHIP & PARTNERSHIP PROPOSAL',
      'CSE – STIC · Innovate • Sustain • Impact',
      1,
      'left',
      1,
      'Date:',
      1,
      'To,\nThe CSR / Sponsorship Committee,\nPartner Industry Organization',
      1,
      'Subject: Request for Official Sponsorship & Industry Partnership',
      'Dear Sir/Madam,\n\nOn behalf of the Sustainable Technology & Innovation Club (CSE – STIC), we are pleased to invite your esteemed organization to partner with us as an Official Sponsor for our upcoming flagship technical symposium.\n\nOur club brings together over 500+ aspiring engineers and innovators focusing on clean technology, smart IoT systems, and green computing. Your support will directly empower student hackathons, prototype development, and technical prizes.\n\nWe offer comprehensive branding across all banners, digital media, official certificates, and event stage promotions as outlined in our sponsorship tiers.',
      1,
      'Looking forward to your favorable response.\n\nWarm regards,',
      'Rohan Mehra',
      'Treasurer & Sponsorship Head, CSE – STIC',
      'CSE – STIC · Department of Computer Science & Engineering · Contact: sponsors@stic-club.org'
    );

    insertTpl.run(
      'College Permission Request',
      'Permission Request',
      'formal_letterhead',
      'APPLICATION FOR EVENT PERMISSION & VENUE REQUISITION',
      'CSE – STIC · Sustainable Technology & Innovation Club',
      1,
      'center',
      1,
      'Date:',
      1,
      'To,\nThe Principal / Head of Department (CSE),\nCollege of Engineering',
      1,
      'Subject: Requisition for Seminar Hall and Lab Facilities for STIC Workshop',
      'Respected Sir/Madam,\n\nWe, the student coordinators of CSE – STIC (Sustainable Technology & Innovation Club), respectfully request permission to conduct our upcoming hands-on technical workshop on campus.\n\nWe request the following facilities for smooth execution of the event:\n1. Main Seminar Hall / Auditorium from 9:00 AM to 5:00 PM\n2. Computing Laboratory with high-speed internet access for student teams\n3. Audio-visual projector setup\n\nFaculty coordinators have reviewed the schedule. We assure you that strict discipline and college decorum will be maintained throughout the event.',
      1,
      'Thanking you in anticipation.\n\nYours obediently,',
      'Vikram Singh',
      'Chief Event Coordinator, CSE – STIC',
      'CSE – STIC · Department of Computer Science & Engineering · Innovate • Sustain • Impact'
    );

    insertTpl.run(
      'Official Club Circular / Notice',
      'Notice / Circular',
      'modern_circular',
      'OFFICIAL CLUB CIRCULAR',
      'CSE – STIC · Circular Ref: STIC/2026/CIR-04',
      1,
      'center',
      1,
      'Date:',
      0,
      '',
      1,
      'Subject: General Body Meeting & Core Committee Induction 2026-27',
      'This is to inform all registered members and interested students of the Computer Science & Engineering Department that the Annual General Body Meeting and Core Team Induction of CSE – STIC will be held as per the details below:\n\n• Date: Friday, October 2, 2026\n• Time: 3:30 PM – 5:00 PM\n• Venue: Seminar Hall 2 (Block B)\n\nAgenda:\n1. Review of past semester projects and achievements\n2. Announcement of upcoming workshops and hackathons\n3. Selection process for Department Leads (Technical, Research, Media, Events, PR)\n\nAttendance is mandatory for all active members. Refreshments will be served.',
      1,
      'By Order,\n\nBest Regards,',
      'Aarav Sharma & Vikram Singh',
      'Core Committee, CSE – STIC',
      'CSE – STIC · Notice Board & Portal · Innovate • Sustain • Impact'
    );

    console.log('[DB] 4 Official STIC Document Templates initialized.');
  }

  // Seed default official links if empty
  const linkCount = db.prepare('SELECT COUNT(*) as count FROM official_links').get().count;
  if (linkCount === 0) {
    const insertLink = db.prepare(`
      INSERT INTO official_links (platform_name, url, description, icon, display_order, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, 'admin')
    `);

    insertLink.run(
      'Instagram',
      'https://instagram.com/stic_club_official',
      'Official STIC handle for campus events, live updates, stories, and green tech showcases.',
      'Instagram',
      1
    );

    insertLink.run(
      'WhatsApp Community',
      'https://chat.whatsapp.com/invite/stic_official_community',
      'Official club WhatsApp community channel for rapid member announcements, discussions, and event links.',
      'WhatsApp',
      2
    );

    insertLink.run(
      'LinkedIn',
      'https://linkedin.com/company/stic-club-official',
      'Professional network, research articles, faculty collaborations, and corporate industry partnerships.',
      'Linkedin',
      3
    );

    insertLink.run(
      'GitHub Organization',
      'https://github.com/stic-club-projects',
      'Open-source student repositories, green computing projects, IoT firmware, and software tools.',
      'Github',
      4
    );

    insertLink.run(
      'YouTube Channel',
      'https://youtube.com/@stic_innovations',
      'Keynote tech talks, green project video demos, hackathon livestreams, and workshop recordings.',
      'Youtube',
      5
    );

    insertLink.run(
      'Facebook',
      'https://facebook.com/stic.club.official',
      'Community page for campus outreach, photo albums, and inter-collegiate event invitations.',
      'Facebook',
      6
    );

    insertLink.run(
      'College Official Portal',
      'https://college.edu/departments/cse/clubs/stic',
      'Institutional CSE department portal listing club charter, faculty advisors, and academic notifications.',
      'Globe',
      7
    );

    console.log('[DB] 7 Default Official STIC Links initialized.');
  }

  // Seed default admin if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin@123', salt);
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hash, 'STIC Administrator', 'admin@stic-club.org', 'superadmin');
    console.log('[DB] Default admin user initialized (admin / admin@123)');
  }

  // Seed or update the exact 12 official roles with password stic@1234
  const { OFFICIAL_ROLES, DEFAULT_HANDLER_PERMISSIONS } = require('./auth');
  for (const roleDef of OFFICIAL_ROLES) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(roleDef.defaultPassword, salt);
    const existingRole = db.prepare('SELECT id, role, password_hash FROM users WHERE role = ? OR username = ?').get(roleDef.role, roleDef.username);
    if (!existingRole) {
      db.prepare(`
        INSERT INTO users (username, password_hash, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(roleDef.username, hash, roleDef.full_name, roleDef.email, roleDef.role);
      console.log(`[DB] Initialized official role: ${roleDef.role} (${roleDef.defaultPassword})`);
    } else {
      // Update password_hash to stic@1234 and ensure role name matches
      db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE id = ?').run(hash, roleDef.role, existingRole.id);
    }
  }

  // Ensure all users have their Display Picture (DP) initialized
  try {
    const usersWithoutDp = db.prepare("SELECT id, role, username, avatar_url FROM users WHERE avatar_url IS NULL OR avatar_url = ''").all();
    for (const u of usersWithoutDp) {
      if (u.role === 'HOD' || u.username === 'HOD') {
        db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run('/hod_salute.png', u.id);
      } else {
        const member = db.prepare("SELECT profile_photo FROM club_members WHERE position = ? AND profile_photo IS NOT NULL AND profile_photo != ''").get(u.role);
        if (member && member.profile_photo) {
          db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(member.profile_photo, u.id);
        }
      }
    }
  } catch (err) {
    console.error('Error auto-linking initial user DPs:', err);
  }

  // Seed default permissions for STIC Website Handler if not present
  const existingPerms = db.prepare('SELECT permissions_json FROM role_permissions WHERE role = ?').get('STIC Website Handler');
  if (!existingPerms) {
    db.prepare('INSERT OR IGNORE INTO role_permissions (role, permissions_json) VALUES (?, ?)').run(
      'STIC Website Handler',
      JSON.stringify(DEFAULT_HANDLER_PERMISSIONS)
    );
    console.log('[DB] Initialized STIC Website Handler default permissions.');
  }

  // Seed default website announcements if empty
  const announcementCount = db.prepare('SELECT COUNT(*) as count FROM website_announcements').get().count;
  if (announcementCount === 0) {
    const initialAnnouncements = [
      {
        title: 'STIC Annual Induction Drive 2026',
        content: 'Applications are now open for student developers, green tech innovators, and researchers. Join the CSE-STIC core working groups!',
        category: 'Induction',
        priority: 'high',
        link_url: '#programs',
        link_label: 'View Details',
        display_order: 1
      },
      {
        title: 'GreenTech Hackathon 2026 Registrations Live',
        content: 'Participate in the flagship 36-hour sustainability hackathon with cash prizes worth ₹50,000 and direct incubation support.',
        category: 'Event Flash',
        priority: 'urgent',
        link_url: '#programs',
        link_label: 'Register Team',
        display_order: 2
      },
      {
        title: 'Solar Grid IoT Workshop Highlights & Gallery',
        content: 'High-resolution photo albums, video recap, and executive project summaries are now published on the official web portal.',
        category: 'Gallery Update',
        priority: 'normal',
        link_url: '#photos',
        link_label: 'Browse Photos',
        display_order: 3
      }
    ];

    const insertAnnouncement = db.prepare(`
      INSERT INTO website_announcements (title, content, category, priority, link_url, link_label, display_order, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'STIC Website Handler')
    `);
    for (const a of initialAnnouncements) {
      insertAnnouncement.run(a.title, a.content, a.category, a.priority, a.link_url, a.link_label, a.display_order);
    }
    console.log('[DB] 3 Default website announcements initialized.');
  }

  // Seed default club settings if not present
  const defaultSettings = [
    { key: 'club_name', value: 'STIC – Innovate. Sustain. Impact.' },
    { key: 'club_full_name', value: 'Sustainable Technology and Innovation Club' },
    { key: 'club_tagline', value: 'Innovate. Sustain. Impact.' },
    { key: 'club_description', value: 'A student-driven collegiate organization dedicated to pioneering sustainable technology, green engineering solutions, robotics, and social innovation for a cleaner planet.' },
    { key: 'college_name', value: 'National Institute of Technology & Engineering Sciences' },
    { key: 'club_email', value: 'contact@stic-club.org' },
    { key: 'club_phone', value: '+91 98765 43210' },
    { key: 'club_address', value: 'Innovation Lab 304, Tech Block B, Campus Green' },
    { key: 'academic_year', value: '2026-2027' }
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO club_settings (key, value) VALUES (?, ?)
  `);
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }

  // Seed default departments if empty
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (deptCount === 0) {
    const standardDepts = [
      { name: 'Content & Documentation', desc: 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.', icon: 'FileText' },
      { name: 'Finance & Sponsorship', desc: 'Manages budgets, track expenses, coordinates corporate sponsorships, audits grants, and maintains transparency.', icon: 'IndianRupee' },
      { name: 'Social Media & Publicity', desc: 'Builds brand presence, runs Instagram, YouTube, and LinkedIn campaigns, and designs promotional graphics.', icon: 'Share2' },
      { name: 'Technical & Infrastructure', desc: 'Builds club software infrastructure, web portal, systems, coding bootcamps, and technical architectures.', icon: 'Cpu' },
      { name: 'Event Coordinators', desc: 'Leads end-to-end logistics, campus outreach, stage management, volunteer delegation, and venue setup.', icon: 'CalendarCheck' },
      { name: 'Project & Innovation', desc: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.', icon: 'Lightbulb' }
    ];

    const insertDept = db.prepare(`
      INSERT INTO departments (name, description, icon, is_demo) VALUES (?, ?, ?, 0)
    `);
    for (const d of standardDepts) {
      insertDept.run(d.name, d.desc, d.icon);
    }
    console.log('[DB] Standard 6 departments initialized.');
  }

  // Ensure Project & Innovation department and co-leads for all departments
  ensureDepartmentsAndLeads(db);

  // Seed demo data if members table is empty
  seedInitialDemoData();
}

function seedInitialDemoData() {
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM club_members').get().count;
  if (memberCount > 0) return;

  console.log('[DB] Seeding initial sample demo data...');

  const depts = db.prepare('SELECT id, name FROM departments').all();
  const deptMap = {};
  depts.forEach(d => { deptMap[d.name] = d.id; });

  // 1. Five Demo Members
  const demoMembers = [
    {
      full_name: 'Aarav Sharma',
      college_id: 'STIC-2024-001',
      email: 'aarav.sharma@stic-club.org',
      phone: '+91 98111 22334',
      year: '4th Year',
      branch: 'Computer Science & Engineering',
      position: 'President & Tech Lead',
      department_id: deptMap['Technical & Innovation'] || null,
      joining_date: '2024-08-15',
      status: 'Active',
      notes: 'Leading smart campus solar monitoring prototype. Demo record.',
      is_demo: 1
    },
    {
      full_name: 'Ananya Deshmukh',
      college_id: 'STIC-2024-002',
      email: 'ananya.d@stic-club.org',
      phone: '+91 98222 33445',
      year: '3rd Year',
      branch: 'Environmental Engineering',
      position: 'Head of Content & Editorial',
      department_id: deptMap['Content & Documentation'] || null,
      joining_date: '2024-09-01',
      status: 'Active',
      notes: 'Lead editor for STIC Annual Green Report. Demo record.',
      is_demo: 1
    },
    {
      full_name: 'Rohan Mehra',
      college_id: 'STIC-2025-003',
      email: 'rohan.mehra@stic-club.org',
      phone: '+91 98333 44556',
      year: '3rd Year',
      branch: 'Mechanical Engineering',
      position: 'Treasurer & Sponsorship Head',
      department_id: deptMap['Finance & Sponsorship'] || null,
      joining_date: '2025-01-10',
      status: 'Active',
      notes: 'Secured CleanTech Corp associate sponsorship. Demo record.',
      is_demo: 1
    },
    {
      full_name: 'Pooja Iyer',
      college_id: 'STIC-2025-004',
      email: 'pooja.iyer@stic-club.org',
      phone: '+91 98444 55667',
      year: '2nd Year',
      branch: 'Electronics & Communication',
      position: 'Publicity & Socials Lead',
      department_id: deptMap['Social Media & Publicity'] || null,
      joining_date: '2025-02-05',
      status: 'Active',
      notes: 'Manages STIC Instagram reels and YouTube channel. Demo record.',
      is_demo: 1
    },
    {
      full_name: 'Vikram Singh',
      college_id: 'STIC-2025-005',
      email: 'vikram.singh@stic-club.org',
      phone: '+91 98555 66778',
      year: '3rd Year',
      branch: 'Civil & Infrastructure Engg',
      position: 'Chief Event Coordinator',
      department_id: deptMap['Event Coordinators'] || null,
      joining_date: '2025-02-12',
      status: 'Active',
      notes: 'Coordinated campus e-waste drive and seminar hall logistics. Demo record.',
      is_demo: 1
    }
  ];

  const insertMember = db.prepare(`
    INSERT INTO club_members 
    (full_name, college_id, email, phone, year, branch, position, department_id, joining_date, status, notes, is_demo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system')
  `);

  const memberIds = [];
  for (const m of demoMembers) {
    const res = insertMember.run(
      m.full_name, m.college_id, m.email, m.phone, m.year, m.branch,
      m.position, m.department_id, m.joining_date, m.status, m.notes, m.is_demo
    );
    memberIds.push(res.lastInsertRowid);
  }

  // Update department leads
  const updateDeptLead = db.prepare('UPDATE departments SET lead_member_id = ? WHERE id = ?');
  if (deptMap['Technical & Innovation'] && memberIds[0]) updateDeptLead.run(memberIds[0], deptMap['Technical & Innovation']);
  if (deptMap['Content & Documentation'] && memberIds[1]) updateDeptLead.run(memberIds[1], deptMap['Content & Documentation']);
  if (deptMap['Finance & Sponsorship'] && memberIds[2]) updateDeptLead.run(memberIds[2], deptMap['Finance & Sponsorship']);
  if (deptMap['Social Media & Publicity'] && memberIds[3]) updateDeptLead.run(memberIds[3], deptMap['Social Media & Publicity']);
  if (deptMap['Event Coordinators'] && memberIds[4]) updateDeptLead.run(memberIds[4], deptMap['Event Coordinators']);

  // 2. Two Demo Programs
  const insertProgram = db.prepare(`
    INSERT INTO programs 
    (program_code, name, program_date, start_time, end_time, venue, program_type, description, participants_count, status, is_demo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system')
  `);

  const prog1 = insertProgram.run(
    'STIC-2026-001',
    'STIC Sustainability & Circular Economy Workshop',
    '2026-09-24',
    '10:00 AM',
    '04:30 PM',
    'Auditorium Hall B & Innovation Quad',
    'Workshop',
    'Hands-on interactive workshop educating engineering students on circular material flows, electronic waste disassembly, life-cycle carbon tracking, and biodegradable alternatives.',
    120,
    'Completed',
    1
  );

  const prog2 = insertProgram.run(
    'STIC-2026-002',
    'GreenTech Campus Hackathon & Innovation Expo',
    '2026-10-18',
    '09:00 AM',
    '07:00 PM',
    'Central Computing & Tech Innovation Centre',
    'Hackathon',
    'A 24-hour national student hackathon to develop cutting-edge IoT, AI, and hardware prototypes solving urban sustainability, renewable energy storage, and campus waste management.',
    180,
    'Upcoming',
    1
  );

  const prog1Id = prog1.lastInsertRowid;
  const prog2Id = prog2.lastInsertRowid;

  // 3. Assign Coordinators
  const insertCoordinator = db.prepare(`
    INSERT INTO program_coordinators (program_id, member_id, role_title) VALUES (?, ?, ?)
  `);
  insertCoordinator.run(prog1Id, memberIds[4], 'Lead Event Coordinator');
  insertCoordinator.run(prog1Id, memberIds[1], 'Content & Documentation Coordinator');
  insertCoordinator.run(prog2Id, memberIds[0], 'Technical & Judging Director');
  insertCoordinator.run(prog2Id, memberIds[2], 'Finance & Logistics Coordinator');

  // 4. Photos for Program 1
  const insertPhoto = db.prepare(`
    INSERT INTO photos (program_id, caption, photo_url, file_name, uploaded_by, is_demo)
    VALUES (?, ?, ?, ?, 'admin', 1)
  `);
  insertPhoto.run(prog1Id, 'Inaugural address by Dr. K. Raman on Sustainable Engineering Systems', 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&w=800&q=80', 'workshop_inaugural.jpg');
  insertPhoto.run(prog1Id, 'Students assembling biodegradable sensor casings during the hands-on lab', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'sensor_prototyping.jpg');
  insertPhoto.run(prog1Id, 'STIC Core Organizing Committee group photograph with guest speakers', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', 'committee_group.jpg');

  // 5. Videos for Program 1 & 2
  const insertVideo = db.prepare(`
    INSERT INTO videos (program_id, title, description, video_url, video_type, uploaded_by, is_demo)
    VALUES (?, ?, ?, ?, ?, 'admin', 1)
  `);
  insertVideo.run(prog1Id, 'STIC Sustainability Workshop Highlights 2026', 'Official video recap capturing student interactions, keynote speeches, and prototype displays.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link');
  insertVideo.run(prog2Id, 'GreenTech Hackathon 2026 Teaser & Rulebook Walkthrough', 'Teaser trailer inviting collegiate teams across the nation to pitch sustainable innovations.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link');

  // 6. Documents for Program 1 & Club
  const insertDoc = db.prepare(`
    INSERT INTO documents (program_id, title, description, file_url, file_name, file_size, file_type, category, uploaded_by, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin', 1)
  `);
  insertDoc.run(prog1Id, 'STIC Sustainability Workshop Executive Summary & Report', 'Comprehensive 12-page documentation on participant feedback, outcomes, and research highlights.', '/uploads/documents/demo_workshop_report.pdf', 'STIC_Workshop_Report_2026.pdf', 2450000, 'pdf', 'Report');
  insertDoc.run(prog1Id, 'Official Participation Certificate Template 2026', 'Standard high-resolution vector certificate template issued to all 120 attendees.', '/uploads/documents/demo_certificate_template.pdf', 'STIC_Cert_Template.pdf', 1200000, 'pdf', 'Certificate');
  insertDoc.run(null, 'STIC Club Official Charter & Operational Guidelines 2026', 'Constitutional constitution, department bylaws, election procedures, and code of conduct.', '/uploads/documents/demo_club_charter.pdf', 'STIC_Charter_2026.pdf', 3800000, 'pdf', 'Documentation');

  // 7. Finance Transactions (Program 1 + Program 2 Demo)
  const insertTxn = db.prepare(`
    INSERT INTO transactions 
    (transaction_code, program_id, type, amount, category, description, date, payment_method, source_vendor, added_by, is_demo, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Rohan Mehra', 1, 'admin')
  `);

  // Program 1 Incomes: ₹27,000
  insertTxn.run('TXN-2026-001', prog1Id, 'Income', 10000, 'Registration', 'Attendee registration fees (100 students @ ₹100)', '2026-09-20', 'UPI', 'STIC Event Desk');
  insertTxn.run('TXN-2026-002', prog1Id, 'Income', 15000, 'Sponsorship', 'EcoTech Innovations Title Sponsorship Grant', '2026-09-21', 'Bank Transfer', 'EcoTech Solutions Pvt Ltd');
  insertTxn.run('TXN-2026-003', prog1Id, 'Income', 2000, 'Other', 'Alumni green innovation support contribution', '2026-09-22', 'Cash', 'Alumni Chapter');

  // Program 1 Expenses: ₹11,000 (Balance = ₹16,000)
  insertTxn.run('TXN-2026-004', prog1Id, 'Expense', 5000, 'Food', 'High tea, refreshments and lunch boxes for participants', '2026-09-24', 'UPI', 'Campus Cafeteria Caterers');
  insertTxn.run('TXN-2026-005', prog1Id, 'Expense', 2000, 'Printing', 'Eco-friendly recycled ID badges, banners, and event booklets', '2026-09-23', 'Cash', 'GreenPrint Press');
  insertTxn.run('TXN-2026-006', prog1Id, 'Expense', 1000, 'Certificates', 'Heavy textured parchment paper printing for certificates', '2026-09-24', 'UPI', 'Campus Xerox & Stationary');
  insertTxn.run('TXN-2026-007', prog1Id, 'Expense', 3000, 'Decoration', 'Living potted plant stage backdrops and biodegradable podium decor', '2026-09-23', 'UPI', 'City Eco Flora');

  // Program 2 Advance Income: ₹35,000
  insertTxn.run('TXN-2026-008', prog2Id, 'Income', 35000, 'Sponsorship', 'GreenGrid Energy Hackathon Sponsorship Cheque', '2026-09-25', 'Bank Transfer', 'GreenGrid Energy Systems');
  // Program 2 Early Expense: ₹4,500
  insertTxn.run('TXN-2026-009', prog2Id, 'Expense', 4500, 'Marketing', 'Promotional digital display hoardings and sticker packs', '2026-09-25', 'Online', 'FastPrint Media');

  // 8. Sponsors
  const insertSponsor = db.prepare(`
    INSERT INTO sponsors 
    (program_id, sponsor_name, contact_person, phone, email, amount, sponsorship_date, sponsorship_type, notes, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  insertSponsor.run(prog1Id, 'EcoTech Solutions Pvt Ltd', 'Mr. Sanjeev Kapoor', '+91 98760 11223', 'sponsorships@ecotech.in', 15000, '2026-09-21', 'Title Sponsor', 'Provided technical mentorship and sponsored 1st prize toolkit.');
  insertSponsor.run(prog2Id, 'GreenGrid Energy Systems', 'Ms. Shalini Nair', '+91 98760 99887', 'partnerships@greengrid.org', 35000, '2026-09-25', 'Gold Sponsor', 'Official hardware kit sponsor and keynote provider for Hackathon.');

  // 9. Social Media Posts
  const insertSocial = db.prepare(`
    INSERT INTO social_media_posts 
    (program_id, platform, post_type, post_url, caption, publication_date, posted_by, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, 'Pooja Iyer', 1)
  `);
  insertSocial.run(prog1Id, 'Instagram', 'Post', 'https://instagram.com/p/stic_sustainability_workshop_2026', '🌱 Over 120 innovators gathered at the STIC Sustainability Workshop! Swipe to see real solutions in action. #STIC #Sustainability #GreenTech', '2026-09-24');
  insertSocial.run(prog1Id, 'LinkedIn', 'Article', 'https://linkedin.com/posts/stic-club_circular-economy-workshop-2026', 'Excited to publish the key takeaways from our circular economy engineering workshop attended by over 120 students and faculty mentors.', '2026-09-25');
  insertSocial.run(prog2Id, 'Instagram', 'Reel', 'https://instagram.com/reel/stic_greentech_hackathon_teaser', '⚡ Registrations are LIVE for GreenTech Hackathon 2026! Cash prizes worth ₹50,000 up for grabs. Link in bio! 🚀', '2026-09-25');

  console.log('[DB] Sample demo data seeded successfully with full relationships.');
}

// Function to safely clear all demo records
function clearDemoData() {
  const deleteTxns = db.prepare('DELETE FROM transactions WHERE is_demo = 1');
  const deleteSponsors = db.prepare('DELETE FROM sponsors WHERE is_demo = 1');
  const deleteSocial = db.prepare('DELETE FROM social_media_posts WHERE is_demo = 1');
  const deleteDocs = db.prepare('DELETE FROM documents WHERE is_demo = 1');
  const deletePhotos = db.prepare('DELETE FROM photos WHERE is_demo = 1');
  const deleteVideos = db.prepare('DELETE FROM videos WHERE is_demo = 1');
  const deleteCoordinators = db.prepare('DELETE FROM program_coordinators WHERE program_id IN (SELECT id FROM programs WHERE is_demo = 1) OR member_id IN (SELECT id FROM club_members WHERE is_demo = 1)');
  const deletePrograms = db.prepare('DELETE FROM programs WHERE is_demo = 1');
  
  // Unset leads in departments if lead is demo
  db.prepare('UPDATE departments SET lead_member_id = NULL WHERE lead_member_id IN (SELECT id FROM club_members WHERE is_demo = 1)').run();
  
  const deleteMembers = db.prepare('DELETE FROM club_members WHERE is_demo = 1');

  const runAll = db.transaction(() => {
    const t = deleteTxns.run();
    const sp = deleteSponsors.run();
    const sc = deleteSocial.run();
    const d = deleteDocs.run();
    const ph = deletePhotos.run();
    const v = deleteVideos.run();
    const c = deleteCoordinators.run();
    const p = deletePrograms.run();
    const m = deleteMembers.run();

    return {
      transactions: t.changes,
      sponsors: sp.changes,
      social: sc.changes,
      documents: d.changes,
      photos: ph.changes,
      videos: v.changes,
      coordinators: c.changes,
      programs: p.changes,
      members: m.changes
    };
  });

  return runAll();
}

function ensureDepartmentsAndLeads(database) {
  // 1. Ensure co_lead_member_id column exists
  try {
    const deptCols = database.prepare("PRAGMA table_info(departments)").all();
    if (!deptCols.some(c => c.name === 'co_lead_member_id')) {
      database.prepare("ALTER TABLE departments ADD COLUMN co_lead_member_id INTEGER REFERENCES club_members(id) ON DELETE SET NULL").run();
      console.log('[DB] Added co_lead_member_id column to departments table');
    }
  } catch (e) {
    console.error('Error migrating departments.co_lead_member_id:', e);
  }

  // 2. Rename 'Technical & Innovation' to 'Technical & Infrastructure' if present, to keep Technical and Project & Innovation distinct
  try {
    database.prepare(`
      UPDATE departments 
      SET name = 'Technical & Infrastructure', 
          description = 'Builds club software infrastructure, web portal, systems, coding bootcamps, and technical architectures.',
          icon = 'Cpu'
      WHERE name = 'Technical & Innovation'
    `).run();
  } catch (e) {}

  // 3. Ensure 'Project & Innovation' department exists
  try {
    const projectDept = database.prepare("SELECT * FROM departments WHERE name = 'Project & Innovation' OR name = 'Project and Innovation'").get();
    if (!projectDept) {
      database.prepare(`
        INSERT INTO departments (name, description, icon, is_demo)
        VALUES (
          'Project & Innovation',
          'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.',
          'Lightbulb',
          0
        )
      `).run();
      console.log('[DB] Created Project & Innovation department');
    }
  } catch (e) {
    console.error('Error creating Project & Innovation department:', e);
  }

  // 4. Map and configure leads & co-leads for all departments
  try {
    const allDepts = database.prepare('SELECT id, name FROM departments').all();
    const deptByName = {};
    allDepts.forEach(d => { deptByName[d.name] = d.id; });

    // Helper to find member by IDs or partial name/position
    const findMember = (conditions) => {
      for (const cond of conditions) {
        if (typeof cond === 'number') {
          const m = database.prepare('SELECT * FROM club_members WHERE id = ?').get(cond);
          if (m) return m;
        } else if (typeof cond === 'string') {
          const m = database.prepare('SELECT * FROM club_members WHERE full_name LIKE ? OR position LIKE ? LIMIT 1').get(`%${cond}%`, `%${cond}%`);
          if (m) return m;
        }
      }
      return null;
    };

    // Configuration of standard 6 departments with Lead and Co-Lead assignments
    const deptConfigs = [
      {
        deptNames: ['Content & Documentation'],
        leadCandidates: [12, 'Neha Verma', 'Content and Documentation Lead'],
        coLeadCandidates: [7, 'Ananya Deshmukh', 'Co-President'],
        leadPosition: 'Content and Documentation Lead',
        coLeadPosition: 'Content & Documentation Co-Lead',
        icon: 'FileText',
        desc: 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.'
      },
      {
        deptNames: ['Finance & Sponsorship'],
        leadCandidates: [14, 'Sneha Kulkarni', 'Finance Lead'],
        coLeadCandidates: [8, 'Rohan Mehra', 'Vice President'],
        leadPosition: 'Finance Lead',
        coLeadPosition: 'Finance Co-Lead',
        icon: 'IndianRupee',
        desc: 'Manages budgets, track expenses, coordinates corporate sponsorships, audits grants, and maintains transparency.'
      },
      {
        deptNames: ['Social Media & Publicity'],
        leadCandidates: [13, 'Siddharth Nair', 'Social Media Lead'],
        coLeadCandidates: [9, 'Pooja Iyer', 'Co-Vice President'],
        leadPosition: 'Social Media Lead',
        coLeadPosition: 'Social Media Co-Lead',
        icon: 'Share2',
        desc: 'Builds brand presence, runs Instagram, YouTube, and LinkedIn campaigns, and designs promotional graphics.'
      },
      {
        deptNames: ['Technical & Infrastructure', 'Technical & Innovation', 'Technical'],
        leadCandidates: [11, 'Kaviraj Patel', 'Technical Lead'],
        coLeadCandidates: [6, 'Aarav Sharma', 'President'],
        leadPosition: 'Technical Lead',
        coLeadPosition: 'Technical Co-Lead',
        icon: 'Cpu',
        desc: 'Builds club software infrastructure, systems, web tools, coding bootcamps, and technical architectures.'
      },
      {
        deptNames: ['Event Coordinators', 'Events & Operations', 'Event Management'],
        leadCandidates: [10, 'Vikram Singh', 'Secretary'],
        coLeadCandidates: [15, 'Aditya Varma', 'Event Manager'],
        leadPosition: 'Event Management Lead',
        coLeadPosition: 'Event Management Co-Lead',
        icon: 'CalendarCheck',
        desc: 'Leads end-to-end logistics, campus outreach, stage management, volunteer delegation, and venue setup.'
      },
      {
        deptNames: ['Project & Innovation', 'Project and Innovation'],
        leadCandidates: [16, 'Divya Reddy'],
        coLeadCandidates: [17, 'Rahul Kapoor'],
        leadPosition: 'Project & Innovation Lead',
        coLeadPosition: 'Project & Innovation Co-Lead',
        icon: 'Lightbulb',
        desc: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.'
      }
    ];

    for (const cfg of deptConfigs) {
      let deptId = null;
      for (const name of cfg.deptNames) {
        if (deptByName[name]) {
          deptId = deptByName[name];
          break;
        }
      }

      if (!deptId) continue;

      const lead = findMember(cfg.leadCandidates);
      const coLead = findMember(cfg.coLeadCandidates);

      database.prepare(`
        UPDATE departments 
        SET lead_member_id = ?,
            co_lead_member_id = ?,
            icon = COALESCE(icon, ?),
            description = COALESCE(description, ?)
        WHERE id = ?
      `).run(lead ? lead.id : null, coLead ? coLead.id : null, cfg.icon, cfg.desc, deptId);

      if (lead) {
        database.prepare('UPDATE club_members SET department_id = ?, position = ? WHERE id = ?').run(deptId, cfg.leadPosition, lead.id);
      }
      if (coLead) {
        database.prepare('UPDATE club_members SET department_id = ?, position = ? WHERE id = ?').run(deptId, cfg.coLeadPosition, coLead.id);
      }
    }

    // Assign some active members to Project & Innovation if it has few members
    const projDeptId = deptByName['Project & Innovation'] || deptByName['Project and Innovation'];
    if (projDeptId) {
      const projCount = database.prepare('SELECT COUNT(*) as count FROM club_members WHERE department_id = ?').get(projDeptId).count;
      if (projCount <= 2) {
        database.prepare(`
          UPDATE club_members 
          SET department_id = ? 
          WHERE id IN (
            SELECT id FROM club_members 
            WHERE department_id IS NULL 
            LIMIT 6
          )
        `).run(projDeptId);
        console.log('[DB] Allocated student members to Project & Innovation department roster.');
      }
    }
  } catch (err) {
    console.error('Error configuring department leads & co-leads:', err);
  }
}

module.exports = {
  db,
  initDb,
  clearDemoData,
  seedInitialDemoData,
  ensureDepartmentsAndLeads
};
