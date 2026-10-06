const { db } = require('./db');

/**
 * Returns formatted Indian Standard Time (Asia/Kolkata, UTC+05:30)
 * Date format: DD/MM/YYYY
 * Time format: HH:MM:SS AM/PM IST
 */
function getISTTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const parts = formatter.formatToParts(d);
  const p = {};
  for (const item of parts) {
    p[item.type] = item.value;
  }
  const dateStr = `${p.day}/${p.month}/${p.year}`;
  const period = (p.dayPeriod || '').toUpperCase();
  const timeStr = `${p.hour}:${p.minute}:${p.second} ${period} IST`.trim();
  const fullStr = `${dateStr}, ${timeStr}`;
  return { dateStr, timeStr, fullStr };
}

/**
 * Automatically records an immutable activity entry to activity_logs with real IST time
 * @param {object|string} reqOrRole - express request object or role name string
 * @param {object} options - { department, action, change, previous_value, new_value }
 */
function logActivity(reqOrRole, options = {}) {
  try {
    let role = 'Admin';
    let userName = 'Administrator';

    if (reqOrRole) {
      if (reqOrRole.user) {
        role = reqOrRole.user.role || reqOrRole.user.username || 'Admin';
        userName = reqOrRole.user.full_name || reqOrRole.user.username || role;
      } else if (typeof reqOrRole === 'string') {
        role = reqOrRole;
        userName = reqOrRole;
      } else if (typeof reqOrRole === 'object') {
        role = reqOrRole.role || reqOrRole.username || 'Admin';
        userName = reqOrRole.full_name || reqOrRole.username || role;
      }
    }

    const department = options.department || 'General';

    // Standardize action to exactly 'Created', 'Updated', or 'Deleted'
    let action = options.action || 'Updated';
    const actionLower = String(action).toLowerCase();
    if (
      actionLower.includes('create') ||
      actionLower.includes('add') ||
      actionLower.includes('upload') ||
      actionLower.includes('insert') ||
      actionLower.includes('post') ||
      actionLower.includes('reset-demo')
    ) {
      action = 'Created';
    } else if (
      actionLower.includes('delete') ||
      actionLower.includes('remove') ||
      actionLower.includes('clear') ||
      actionLower.includes('purge')
    ) {
      action = 'Deleted';
    } else {
      action = 'Updated';
    }

    const changeSummary = options.change || options.description || 'Record modified';

    let prevStr = null;
    if (options.previous_value !== undefined && options.previous_value !== null) {
      prevStr = typeof options.previous_value === 'object'
        ? JSON.stringify(options.previous_value, null, 2)
        : String(options.previous_value);
    }

    let newStr = null;
    if (options.new_value !== undefined && options.new_value !== null) {
      newStr = typeof options.new_value === 'object'
        ? JSON.stringify(options.new_value, null, 2)
        : String(options.new_value);
    }

    const { dateStr, timeStr, fullStr } = getISTTimestamp(new Date());

    const stmt = db.prepare(`
      INSERT INTO activity_logs (
        role, user_name, department, action, change_summary,
        previous_value, new_value, log_date, log_time, timestamp_ist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      role,
      userName,
      department,
      action,
      changeSummary,
      prevStr,
      newStr,
      dateStr,
      timeStr,
      fullStr
    );
  } catch (err) {
    console.error('[ACTIVITY LOGGING ERROR]', err);
  }
}

/**
 * Backward compatibility with existing logAudit calls
 */
function logAudit(userIdOrReq, action, entityType, entityId, details) {
  try {
    let department = 'General';
    const ent = String(entityType || '').toLowerCase();
    if (ent.includes('member')) department = 'Club Members';
    else if (ent.includes('depart')) department = 'Departments & Teams';
    else if (ent.includes('program') || ent.includes('coord')) department = 'Programs & Events';
    else if (ent.includes('photo')) department = 'Photos Gallery';
    else if (ent.includes('video')) department = 'Videos Archive';
    else if (ent.includes('doc') || ent.includes('template')) department = 'Content & Documentation';
    else if (ent.includes('trans') || ent.includes('finan')) department = 'Finance & Accounts';
    else if (ent.includes('spon')) department = 'Sponsorships';
    else if (ent.includes('soci') || ent.includes('link')) department = 'Social Media & Links';
    else if (ent.includes('announ') || ent.includes('web')) department = 'Website & Announcements';
    else if (ent.includes('sett') || ent.includes('perm')) department = 'Settings & Security';

    let normAction = 'Updated';
    const act = String(action || '').toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('upload') || act.includes('insert') || act.includes('post')) {
      normAction = 'Created';
    } else if (act.includes('delete') || act.includes('remove') || act.includes('clear')) {
      normAction = 'Deleted';
    }

    const change = typeof details === 'string' ? details : (details ? JSON.stringify(details) : `${action} performed on ${entityType}`);

    logActivity(userIdOrReq, {
      department,
      action: normAction,
      change
    });
  } catch (e) {
    console.error('[AUDIT BRIDGING ERROR]', e);
  }
}

module.exports = {
  logActivity,
  logAudit,
  getISTTimestamp
};
