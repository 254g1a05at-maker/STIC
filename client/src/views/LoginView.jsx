import React, { useState } from 'react';
import { Lock, UserCheck, ArrowRight, Shield, AlertCircle, Sun, Moon, Globe, CheckCircle2 } from 'lucide-react';
import { api, authState } from '../api';
import ClubAnimationStudio from '../components/ClubAnimationStudio';
import ViewModeSwitch from '../components/ViewModeSwitch';

// 12 AVAILABLE ROLES
// 7 Club Representatives + 1 Dedicated Website Handler + 4 Working Committee Leads
const AVAILABLE_ROLES = [
  // --- 1. CLUB LEADERSHIP & REPRESENTATIVES ---
  {
    id: 'HOD',
    name: 'HOD',
    title: 'Head of Department',
    category: 'representative',
    badge: 'Club Representative (Position 1 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Department Head & Executive Leadership',
    emoji: '🫡',
    iconUrl: '/hod_salute.png'
  },
  {
    id: 'Coordinator 1',
    name: 'Coordinator 1',
    title: 'Faculty Coordinator 1',
    category: 'representative',
    badge: 'Club Representative (Position 2 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Faculty Coordinator – Technical & Innovation'
  },
  {
    id: 'Coordinator 2',
    name: 'Coordinator 2',
    title: 'Faculty Coordinator 2',
    category: 'representative',
    badge: 'Club Representative (Position 3 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Faculty Coordinator – Student Operations'
  },
  {
    id: 'President',
    name: 'President',
    title: 'STIC Club President',
    category: 'representative',
    badge: 'Club Representative (Position 4 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Chief Student Executive & Representative'
  },
  {
    id: 'Vice President',
    name: 'Vice President',
    title: 'STIC Vice President',
    category: 'representative',
    badge: 'Club Representative (Position 5 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Executive Council – Operations & Strategy'
  },
  {
    id: 'Co-Vice President',
    name: 'Co-Vice President',
    title: 'STIC Co-Vice President',
    category: 'representative',
    badge: 'Club Representative (Position 6 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Executive Council – Content & Media'
  },
  {
    id: 'Secretary',
    name: 'Secretary',
    title: 'STIC General Secretary',
    category: 'representative',
    badge: 'Club Representative (Position 7 of 7)',
    defaultPassword: 'stic@1234',
    description: 'Executive Council – Documentation & Logistics'
  },
  // --- 2. DEDICATED TECHNICAL ACCOUNT ---
  {
    id: 'STIC Website Handler',
    name: 'STIC Website Handler',
    title: 'STIC Technical & Website Handler',
    category: 'technical',
    badge: 'Dedicated Technical Account',
    defaultPassword: 'stic@1234',
    description: 'Technical & Website Management Role'
  },
  // --- 3. WORKING COMMITTEE DEPARTMENT LEADS ---
  {
    id: 'Content and Documentation Lead',
    name: 'Content and Documentation Lead',
    title: 'Content & Documentation Lead',
    category: 'lead',
    badge: 'Working Committee Lead · Restricted from Finance Section',
    defaultPassword: 'stic@1234',
    description: 'Editorial, Official Reports, Documents & Minutes'
  },
  {
    id: 'Social Media Lead',
    name: 'Social Media Lead',
    title: 'Social Media & Outreach Lead',
    category: 'lead',
    badge: 'Working Committee Lead · Restricted from Finance Section',
    defaultPassword: 'stic@1234',
    description: 'Digital Media, Campaigns, Photos & Video Archives'
  },
  {
    id: 'Technical Lead',
    name: 'Technical Lead',
    title: 'Technical & Infrastructure Lead',
    category: 'lead',
    badge: 'Working Committee Lead · Restricted from Finance Section',
    defaultPassword: 'stic@1234',
    description: 'Tech Infrastructure, Systems & Digital Solutions'
  },
  {
    id: 'Finance Lead',
    name: 'Finance Lead',
    title: 'Finance & Accounts Lead',
    category: 'finance_lead',
    badge: 'Working Committee Lead · Exclusive Finance Access',
    defaultPassword: 'stic@1234',
    description: 'Exclusive Management of Accounts, Incomes & Expenditures'
  }
];

export default function LoginView({
  onLoginSuccess,
  theme,
  onToggleTheme,
  onReplayIntro,
  viewMode,
  onToggleViewMode,
  isMobile
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedRoleObj = AVAILABLE_ROLES.find(r => r.name === selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select your role from the 12 available roles dropdown.');
      return;
    }
    if (!password) {
      setError(`Please enter your personal password for role "${selectedRole}".`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Authenticate selected role + password checked together
      const res = await api.login(selectedRole, password);
      if (res.token && res.user) {
        authState.setToken(res.token);
        authState.setUser(res.user);
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your role and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`split-login-container ${isMobile ? 'mobile-login-mode' : ''}`}>
      {/* ==================================================
          TOP CONTROL BAR: VIEW MODE SWITCH & THEME SWITCH
          ================================================== */}
      <div className="login-top-switch-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ViewModeSwitch
          viewMode={viewMode}
          onToggleViewMode={onToggleViewMode}
          compact={isMobile}
        />

        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-switch-pill"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Background`}
        >
          <span className={`theme-pill-option ${theme === 'light' ? 'active' : ''}`}>
            <Sun size={14} color={theme === 'light' ? '#ffffff' : '#fbbf24'} />
            {!isMobile && <span>Light</span>}
          </span>
          <span className={`theme-pill-option ${theme === 'dark' ? 'active' : ''}`}>
            <Moon size={14} color={theme === 'dark' ? '#ffffff' : '#38bdf8'} />
            {!isMobile && <span>Dark</span>}
          </span>
        </button>
      </div>

      {/* ==================================================
          LOGIN FORM WITH 12 ROLES DROPDOWN
          ================================================== */}
      <div
        className="split-login-left"
        style={{
          flex: isMobile ? '1 1 100%' : '0 0 420px',
          maxWidth: isMobile ? '100%' : '420px',
          width: isMobile ? '100%' : 'auto',
          padding: isMobile ? '20px 16px 36px' : '24px 8px 24px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          className="split-login-card"
          style={{
            maxWidth: isMobile ? '400px' : '388px',
            width: '100%',
            padding: isMobile ? '24px 20px' : '28px 26px',
            borderRadius: '22px',
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.62)',
            border: theme === 'light' ? '1px solid rgba(226, 232, 240, 0.95)' : '1px solid rgba(51, 65, 85, 0.65)',
            boxShadow: theme === 'light' ? '0 20px 50px rgba(15, 23, 42, 0.06)' : '0 20px 50px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(14px)'
          }}
        >
          {/* Mobile Header Banner with Logo */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1.5px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '6px'
                }}
              >
                <img
                  src="/stic_logo.png"
                  alt="CSE – STIC Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                CSE – STIC
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, margin: '2px 0 0' }}>
                Innovate • Sustain • Impact
              </p>
            </div>
          )}
          {/* Header Title */}
          <div style={{ marginBottom: '26px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '4px 12px',
                borderRadius: '999px',
                color: '#34d399',
                fontSize: '0.74rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '14px'
              }}
            >
              <Shield size={13} />
              <span>STIC MEMBER LOGIN · 12 OFFICIAL ROLES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <img
                src="/stic_logo.png"
                alt="STIC Logo"
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.35))'
                }}
              />
              <h1 className="split-login-title" style={{ margin: 0, fontSize: '1.75rem' }}>MEMBER LOGIN</h1>
            </div>
            <p className="split-login-subtitle" style={{ fontSize: '0.88rem', margin: 0 }}>
              Select your role from the dropdown below and enter your personal role password.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                lineHeight: 1.45
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, color: '#fb7185' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Real Authentication Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Role Dropdown Field - 12 ROLES */}
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2px'
                }}
              >
                <span>Select Your Role</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>
                  12 Official Roles
                </span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <UserCheck size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                <select
                  id="roleSelect"
                  className="form-input"
                  style={{
                    paddingLeft: '44px',
                    paddingRight: '36px',
                    height: '50px',
                    fontSize: '0.94rem',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    borderColor: selectedRole ? 'var(--primary)' : 'var(--border-subtle)',
                    color: selectedRole ? 'var(--text-main)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    fontWeight: selectedRole ? 600 : 500
                  }}
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setError('');
                  }}
                  autoFocus
                >
                  <option value="" disabled style={{ background: 'var(--bg-surface)', color: 'var(--text-subtle)' }}>
                    -- Select Role (Choose 1 of 12 Roles) --
                  </option>
                  <optgroup label="Club Representatives & Leadership" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    {AVAILABLE_ROLES.filter(r => r.category === 'representative').map((role) => (
                      <option key={role.name} value={role.name} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '8px' }}>
                        {role.id === 'HOD' ? '🫡 HOD' : role.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Dedicated Technical Handler" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    {AVAILABLE_ROLES.filter(r => r.category === 'technical').map((role) => (
                      <option key={role.name} value={role.name} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '8px' }}>
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Working Committee Department Leads" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    {AVAILABLE_ROLES.filter(r => r.category === 'lead' || r.category === 'finance_lead').map((role) => (
                      <option key={role.name} value={role.name} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '8px' }}>
                        {role.name} {role.category === 'lead' ? '(Finance Restricted)' : '(Finance Access)'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Role Designation Badge Info */}
            {selectedRoleObj && (
              <div
                style={{
                  background: selectedRoleObj.id === 'HOD'
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.14) 0%, rgba(16, 185, 129, 0.10) 100%)'
                    : selectedRoleObj.category === 'technical'
                    ? 'var(--accent-cyan-soft)'
                    : selectedRoleObj.category === 'finance_lead'
                    ? 'var(--accent-amber-soft)'
                    : selectedRoleObj.category === 'lead'
                    ? 'var(--accent-rose-soft)'
                    : 'var(--primary-soft)',
                  border: `1px solid ${
                    selectedRoleObj.id === 'HOD'
                      ? 'rgba(234, 179, 8, 0.45)'
                      : selectedRoleObj.category === 'technical'
                      ? 'rgba(14, 165, 233, 0.35)'
                      : selectedRoleObj.category === 'finance_lead'
                      ? 'rgba(234, 179, 8, 0.35)'
                      : selectedRoleObj.category === 'lead'
                      ? 'rgba(244, 63, 94, 0.35)'
                      : 'rgba(16, 185, 129, 0.35)'
                  }`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '-4px'
                }}
              >
                {selectedRoleObj.id === 'HOD' ? (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(234, 179, 8, 0.2)',
                      border: '1.5px solid rgba(234, 179, 8, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src="/hod_salute.png"
                      alt="🫡"
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    />
                  </div>
                ) : selectedRoleObj.category === 'technical' ? (
                  <Globe size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                ) : selectedRoleObj.category === 'lead' ? (
                  <Shield size={18} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
                ) : selectedRoleObj.category === 'finance_lead' ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                )}
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-main)'
                    }}
                  >
                    <span>{selectedRoleObj.id === 'HOD' ? '🫡 Head of Department · Executive Leadership' : selectedRoleObj.badge}</span>
                  </div>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {selectedRoleObj.title} · {selectedRoleObj.description}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Password Field */}
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2px'
                }}
              >
                <span>Personal Password</span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                  Independent per role
                </span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={17} style={{ position: 'absolute', left: '14px', color: 'var(--text-subtle)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{
                    paddingLeft: '44px',
                    height: '50px',
                    fontSize: '0.94rem',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                  placeholder={selectedRole ? `Enter personal password for ${selectedRole}` : 'Select your role first...'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {/* Show Password Checkbox */}
            <label className="split-login-show-pass" style={{ marginTop: '-4px' }}>
              <input
                type="checkbox"
                id="showPasswordCheckbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span>Show Password</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="split-login-submit-btn"
              disabled={loading}
              style={{
                height: '50px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 800,
                background: selectedRole === 'HOD' ? 'linear-gradient(135deg, #eab308 0%, #10b981 100%)' : undefined,
                color: selectedRole === 'HOD' ? '#0f172a' : undefined
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? (
                  'Authenticating...'
                ) : selectedRole === 'HOD' ? (
                  <>
                    <img
                      src="/hod_salute.png"
                      alt="🫡"
                      style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                    />
                    <span>SIGN IN AS 🫡 HOD</span>
                  </>
                ) : selectedRole ? (
                  `SIGN IN AS ${selectedRole.toUpperCase()}`
                ) : (
                  'SIGN IN'
                )}
              </span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE — SEAMLESS 4K STIC & SRIT ANIMATION USING ENTIRE SPACE (DESKTOP)
          ================================================== */}
      {!isMobile && (
        <div
          className="split-login-right"
          style={{
            flex: '1 1 auto',
            width: 'calc(100vw - 420px)',
            padding: '6px 12px 6px 0',
            position: 'sticky',
            top: 0,
            height: '100vh',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Fixed Ambient Glow Aura */}
          <div className="split-logo-aura" style={{ width: '880px', height: '880px' }} />

          <div
            className="login-branding-stage"
            style={{
              maxWidth: '100%',
              width: '100%',
              height: '100%',
              padding: 0,
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ClubAnimationStudio seamless={true} theme={theme} autoPlay={true} />
          </div>
        </div>
      )}
    </div>
  );
}
