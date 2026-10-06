const fs = require('fs');
const dbModule = require('./server/db');
const db = dbModule.db || dbModule;

let sql = '-- =========================================================\n';
sql += '-- STIC CLUB MANAGEMENT DATABASE SCHEMA FOR SUPABASE\n';
sql += '-- Copy and paste this script into your Supabase SQL Editor\n';
sql += '-- =========================================================\n\n';

sql += '-- 1. USERS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS users (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  username TEXT UNIQUE NOT NULL,\n';
sql += '  password_hash TEXT NOT NULL,\n';
sql += '  role TEXT UNIQUE NOT NULL,\n';
sql += '  full_name TEXT NOT NULL,\n';
sql += '  email TEXT NOT NULL,\n';
sql += '  avatar_url TEXT,\n';
sql += '  is_active BOOLEAN DEFAULT TRUE,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  updated_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- 2. DEPARTMENTS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS departments (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  name TEXT UNIQUE NOT NULL,\n';
sql += '  description TEXT,\n';
sql += '  lead_member_id BIGINT,\n';
sql += '  icon TEXT,\n';
sql += '  is_demo INT DEFAULT 0,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  updated_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- 3. CLUB MEMBERS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS club_members (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  full_name TEXT NOT NULL,\n';
sql += '  college_id TEXT UNIQUE NOT NULL,\n';
sql += '  email TEXT NOT NULL,\n';
sql += '  phone TEXT,\n';
sql += '  year TEXT DEFAULT \'2nd Year\',\n';
sql += '  branch TEXT,\n';
sql += '  section TEXT,\n';
sql += '  position TEXT DEFAULT \'Club Member\',\n';
sql += '  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,\n';
sql += '  profile_photo TEXT,\n';
sql += '  joining_date DATE DEFAULT CURRENT_DATE,\n';
sql += '  status TEXT DEFAULT \'Active\',\n';
sql += '  notes TEXT,\n';
sql += '  is_demo INT DEFAULT 0,\n';
sql += '  created_by TEXT,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  updated_by TEXT,\n';
sql += '  updated_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- 4. PROGRAMS / EVENTS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS programs (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  program_code TEXT UNIQUE NOT NULL,\n';
sql += '  name TEXT NOT NULL,\n';
sql += '  program_date DATE NOT NULL,\n';
sql += '  start_time TEXT,\n';
sql += '  end_time TEXT,\n';
sql += '  venue TEXT,\n';
sql += '  program_type TEXT DEFAULT \'Workshop\',\n';
sql += '  description TEXT,\n';
sql += '  participants_count INT DEFAULT 0,\n';
sql += '  status TEXT DEFAULT \'Planned\',\n';
sql += '  poster_url TEXT,\n';
sql += '  is_demo INT DEFAULT 0,\n';
sql += '  created_by TEXT,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  updated_by TEXT,\n';
sql += '  updated_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- 5. PROGRAM COORDINATORS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS program_coordinators (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  program_id BIGINT REFERENCES programs(id) ON DELETE CASCADE,\n';
sql += '  member_id BIGINT REFERENCES club_members(id) ON DELETE CASCADE,\n';
sql += '  role_title TEXT DEFAULT \'Coordinator\',\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  UNIQUE(program_id, member_id)\n';
sql += ');\n\n';

sql += '-- 6. TRANSACTIONS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS transactions (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  transaction_code TEXT UNIQUE NOT NULL,\n';
sql += '  program_id BIGINT REFERENCES programs(id) ON DELETE SET NULL,\n';
sql += '  type TEXT NOT NULL,\n';
sql += '  amount NUMERIC NOT NULL,\n';
sql += '  category TEXT NOT NULL,\n';
sql += '  description TEXT,\n';
sql += '  date DATE NOT NULL,\n';
sql += '  payment_method TEXT DEFAULT \'UPI\',\n';
sql += '  receipt_url TEXT,\n';
sql += '  created_by TEXT,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- 7. SPONSORS TABLE\n';
sql += 'CREATE TABLE IF NOT EXISTS sponsors (\n';
sql += '  id BIGSERIAL PRIMARY KEY,\n';
sql += '  name TEXT NOT NULL,\n';
sql += '  company_name TEXT,\n';
sql += '  tier TEXT DEFAULT \'Bronze\',\n';
sql += '  contact_person TEXT,\n';
sql += '  email TEXT,\n';
sql += '  phone TEXT,\n';
sql += '  amount NUMERIC DEFAULT 0,\n';
sql += '  logo_url TEXT,\n';
sql += '  website_url TEXT,\n';
sql += '  notes TEXT,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

// Seed users
sql += '-- =========================================================\n';
sql += '-- SEED DATA: OFFICIAL USERS\n';
sql += '-- =========================================================\n';
const users = db.prepare('SELECT * FROM users').all();
for (const u of users) {
  const avatarVal = u.avatar_url ? `'${u.avatar_url}'` : 'NULL';
  sql += `INSERT INTO users (username, password_hash, role, full_name, email, avatar_url)\n`;
  sql += `VALUES ('${u.username.replace(/'/g, "''")}', '${u.password_hash}', '${u.role.replace(/'/g, "''")}', '${u.full_name.replace(/'/g, "''")}', '${u.email}', ${avatarVal})\n`;
  sql += `ON CONFLICT (username) DO NOTHING;\n`;
}
sql += '\n';

// Seed departments
sql += '-- =========================================================\n';
sql += '-- SEED DATA: DEPARTMENTS\n';
sql += '-- =========================================================\n';
const depts = db.prepare('SELECT * FROM departments').all();
for (const d of depts) {
  sql += `INSERT INTO departments (id, name, description, icon)\n`;
  sql += `VALUES (${d.id}, '${d.name.replace(/'/g, "''")}', '${(d.description || '').replace(/'/g, "''")}', '${d.icon || ''}')\n`;
  sql += `ON CONFLICT (name) DO NOTHING;\n`;
}
sql += '\n';

// Seed club members
sql += '-- =========================================================\n';
sql += '-- SEED DATA: CLUB MEMBERS (ALL 74 MEMBERS + SECTIONS)\n';
sql += '-- =========================================================\n';
const members = db.prepare('SELECT * FROM club_members').all();
for (const m of members) {
  const phoneVal = m.phone ? `'${m.phone.replace(/'/g, "''")}'` : 'NULL';
  const branchVal = m.branch ? `'${m.branch.replace(/'/g, "''")}'` : 'NULL';
  const secVal = m.section ? `'${m.section.replace(/'/g, "''")}'` : 'NULL';
  const notesVal = m.notes ? `'${m.notes.replace(/'/g, "''")}'` : 'NULL';
  const posVal = m.position ? `'${m.position.replace(/'/g, "''")}'` : "'Club Member'";
  const deptVal = m.department_id ? m.department_id : 'NULL';

  sql += `INSERT INTO club_members (college_id, full_name, email, phone, year, branch, section, position, department_id, status, notes)\n`;
  sql += `VALUES ('${m.college_id.replace(/'/g, "''")}', '${m.full_name.replace(/'/g, "''")}', '${m.email.replace(/'/g, "''")}', ${phoneVal}, '${m.year || '2nd Year'}', ${branchVal}, ${secVal}, ${posVal}, ${deptVal}, '${m.status || 'Active'}', ${notesVal})\n`;
  sql += `ON CONFLICT (college_id) DO NOTHING;\n`;
}
sql += '\n';

// Enable RLS and public access policies
sql += '-- =========================================================\n';
sql += '-- ROW LEVEL SECURITY (RLS) POLICIES\n';
sql += '-- Enable public access for read & write so STIC portal works seamlessly\n';
sql += '-- =========================================================\n';
const allTableNames = ['users', 'departments', 'club_members', 'programs', 'program_coordinators', 'transactions', 'sponsors'];
for (const t of allTableNames) {
  sql += `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;\n`;
  sql += `DROP POLICY IF EXISTS "Enable all access for ${t}" ON ${t};\n`;
  sql += `CREATE POLICY "Enable all access for ${t}" ON ${t} FOR ALL USING (true) WITH CHECK (true);\n`;
}

fs.writeFileSync('supabase_schema.sql', sql, 'utf8');
console.log('SUCCESS! supabase_schema.sql generated. Total characters:', sql.length);
