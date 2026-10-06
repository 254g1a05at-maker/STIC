-- =========================================================
-- STIC CLUB MANAGEMENT DATABASE SCHEMA FOR SUPABASE
-- Copy and paste this script into your Supabase SQL Editor
-- =========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  lead_member_id BIGINT,
  co_lead_member_id BIGINT,
  icon TEXT,
  is_demo INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLUB MEMBERS TABLE
CREATE TABLE IF NOT EXISTS club_members (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  college_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  year TEXT DEFAULT '2nd Year',
  branch TEXT,
  section TEXT,
  position TEXT DEFAULT 'Club Member',
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  profile_photo TEXT,
  profile_photo_url TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  is_demo INT DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROGRAMS / EVENTS TABLE
CREATE TABLE IF NOT EXISTS programs (
  id BIGSERIAL PRIMARY KEY,
  program_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  program_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  program_type TEXT DEFAULT 'Workshop',
  description TEXT,
  participants_count INT DEFAULT 0,
  status TEXT DEFAULT 'Planned',
  poster_url TEXT,
  is_demo INT DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROGRAM COORDINATORS TABLE
CREATE TABLE IF NOT EXISTS program_coordinators (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT REFERENCES programs(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES club_members(id) ON DELETE CASCADE,
  role_title TEXT DEFAULT 'Coordinator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, member_id)
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_code TEXT UNIQUE NOT NULL,
  program_id BIGINT REFERENCES programs(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  payment_method TEXT DEFAULT 'UPI',
  receipt_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS sponsors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  tier TEXT DEFAULT 'Bronze',
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  amount NUMERIC DEFAULT 0,
  logo_url TEXT,
  website_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SEED DATA: OFFICIAL USERS
-- =========================================================
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('admin', '$2b$10$Ylxou4WEs8G2wZd/Hg6Tc.6d5tSj.BX2xOaEOuQPSyByu.OJLzHKS', 'superadmin', 'STIC Administrator', 'admin@stic-club.org', NULL)
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('HOD', '$2b$10$PVOb5xkCpemTHps9XkFHBezwJ5/yPy2g2EjFeY8kuoEtyb.0kkLbq', 'HOD', 'Head of Department (HOD)', 'hod@srit.ac.in', '/hod_salute.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Coordinator 1', '$2b$10$ABjd19.NMWf8QeaUPvVEB.BFTL/b44i7BzrPzDeIq6zKqFSIujYSq', 'Coordinator 1', 'Faculty Coordinator 1', 'coordinator1@stic-club.org', NULL)
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Coordinator 2', '$2b$10$U6dViNtJI9XOiLHgR1GqHeDFyRMCDgr1O56Wq3.tpSbPXgbEYTUQ.', 'Coordinator 2', 'Faculty Coordinator 2', 'coordinator2@stic-club.org', NULL)
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('President', '$2b$10$Ha/LIKVQlj7oat3nW5p/iuHtUzTOMjtDlnkIAiraN0g5j9SNop7VS', 'President', 'STIC Club President', 'president@stic-club.org', '/uploads/avatars/WhatsApp_Image_2026-09-26_at_12_14_04_AM-1790398575475-666308.jpeg')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Vice President', '$2b$10$c2s0O4UohSI2oTt6TFevB.MeTq1.RGD3NLSS6QXcMT8x/2Pn2XEp6', 'Vice President', 'STIC Vice President', 'vp@stic-club.org', '/uploads/avatars/rep_avatar_3.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Co-Vice President', '$2b$10$lNAdl/2n9YtHc3eWlZPFaOGZsY1kEaqQSMfsqKZpj09UciYZs7CVG', 'Co-Vice President', 'STIC Co-Vice President', 'covp@stic-club.org', '/uploads/avatars/rep_avatar_4.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Secretary', '$2b$10$omHqNOOzvBFE4tmz4GhAUOKgmzEUmcPfaqEGrF2pHo9T/OPydWXJi', 'Secretary', 'STIC General Secretary', 'secretary@stic-club.org', '/uploads/avatars/rep_avatar_5.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('STIC Website Handler', '$2b$10$X/o93dUDBlaze1aSXJOsyuSgBjsImOtMZ.qJ6hYiitwkBt9GmJgGe', 'STIC Website Handler', 'STIC Website Handler', 'webhandler@stic-club.org', NULL)
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Content and Documentation Lead', '$2b$10$DHyue9TyVwNLaOHW.5J13ezacnyN4hxqbtwrb5K5HEoV9g0L8hcwC', 'Content and Documentation Lead', 'Content & Documentation Lead', 'content.lead@stic-club.org', '/uploads/avatars/rep_avatar_7.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Social Media Lead', '$2b$10$Q2taA33ZqC51r/XT5/7L5OgEJUJkqOD3TrBQhInLlOWkePu163.Vy', 'Social Media Lead', 'Social Media & Outreach Lead', 'social.lead@stic-club.org', '/uploads/avatars/rep_avatar_8.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Technical Lead', '$2b$10$XGNEV1HS25P8Mp9nbGqvZuAB/lGc9QEgPLirAqq5eSh569j8jywlW', 'Technical Lead', 'Technical & Infrastructure Lead', 'tech.lead@stic-club.org', '/uploads/avatars/rep_avatar_6.png')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)
VALUES ('Finance Lead', '$2b$10$nsIG4ag8omku1dEcJiky8e2oX04b/C/HdSkLytROKtRW99umqvhZm', 'Finance Lead', 'Finance & Accounts Lead', 'finance.lead@stic-club.org', '/uploads/avatars/rep_avatar_9.png')
ON CONFLICT (username) DO NOTHING;

-- =========================================================
-- SEED DATA: DEPARTMENTS
-- =========================================================
INSERT INTO departments (id, name, description, icon)
VALUES (1, 'Content & Documentation', 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.', 'FileText')
ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (id, name, description, icon)
VALUES (2, 'Finance & Sponsorship', 'Manages budgets, track expenses, coordinates corporate sponsorships, audits grants, and maintains transparency.', 'IndianRupee')
ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (id, name, description, icon)
VALUES (3, 'Social Media & Publicity', 'Builds brand presence, runs Instagram, YouTube, and LinkedIn campaigns, and designs promotional graphics.', 'Share2')
ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (id, name, description, icon)
VALUES (4, 'Technical & Infrastructure', 'Builds club software infrastructure, systems, web tools, coding bootcamps, and technical architectures.', 'Cpu')
ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (id, name, description, icon)
VALUES (5, 'Event Coordinators', 'Leads end-to-end logistics, campus outreach, stage management, volunteer delegation, and venue setup.', 'CalendarCheck')
ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (id, name, description, icon)
VALUES (6, 'Project & Innovation', 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.', 'Lightbulb')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- SEED DATA: CLUB MEMBERS (ALL 74 MEMBERS + SECTIONS)
-- =========================================================
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2024-001', 'Aarav Sharma', 'aarav.sharma@stic-club.org', '+91 98111 22334', '4th Year', 'Computer Science & Engineering', NULL, 'President', 4, 'Active', '• Lead club; coordinate activities
• Plan semester schedule
• Conduct meetings
• Represent the club')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2024-002', 'Ananya Deshmukh', 'ananya.d@stic-club.org', '+91 98222 33445', '3rd Year', 'Environmental Engineering', NULL, 'Co-President', 1, 'Active', '• Support President
• Manage in absence
• Coordinate teams
• Ensure smooth execution')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-003', 'Rohan Mehra', 'rohan.mehra@stic-club.org', '+91 98333 44556', '3rd Year', 'Mechanical Engineering', NULL, 'Vice President', 2, 'Active', '• Lead club; coordinate activities
• Plan semester schedule
• Conduct meetings
• Represent the club')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-004', 'Pooja Iyer', 'pooja.iyer@stic-club.org', '+91 98444 55667', '2nd Year', 'Electronics & Communication', NULL, 'Co-Vice President', 3, 'Active', '• Support Vice President
• Manage in absence
• Coordinate teams
• Ensure smooth execution')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-005', 'Vikram Singh', 'vikram.singh@stic-club.org', '+91 98555 66778', '3rd Year', 'Civil & Infrastructure Engg', NULL, 'Secretary', 5, 'Active', '• Maintain minutes and attendance
• Prepare event reports and documentation
• Handle official communication
• Keep records and archives')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-006', 'Kaviraj Patel', 'kaviraj.patel@stic-club.org', '+91 98666 77889', '3rd Year', 'Computer Science & Engineering', NULL, 'Technical Lead', 4, 'Active', '• Conduct coding sessions / workshops
• Guide AI, Data, IoT, Cloud & Software projects
• Support hackathons and maintain resources')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-007', 'Neha Verma', 'neha.verma@stic-club.org', '+91 98777 88990', '4th Year', 'Information Technology', NULL, 'Content and Documentation Lead', 1, 'Active', '• Prepare event reports and documentation
• Maintain minutes, archives and publications
• Handle official club write-ups and editorial content')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-008', 'Siddharth Nair', 'siddharth.nair@stic-club.org', '+91 98888 99001', '2nd Year', 'Electrical & Electronics Engg', NULL, 'Social Media Lead', 3, 'Active', '• Digital branding, publicity & promotions
• Manage social media campaigns, reels and stories
• Maintain official photo & video public archives')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-009', 'Sneha Kulkarni', 'sneha.kulkarni@stic-club.org', '+91 98999 00112', '3rd Year', 'Computer Science & Engineering', NULL, 'Finance Lead', 2, 'Active', '• Manage club budgets, accounts and funds
• Track sponsorships and corporate partnerships
• Maintain income and expenditure ledgers')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-010', 'Aditya Varma', 'aditya.varma@stic-club.org', '+91 98000 11223', '3rd Year', 'Mechanical Engineering', NULL, 'Event Manager', 5, 'Active', '• Plan workshops, seminars and competitions
• Coordinate venue, registrations & volunteers
• Invite speakers and ensure smooth events')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-011', 'Divya Reddy', 'divya.reddy@stic-club.org', '+91 98123 45678', '2nd Year', 'Computer Science & Engineering', NULL, 'Event Manager', 5, 'Active', '• Plan workshops, seminars and competitions
• Coordinate venue, registrations & volunteers
• Invite speakers and ensure smooth events')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('STIC-2025-012', 'Rahul Kapoor', 'rahul.kapoor@stic-club.org', '+91 98234 56789', '1st Year', 'Information Technology', NULL, 'Event Manager', 5, 'Active', '• Plan workshops, seminars and competitions
• Coordinate venue, registrations & volunteers
• Invite speakers and ensure smooth events')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0517', 'Y. Akshaya', '254g1a0517@srit.ac.in', '9014620331', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0526', 'D. Anitha Krupa', '254g1a0526@srit.ac.in', '9989400310', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0541', 'Bharani Kumar Undra', '254G1A0541@srit.ac.in', '9392300975', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0550', 'D. Chand Naveed', '254G1A0550@srit.ac.in', '9491052753', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0552', 'Chandu B R', '254g1a0552@srit.ac.in', '6361911096', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0560', 'O. Deepika', '254g1a0560@srit.ac.in', '9182256041', '2nd Year', 'Computer Science & Engineering (CSE-A)', 'CSE-A', 'Club Member', NULL, 'Active', 'Section: CSE-A')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0575', 'Geethika A', '254G1A0575@srit.ac.in', '9014180293', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0577', 'Gireeshma D', '254g1a0577@srit.ac.in', '9493275145', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0579', 'B.S. Gousiya', '254g1a0579@srit.ac.in', '9515916520', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0580', 'N. Gousiya Hajira Nadba', '254g1a0580@srit.ac.in', '7981931598', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0581', 'D. Govardhan', '254g1a0581@srit.ac.in', '9392985012', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0588', 'V. Harika Reddy', '254g1a0588@srit.ac.in', '8639712596', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0590', 'Harish U', '254g1a0590@srit.ac.in', '9391924059', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0591', 'G. Harsha Vardhan', '254g1a0591@srit.ac.in', '7617643043', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0597', 'Harshitha K', '254g1a0597@srit.ac.in', '7396537469', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A0598', 'G.H. Hasana', '254g1a0598@srit.ac.in', '8790332226', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05A0', 'K.C. Kondappa', '254g1a05a0@srit.ac.in', '9550624318', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05A4', 'Himavarsha Palabandla', '254g1a05a4@srit.ac.in', '6304188476', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05B7', 'P. Jyoshika', '254g1a05b7@srit.ac.in', '6302500552', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05B9', 'S. Kanees Farida', '254g1a05b9@srit.ac.in', '8074340242', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05C4', 'Kavya S', '254g1a05c4@srit.ac.in', '8008801368', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05C8', 'K.V. Keerthi', '254g1a05c8@srit.ac.in', '9322365529', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05E0', 'S. Lavanya', '254g1a05e0@srit.ac.in', '7337508736', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05E4', 'J. Likhitha', '254g1a05e4@srit.ac.in', '9573498670', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05E6', 'Lohith S', '254g1a05e6@srit.ac.in', '9515968230', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05G5', 'Mary M', '254g1a05g5@srit.ac.in', '9059531487', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05H1', 'Akbarsab Mohammed Jaffer Sadiq', '254g1a05h1@srit.ac.in', '9391669255', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05H2', 'Shaik Mohammed Muheeb Muhiuddin', '254g1a05h2@srit.ac.in', '9866137776', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05H5', 'K. Mounika', '254g1a05h5@srit.ac.in', '9182693071', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('264G5A0515', 'Vellala Lingeswara Reddy', '264g5a0515@srit.ac.in', '9642692095', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('264G5A0519', 'K. Mohammad Yaseen', '264g5a0519@srit.ac.in', '6304209180', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('264G5A0520', 'Vankam Navaneeth', '264g5a0520@srit.ac.in', '9390083261', '2nd Year', 'Computer Science & Engineering (CSE-C)', 'CSE-C', 'Club Member', NULL, 'Active', 'Section: CSE-C')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05L5', 'Nikhila P', '254g1a05l5@srit.ac.in', '6303782580', '2nd Year', 'Computer Science & Engineering (CSE-D)', 'CSE-D', 'Club Member', NULL, 'Active', 'Section: CSE-D')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05M4', 'R. Parishreya', '254g1a05m4@srit.ac.in', '7675969478', '2nd Year', 'Computer Science & Engineering (CSE-D)', 'CSE-D', 'Club Member', NULL, 'Active', 'Section: CSE-D')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05N4', 'K. Poojitha Royal', '254g1a05n4@srit.ac.in', '8977661333', '2nd Year', 'Computer Science & Engineering (CSE-D)', 'CSE-D', 'Club Member', NULL, 'Active', 'Section: CSE-D')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05T0', 'Sai Charan Reddy Sankepalli', '254g1a05t0@srit.ac.in', '8074614684', '2nd Year', 'Computer Science & Engineering (CSE-E)', 'CSE-E', 'Club Member', NULL, 'Active', 'Section: CSE-E')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05T2', 'P. Sai Jahnavi', '254g1a05t2@srit.ac.in', '6301147996', '2nd Year', 'Computer Science & Engineering (CSE-E)', 'CSE-E', 'Club Member', NULL, 'Active', 'Section: CSE-E')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05T6', 'Kota Sai Venkata Sumanth Reddy', '254g1a05t6@srit.ac.in', '6304964717', '2nd Year', 'Computer Science & Engineering (CSE-E)', 'CSE-E', 'Club Member', NULL, 'Active', 'Section: CSE-E')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05V7', 'K. Shanwaz', '254g1a05v7@srit.ac.in', '7672035981', '2nd Year', 'Computer Science & Engineering (CSE-E)', 'CSE-E', 'Club Member', NULL, 'Active', 'Section: CSE-E')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AE', 'B. Uha', '254g1a05ae@srit.ac.in', '9515508598', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AH', 'Usha Sri M', '254g1a05ah@srit.ac.in', '9059299601', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AJ', 'G. Ushasri Sai', '254g1a05aj@srit.ac.in', NULL, '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AP', 'S. Zunaira', '254g1a05ap@srit.ac.in', '8500852026', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AQ', 'Varsha T', '254g1a05aq@srit.ac.in', '9398224099', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AT', 'D. Vazeer Aman', '254g1a05at@srit.ac.in', '9704925392', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AU', 'G. Veena', '254g1a05au@srit.ac.in', '8688592771', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AV', 'Venkata Greeshma Sakam', '254g1a05av@srit.ac.in', '6303417879', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AW', 'Srivalli Rupanagudi', '254g1a05aw@srit.ac.in', '7569593885', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AX', 'Tejaswi B', '254g1a05ax@srit.ac.in', '8341789249', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BB', 'G. Vennela', '254g1a05bb@srit.ac.in', '9964721445', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BG', 'C. Vinitha Reddy', '254g1a05bg@srit.ac.in', '9392772854', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BR', 'Vyshnavi M', '254g1a05br@srit.ac.in', '6303893810', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BW', 'Yaswanth Sai Teja Sake', 'sakeyaswanth633@gmail.com', '9849385578', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BX', 'Yashwitha A', '254g1a05bx@srit.ac.in', NULL, '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BZ', 'D. Yuva Sri', '254g1a05bz@srit.ac.in', '9381609973', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05CA', 'Devzai Zuha', '254g1a05ca@srit.ac.in', '6302254708', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05Z4', 'G. Tejaswini', '254g1a05z4@srit.ac.in', '9100016227', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05Z7', 'G. Thanuja', '254g1a05z7@srit.ac.in', '6281538149', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05Z9', 'U. Thanusree', '254g1a05z9@srit.ac.in', '9281018735', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('264G5A0534', 'P. Sai Venkata Krutheek', '264g5a0534@srit.ac.in', '7601060569', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05BJ', 'S. Vinuthana Sri', '254g1a05bj@srit.ac.in', '9014598388', '2nd Year', 'Computer Science & Engineering (CSE-B)', 'CSE-B', 'Club Member', NULL, 'Active', 'Section: CSE-B')
ON CONFLICT (college_id) DO NOTHING;
INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)
VALUES ('254G1A05AY', 'venkata sai nihas P', '254g1a05ay@gmail.com', '9492655062', '2nd Year', 'Computer Science & Engineering (CSE-F)', 'CSE-F', 'Club Member', NULL, 'Active', 'Section: CSE-F')
ON CONFLICT (college_id) DO NOTHING;

-- Seed existing programs
INSERT INTO programs (program_code, name, program_date, start_time, end_time, venue, program_type, description, participants_count, status, is_demo, created_by)
VALUES ('STIC-2026-001', 'SUSTAINATHON', '2026-09-22', '10:30 AM', '04:30 PM', 'B - block seminar hall', 'Hackathon', 'STIC Sustainability & Circular Economy Hackathon', 40, 'Completed', 0, 'HOD')
ON CONFLICT (program_code) DO NOTHING;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable public access for read & write so STIC portal works seamlessly
-- =========================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for users" ON users;
CREATE POLICY "Enable all access for users" ON users FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for departments" ON departments;
CREATE POLICY "Enable all access for departments" ON departments FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for club_members" ON club_members;
CREATE POLICY "Enable all access for club_members" ON club_members FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for programs" ON programs;
CREATE POLICY "Enable all access for programs" ON programs FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE program_coordinators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for program_coordinators" ON program_coordinators;
CREATE POLICY "Enable all access for program_coordinators" ON program_coordinators FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for transactions" ON transactions;
CREATE POLICY "Enable all access for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for sponsors" ON sponsors;
CREATE POLICY "Enable all access for sponsors" ON sponsors FOR ALL USING (true) WITH CHECK (true);
