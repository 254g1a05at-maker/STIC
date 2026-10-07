import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Clock,
  X
} from 'lucide-react';
import { api } from '../api';

/**
 * Format date in Real Indian Standard Time (DD/MM/YYYY)
 */
function formatISTDate(entry) {
  if (entry.log_date && /^\d{2}\/\d{2}\/\d{4}$/.test(entry.log_date.trim())) {
    return entry.log_date.trim();
  }
  const dateVal = entry.created_at || entry.timestamp_ist;
  if (dateVal) {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const parts = formatter.formatToParts(d);
        const p = {};
        parts.forEach(({ type, value }) => { p[type] = value; });
        return `${p.day}/${p.month}/${p.year}`;
      }
    } catch (e) {
      // fallback
    }
  }
  return entry.log_date || '—';
}

/**
 * Format time in Real Indian Standard Time (HH:MM:SS AM/PM IST)
 */
function formatISTTime(entry) {
  let timeStr = (entry.log_time || '').trim();
  if (timeStr) {
    if (!timeStr.toUpperCase().endsWith('IST')) {
      timeStr = `${timeStr} IST`;
    }
    return timeStr;
  }
  const dateVal = entry.created_at || entry.timestamp_ist;
  if (dateVal) {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        const parts = formatter.formatToParts(d);
        const p = {};
        parts.forEach(({ type, value }) => { p[type] = value; });
        const period = (p.dayPeriod || '').toUpperCase();
        return `${p.hour}:${p.minute}:${p.second} ${period} IST`;
      }
    } catch (e) {
      // fallback
    }
  }
  return '—';
}

/**
 * Format department name cleanly
 */
function formatDepartment(dept) {
  if (!dept) return 'General';
  const d = dept.trim();
  if (d === 'Project & Innovation' || d === 'Project and Innovation') return 'Project & Innovation';
  if (d === 'Finance & Accounts') return 'Finance';
  if (d === 'Programs & Events') return 'Programs';
  if (d === 'Photos Gallery') return 'Photos';
  if (d === 'Videos Archive') return 'Videos';
  if (d === 'Content & Documentation') return 'Documentation';
  if (d === 'Settings & Security') return 'Settings';
  if (d === 'Social Media & Links') return 'Social Media';
  return d;
}

/**
 * Human-readable change formatter:
 * Strips raw JSON, technical database IDs, and generates clear, professional descriptions
 */
function formatWhatChanged(entry) {
  if (!entry) return 'Activity recorded';

  // 1. Check for structured differences between previous_value and new_value
  let prevObj = null;
  let newObj = null;
  try {
    if (entry.previous_value) {
      prevObj = typeof entry.previous_value === 'string' ? JSON.parse(entry.previous_value) : entry.previous_value;
    }
  } catch (e) {
    prevObj = null;
  }
  try {
    if (entry.new_value) {
      newObj = typeof entry.new_value === 'string' ? JSON.parse(entry.new_value) : entry.new_value;
    }
  } catch (e) {
    newObj = null;
  }

  if (prevObj && newObj && typeof prevObj === 'object' && typeof newObj === 'object') {
    // Check expense / amount
    const prevAmt = prevObj.amount !== undefined ? prevObj.amount : (prevObj.expense !== undefined ? prevObj.expense : null);
    const newAmt = newObj.amount !== undefined ? newObj.amount : (newObj.expense !== undefined ? newObj.expense : null);
    if (prevAmt !== null && newAmt !== null && prevAmt !== newAmt) {
      const prevFormatted = Number(prevAmt).toLocaleString('en-IN');
      const newFormatted = Number(newAmt).toLocaleString('en-IN');
      const cat = newObj.category || prevObj.category || 'event';
      return `Changed ${cat.toLowerCase()} expense from ₹${prevFormatted} to ₹${newFormatted}`;
    }

    // Check status
    if (prevObj.status && newObj.status && prevObj.status !== newObj.status) {
      const name = newObj.name || newObj.title || 'item';
      return `Changed status of "${name}" from ${prevObj.status} to ${newObj.status}`;
    }

    // Check program date
    if (prevObj.program_date && newObj.program_date && prevObj.program_date !== newObj.program_date) {
      const name = newObj.name || prevObj.name || 'program';
      return `Rescheduled "${name}" from ${prevObj.program_date} to ${newObj.program_date}`;
    }
  }

  let text = entry.change_summary || '';

  // 2. Handle empty or raw JSON change_summary
  if (!text || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        const title = parsed.title || parsed.name || parsed.full_name || parsed.description;
        if (title) {
          const act = (entry.action || '').toLowerCase();
          if (act === 'created') return `Added new ${entry.department || 'record'}: "${title}"`;
          if (act === 'deleted') return `Deleted ${entry.department || 'record'}: "${title}"`;
          return `Updated ${entry.department || 'record'}: "${title}"`;
        }
      }
    } catch (e) {
      // ignore
    }
    const act = (entry.action || '').toLowerCase();
    const dept = (entry.department || '').toLowerCase();
    if (dept.includes('member')) {
      return act === 'created' ? 'Added new club member' : (act === 'deleted' ? 'Deleted club member' : 'Updated club member details');
    }
    if (dept.includes('finance')) {
      return act === 'created' ? 'Recorded new finance transaction' : (act === 'deleted' ? 'Deleted finance transaction' : 'Updated transaction details');
    }
    if (dept.includes('program')) {
      return act === 'created' ? 'Created new program' : (act === 'deleted' ? 'Deleted program' : 'Updated program details');
    }
    if (dept.includes('sponsor')) {
      return act === 'created' ? 'Added new sponsor' : (act === 'deleted' ? 'Deleted sponsorship record' : 'Updated sponsor details');
    }
    if (dept.includes('announcement') || dept.includes('website')) {
      return act === 'created' ? 'Created website announcement' : (act === 'deleted' ? 'Deleted website announcement' : 'Updated website announcement');
    }
    return act === 'created' ? 'Created record' : (act === 'deleted' ? 'Deleted record' : 'Updated record');
  }

  // 3. Remove technical IDs & internal system codes
  text = text.replace(/\(Member ID:\s*\d+\)/gi, '');
  text = text.replace(/Member ID:\s*\d+/gi, '');
  text = text.replace(/\(ID:\s*\d+\)/gi, '');
  text = text.replace(/to program ID \d+/gi, 'to program');
  text = text.replace(/from program ID \d+/gi, 'from program');
  text = text.replace(/program ID \d+/gi, 'program');
  text = text.replace(/transaction ID \d+/gi, 'transaction');
  text = text.replace(/member ID \d+/gi, 'member');
  text = text.replace(/\(PRG-[A-Z0-9-]+\)/gi, '');
  text = text.replace(/\(TXN-[A-Z0-9-]+\)/gi, '');
  text = text.replace(/\(STU-[A-Z0-9-]+\)/gi, '');
  text = text.replace(/and associated records/gi, '');
  text = text.replace(/\\"/g, '"');

  // Polish login descriptions
  if (text.toLowerCase().startsWith('role [') && text.toLowerCase().includes('logged in')) {
    const roleMatch = text.match(/role \[([^\]]+)\]/i);
    if (roleMatch && roleMatch[1]) {
      return `Role ${roleMatch[1]} logged in successfully`;
    }
  }

  // Clean trailing punctuation or double spaces
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/–\s*$/, '').trim();
  text = text.replace(/-\s*$/, '').trim();

  return text;
}

/**
 * Action Badges: Green (Created), Blue (Updated), Red (Deleted)
 */
function renderActionBadge(action) {
  const act = (action || '').toLowerCase();
  if (act === 'created') {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.3px',
          background: '#064e3b',
          color: '#6ee7b7',
          border: '1px solid #10b981',
          textAlign: 'center',
          minWidth: '74px'
        }}
      >
        Created
      </span>
    );
  }
  if (act === 'deleted') {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.3px',
          background: '#7f1d1d',
          color: '#fca5a5',
          border: '1px solid #ef4444',
          textAlign: 'center',
          minWidth: '74px'
        }}
      >
        Deleted
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.3px',
        background: '#0c4a6e',
        color: '#7dd3fc',
        border: '1px solid #0284c7',
        textAlign: 'center',
        minWidth: '74px'
      }}
    >
      Updated
    </span>
  );
}

export default function ActivityLogView({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Available options
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableDepts, setAvailableDepts] = useState([]);

  // Live IST Clock
  const [currentIST, setCurrentIST] = useState('');

  useEffect(() => {
    const updateClock = () => {
      try {
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
        const parts = formatter.formatToParts(new Date());
        const p = {};
        parts.forEach(({ type, value }) => { p[type] = value; });
        const period = (p.dayPeriod || '').toUpperCase();
        setCurrentIST(`${p.day}/${p.month}/${p.year} | ${p.hour}:${p.minute}:${p.second} ${period} IST`);
      } catch (e) {
        setCurrentIST('');
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedRole !== 'all') params.role = selectedRole;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedAction !== 'all') params.action = selectedAction;
      if (selectedDate.trim()) params.date = selectedDate.trim();
      params.limit = 200;

      const res = await api.getActivityLogs(params);
      if (res && res.success) {
        setLogs(res.data || []);
        if (res.filters) {
          if (res.filters.roles && res.filters.roles.length > 0) {
            setAvailableRoles(res.filters.roles);
          }
          if (res.filters.departments && res.filters.departments.length > 0) {
            setAvailableDepts(res.filters.departments);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      if (!isSilent && showToast) {
        showToast('Failed to load activity log records.', 'error');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [search, selectedRole, selectedDept, selectedAction, selectedDate, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('all');
    setSelectedDept('all');
    setSelectedAction('all');
    setSelectedDate('');
  };

  const hasActiveFilters = Boolean(
    search ||
    selectedRole !== 'all' ||
    selectedDept !== 'all' ||
    selectedAction !== 'all' ||
    selectedDate
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <History size={26} color="#34d399" />
            Activity Log
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Live audit ledger of all changes across STIC in Indian Standard Time (IST)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Live IST Box */}
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: '#0f172a',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}
          >
            <Clock size={15} color="#34d399" />
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Live IST:</span>
            <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
              {currentIST || 'Loading IST...'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLogs(false)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '18px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'flex-end'
          }}
        >
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Search Activity
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search by keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  background: '#090e17',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Filter by Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                background: '#090e17',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            >
              <option value="all">All Roles</option>
              <option value="HOD">HOD</option>
              <option value="Coordinator 1">Coordinator 1</option>
              <option value="Coordinator 2">Coordinator 2</option>
              <option value="President">President</option>
              <option value="Vice President">Vice President</option>
              <option value="Co-Vice President">Co-Vice President</option>
              <option value="Secretary">Secretary</option>
              <option value="STIC Website Handler">STIC Website Handler</option>
              {availableRoles
                .filter(r => ![
                  'HOD', 'Coordinator 1', 'Coordinator 2', 'President',
                  'Vice President', 'Co-Vice President', 'Secretary', 'STIC Website Handler'
                ].includes(r))
                .map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                background: '#090e17',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            >
              <option value="all">All Departments</option>
              <option value="Project & Innovation">Project & Innovation</option>
              <option value="Finance & Accounts">Finance</option>
              <option value="Club Members">Club Members</option>
              <option value="Programs & Events">Programs</option>
              <option value="Photos Gallery">Photos</option>
              <option value="Videos Archive">Videos</option>
              <option value="Content & Documentation">Documentation</option>
              <option value="Sponsorships">Sponsorships</option>
              <option value="Social Media & Links">Social Media</option>
              <option value="Settings & Security">Settings</option>
              {availableDepts
                .filter(d => ![
                  'Finance & Accounts', 'Club Members', 'Programs & Events',
                  'Photos Gallery', 'Videos Archive',
                  'Content & Documentation', 'Sponsorships', 'Social Media & Links', 'Settings & Security'
                ].includes(d))
                .map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Filter by Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                background: '#090e17',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            >
              <option value="all">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Filter by Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="e.g. 27/09/2026"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                background: '#090e17',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  width: '100%',
                  height: '38px',
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <X size={14} /> Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Activity Log Table */}
      <div
        style={{
          background: '#0b1324',
          border: '1px solid #334155',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  background: '#1e293b',
                  borderBottom: '2px solid #475569'
                }}
              >
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                    width: '130px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  DATE
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                    width: '175px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  TIME (IST)
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                    width: '180px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ROLE
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                    width: '160px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  DEPARTMENT
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px',
                    width: '115px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ACTION
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  WHAT CHANGED
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <RefreshCw size={26} className="spin" color="#34d399" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                        Loading activity log from database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <History size={36} color="#64748b" />
                      <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>No Activity Records Found</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
                        {hasActiveFilters
                          ? 'No activities match the current filters.'
                          : 'Changes made by any role will automatically appear here in Indian Standard Time.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          style={{
                            marginTop: '10px',
                            background: '#1e293b',
                            color: '#ffffff',
                            border: '1px solid #475569',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((entry, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={entry.id}
                      style={{
                        background: isEven ? '#0b1324' : '#0f172a',
                        borderBottom: '1px solid #1e293b',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#172540'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? '#0b1324' : '#0f172a'; }}
                    >
                      {/* 1. DATE */}
                      <td
                        style={{
                          padding: '14px 16px',
                          whiteSpace: 'nowrap',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        {formatISTDate(entry)}
                      </td>

                      {/* 2. TIME (IST) */}
                      <td
                        style={{
                          padding: '14px 16px',
                          whiteSpace: 'nowrap',
                          color: '#38bdf8',
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        {formatISTTime(entry)}
                      </td>

                      {/* 3. ROLE */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#1e293b',
                            color: '#ffffff',
                            border: '1px solid #475569',
                            padding: '3px 9px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          {entry.role || 'Member'}
                        </span>
                      </td>

                      {/* 4. DEPARTMENT */}
                      <td
                        style={{
                          padding: '14px 16px',
                          whiteSpace: 'nowrap',
                          color: '#f1f5f9',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        {formatDepartment(entry.department)}
                      </td>

                      {/* 5. ACTION */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {renderActionBadge(entry.action)}
                      </td>

                      {/* 6. WHAT CHANGED */}
                      <td
                        style={{
                          padding: '14px 16px',
                          color: '#ffffff',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          lineHeight: 1.5
                        }}
                      >
                        {formatWhatChanged(entry)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
