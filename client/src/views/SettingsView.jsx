import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  Building,
  Sparkles,
  Trash2,
  RefreshCw,
  LogOut,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  Info,
  Sliders,
  Lock,
  Globe,
  Camera,
  Upload,
  Image,
  UserCheck
} from 'lucide-react';
import { api, authState } from '../api';

export default function SettingsView({ showToast, onRefreshStats }) {
  const user = authState.getUser();
  const isWebsiteHandler = user?.role === 'STIC Website Handler';

  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState('account'); // 'account', 'club', 'permissions', 'demo', 'audit'

  // Display Picture (DP) State
  const fileInputRef = useRef(null);
  const [dpFile, setDpFile] = useState(null);
  const [dpPreview, setDpPreview] = useState(user?.avatar_url || '');
  const [dpDirectUrl, setDpDirectUrl] = useState('');
  const [dpLoading, setDpLoading] = useState(false);
  const [isDpModified, setIsDpModified] = useState(false);

  // Account Form
  const [accountForm, setAccountForm] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newFullName: user?.full_name || '',
    newEmail: user?.email || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [accountLoading, setAccountLoading] = useState(false);

  // Club Profile Settings Form
  const [clubSettings, setClubSettings] = useState({
    club_name: '',
    club_full_name: '',
    club_tagline: '',
    club_description: '',
    college_name: '',
    club_email: '',
    club_phone: '',
    club_address: '',
    academic_year: ''
  });
  const [demoStats, setDemoStats] = useState(null);
  const [clubLoading, setClubLoading] = useState(false);

  // Permissions Configuration
  const [permissionsData, setPermissionsData] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'permissions') {
      fetchPermissions();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.data?.settings) {
        setClubSettings(prev => ({
          ...prev,
          ...res.data.settings
        }));
      }
      setDemoStats(res.data?.demo_stats || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const res = await api.getPermissions();
      if (res.data) {
        setPermissionsData(res.data);
      }
    } catch (err) {
      showToast('error', 'Error Fetching Permissions', err.message);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditLogs(100);
      setAuditLogs(res.data || []);
    } catch (err) {
      showToast('error', 'Error fetching audit logs', err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // Change Credentials Handler
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountForm.currentPassword) {
      showToast('error', 'Current Password Required', 'Please provide current password to verify identity.');
      return;
    }

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      showToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    try {
      setAccountLoading(true);
      const res = await api.changeCredentials({
        currentPassword: accountForm.currentPassword,
        newUsername: accountForm.newUsername,
        newFullName: accountForm.newFullName,
        newEmail: accountForm.newEmail,
        newPassword: accountForm.newPassword || undefined
      });

      if (res.token && res.user) {
        authState.setToken(res.token);
        authState.setUser(res.user);
      }

      showToast('success', 'Credentials Updated', 'Your role security credentials have been updated.');
      setAccountForm({
        currentPassword: '',
        newUsername: res.user?.username || accountForm.newUsername,
        newFullName: res.user?.full_name || accountForm.newFullName,
        newEmail: res.user?.email || accountForm.newEmail,
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setAccountLoading(false);
    }
  };

  // DP Select File Handler
  const handleSelectDpFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDpFile(file);
      setDpPreview(URL.createObjectURL(file));
      setDpDirectUrl('');
      setIsDpModified(true);
    }
  };

  // DP Preset Handler
  const handleSelectPreset = (url) => {
    setDpFile(null);
    setDpDirectUrl(url);
    setDpPreview(url);
    setIsDpModified(true);
  };

  // DP Remove Handler
  const handleRemoveDp = () => {
    setDpFile(null);
    setDpDirectUrl('');
    setDpPreview('');
    setIsDpModified(true);
  };

  // DP Save Handler
  const handleSaveDp = async () => {
    try {
      setDpLoading(true);
      const formData = new FormData();
      if (dpFile) {
        formData.append('avatar', dpFile);
      } else if (dpDirectUrl) {
        formData.append('avatar_url', dpDirectUrl);
      } else {
        formData.append('remove', 'true');
      }

      const res = await api.updateProfilePhoto(formData);
      if (res.user) {
        authState.setUser(res.user);
        setCurrentUser(res.user);
        if (res.token) authState.setToken(res.token);
        setDpPreview(res.user.avatar_url || '');
      }
      setIsDpModified(false);
      setDpFile(null);
      showToast('success', 'Display Picture (DP) Saved', 'Your new DP has been saved and updated across the portal.');
      if (onRefreshStats) onRefreshStats();
      window.dispatchEvent(new CustomEvent('stic_user_updated', { detail: res.user }));
    } catch (err) {
      showToast('error', 'Failed to update DP', err.message);
    } finally {
      setDpLoading(false);
    }
  };

  // Club Settings Handler
  const handleClubSubmit = async (e) => {
    e.preventDefault();
    try {
      setClubLoading(true);
      const data = new FormData();
      Object.keys(clubSettings).forEach(k => {
        data.append(k, clubSettings[k] || '');
      });

      await api.updateSettings(data);
      showToast('success', 'Settings Saved', 'Club profile details updated.');
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast('error', 'Failed to save settings', err.message);
    } finally {
      setClubLoading(false);
    }
  };

  // Permission Toggle Handler
  const handleTogglePermission = (key) => {
    if (isWebsiteHandler) return; // Read-only for Website Handler
    setPermissionsData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  // Save Permissions Handler
  const handleSavePermissions = async () => {
    try {
      setSavingPermissions(true);
      const res = await api.updatePermissions(permissionsData.permissions);
      showToast('success', 'Permissions Configured', res.message || 'STIC Website Handler permissions saved successfully.');
      fetchPermissions();
    } catch (err) {
      showToast('error', 'Failed to Save Permissions', err.message);
    } finally {
      setSavingPermissions(false);
    }
  };

  // Reset Permissions to Defaults
  const handleResetPermissions = () => {
    if (!permissionsData?.definitions) return;
    const defaults = {};
    permissionsData.definitions.forEach(d => {
      defaults[d.key] = d.default;
    });
    setPermissionsData(prev => ({
      ...prev,
      permissions: defaults
    }));
    showToast('info', 'Defaults Staged', 'Recommended defaults loaded. Click "Save Permissions" to persist.');
  };

  // Clear Demo Data Handler
  const handleClearDemoData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL demo/sample records? This will purge all sample members, programs, and transactions. Genuine records will be preserved.')) {
      return;
    }

    try {
      const res = await api.clearDemoData();
      showToast('success', 'Demo Data Cleared', res.message);
      fetchSettings();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast('error', 'Failed to clear demo data', err.message);
    }
  };

  // Reset Demo Data Handler
  const handleResetDemoData = async () => {
    if (!window.confirm('Restore initial sample demo data for testing?')) {
      return;
    }

    try {
      const res = await api.resetDemoData();
      showToast('success', 'Demo Data Restored', res.message);
      fetchSettings();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast('error', 'Failed to reset demo data', err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <Settings size={26} color="var(--primary-light)" />
            Settings & System Administration
          </h1>
          <p>
            Configure role security credentials, club profile branding, Website Handler permissions, and system controls.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <Camera size={16} /> Profile DP & Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'club' ? 'active' : ''}`}
          onClick={() => setActiveTab('club')}
        >
          <Building size={16} /> Club Profile & Branding
        </button>
        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Globe size={16} /> Website Handler Permissions
        </button>
        {!isWebsiteHandler && (
          <>
            <button
              className={`tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
              onClick={() => setActiveTab('demo')}
            >
              <Sparkles size={16} /> Data Management
            </button>
            <button
              className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <History size={16} /> System Audit Trail
            </button>
          </>
        )}
      </div>

      {/* TAB 1: ACCOUNT & DP */}
      {activeTab === 'account' && (
        <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* DISPLAY PICTURE (DP) CARD */}
          <div className="stic-card">
            <div className="card-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--primary-light)" />
                <h3 style={{ margin: 0 }}>Personal Display Picture (DP)</h3>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                {currentUser?.role}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Avatar Preview Ring */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '104px',
                      height: '104px',
                      borderRadius: '50%',
                      background: currentUser?.role === 'HOD'
                        ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(16, 185, 129, 0.2))'
                        : 'var(--bg-surface-elevated)',
                      border: currentUser?.role === 'HOD'
                        ? '3px solid #facc15'
                        : '3px solid var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: currentUser?.role === 'HOD'
                        ? '0 6px 20px rgba(234, 179, 8, 0.35)'
                        : '0 6px 20px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {dpPreview ? (
                      <img
                        src={dpPreview}
                        alt="DP Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : currentUser?.role === 'HOD' ? (
                      <img
                        src="/hod_salute.png"
                        alt="🫡"
                        style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                        {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : (currentUser?.role ? currentUser.role.charAt(0).toUpperCase() : 'U')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: 'var(--primary-color, #10b981)',
                      color: '#ffffff',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      transition: 'transform 0.15s ease'
                    }}
                    title="Upload New Photo"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    id="dp-file-input"
                    type="file"
                    accept="image/*"
                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                    onChange={handleSelectDpFile}
                  />
                </div>

                {/* Controls & Actions */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {currentUser?.full_name || currentUser?.role}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                    Set your custom display picture (DP). It is visible in the top header, sidebar navigation, activity logs, and public directories.
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>Choose Image</span>
                    </button>

                    {currentUser?.role === 'HOD' && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleSelectPreset('/hod_salute.png')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <img src="/hod_salute.png" alt="🫡" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
                        <span>Use HOD Salute</span>
                      </button>
                    )}

                    {(dpPreview || dpFile || dpDirectUrl) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleRemoveDp}
                        style={{ color: '#fb7185', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        <span>Remove DP</span>
                      </button>
                    )}

                    {isDpModified && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={dpLoading}
                        onClick={handleSaveDp}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Save size={14} />
                        <span>{dpLoading ? 'Saving DP...' : 'Save Display Picture'}</span>
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Or enter direct image URL (https://...)"
                      value={dpDirectUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDpDirectUrl(val);
                        setDpPreview(val);
                        setDpFile(null);
                        setIsDpModified(true);
                      }}
                      style={{ fontSize: '0.8rem', height: '34px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stic-card">
            <div className="card-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--primary-light)" />
                <h3 style={{ margin: 0 }}>Update Personal Password for [{currentUser?.role}]</h3>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                Active Role: {currentUser?.role}
              </span>
            </div>
            <form onSubmit={handleAccountSubmit}>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      background: 'var(--primary-soft)',
                      border: '1px solid var(--border-highlight)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    You are updating credentials specifically for role <strong>{user?.role}</strong>. Each role maintains an independent password.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name / Display Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={accountForm.newFullName}
                      onChange={(e) => setAccountForm({ ...accountForm, newFullName: e.target.value })}
                      placeholder="e.g. Dr. K. Raman (HOD)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={accountForm.newEmail}
                      onChange={(e) => setAccountForm({ ...accountForm, newEmail: e.target.value })}
                      placeholder="e.g. contact@stic-club.org"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Role Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="Enter current password to verify identity"
                      value={accountForm.currentPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (leave empty to keep unchanged)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      value={accountForm.newPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                    />
                  </div>

                  {accountForm.newPassword && (
                    <div className="form-group">
                      <label className="form-label">Confirm New Password *</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        placeholder="Re-enter new password"
                        value={accountForm.confirmPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={accountLoading}
                >
                  <Save size={16} />
                  <span>{accountLoading ? 'Saving...' : 'Update Role Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CLUB PROFILE */}
      {activeTab === 'club' && (
        <div style={{ maxWidth: '780px' }}>
          <div className="stic-card">
            <div className="card-header-bar">
              <h3><Building size={18} color="var(--primary-light)" /> Club Profile & Metadata</h3>
            </div>
            <form onSubmit={handleClubSubmit}>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Club Name (Short / Display)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clubSettings.club_name || ''}
                      onChange={(e) => setClubSettings({ ...clubSettings, club_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Full Club Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clubSettings.club_full_name || ''}
                      onChange={(e) => setClubSettings({ ...clubSettings, club_full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Club Tagline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clubSettings.club_tagline || ''}
                      onChange={(e) => setClubSettings({ ...clubSettings, club_tagline: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Club Mission / About Description</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={clubSettings.club_description || ''}
                      onChange={(e) => setClubSettings({ ...clubSettings, club_description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Official Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={clubSettings.club_email || ''}
                        onChange={(e) => setClubSettings({ ...clubSettings, club_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Official Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clubSettings.club_phone || ''}
                        onChange={(e) => setClubSettings({ ...clubSettings, club_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      className="form-input"
                      value={clubSettings.academic_year || ''}
                      onChange={(e) => setClubSettings({ ...clubSettings, academic_year: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={clubLoading}
                >
                  <Save size={16} />
                  <span>{clubLoading ? 'Saving...' : 'Save Club Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: STIC WEBSITE HANDLER PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div style={{ maxWidth: '860px' }}>
          <div className="stic-card">
            <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={20} color="#38bdf8" />
                <div>
                  <h3 style={{ margin: 0 }}>STIC Website Handler Permissions Configuration</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isWebsiteHandler
                      ? 'Viewing your active permissions assigned by Club Executive Leadership'
                      : 'Configurable by Club Leadership · Decide exactly what the STIC Website Handler can edit'}
                  </p>
                </div>
              </div>
              {!isWebsiteHandler && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetPermissions}
                  title="Load recommended default permissions"
                >
                  <Sliders size={14} /> Restore Defaults
                </button>
              )}
            </div>

            <div className="card-body">
              {/* Notice Banner */}
              <div
                style={{
                  background: 'var(--accent-cyan-soft)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Info size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  The <strong>STIC Website Handler</strong> is a dedicated technical/website management role (separate from the 7 club representative positions). Permissions are fully configurable so Leadership can specify exactly what content the handler can edit without automatically receiving administrative permissions over unrelated club management functions.
                </div>
              </div>

              {permissionsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading permissions configuration...
                </div>
              ) : !permissionsData ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Permissions information unavailable.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Category 1: Website Management Functions */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className="badge badge-sky" style={{ fontWeight: 700 }}>
                        WEBSITE MANAGEMENT FUNCTIONS (RECOMMENDED: ACTIVE)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {permissionsData.definitions
                        .filter(d => d.category.includes('Website Management'))
                        .map(def => {
                          const isAllowed = Boolean(permissionsData.permissions?.[def.key]);
                          return (
                            <div
                              key={def.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: isAllowed ? 'rgba(14, 165, 233, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                border: isAllowed ? '1px solid rgba(14, 165, 233, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '0.9rem', color: isAllowed ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                                    {def.label}
                                  </strong>
                                  <span
                                    className={`badge ${isAllowed ? 'badge-emerald' : 'badge-neutral'}`}
                                    style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                                  >
                                    {isAllowed ? 'Permitted' : 'Disabled'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {def.description}
                                </div>
                              </div>

                              {!isWebsiteHandler ? (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(def.key)}
                                  className={`btn btn-sm ${isAllowed ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ minWidth: '95px' }}
                                >
                                  {isAllowed ? 'Enabled' : 'Disabled'}
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isAllowed ? '#34d399' : '#94a3b8' }}>
                                  {isAllowed ? '✓ Granted' : '✗ Restricted'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Category 2: Unrelated Club Management Functions (Restricted by default) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className="badge badge-amber" style={{ fontWeight: 700 }}>
                        UNRELATED CLUB GOVERNANCE FUNCTIONS (DEFAULT: RESTRICTED)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {permissionsData.definitions
                        .filter(d => !d.category.includes('Website Management'))
                        .map(def => {
                          const isAllowed = Boolean(permissionsData.permissions?.[def.key]);
                          return (
                            <div
                              key={def.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: isAllowed ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                border: isAllowed ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '0.9rem', color: isAllowed ? '#fbbf24' : '#94a3b8' }}>
                                    {def.label}
                                  </strong>
                                  <span
                                    className={`badge ${isAllowed ? 'badge-amber' : 'badge-rose'}`}
                                    style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                                  >
                                    {isAllowed ? 'Granted by Leadership' : 'Restricted (Protected)'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {def.description}
                                </div>
                              </div>

                              {!isWebsiteHandler ? (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(def.key)}
                                  className={`btn btn-sm ${isAllowed ? 'btn-warning' : 'btn-secondary'}`}
                                  style={{ minWidth: '95px' }}
                                >
                                  {isAllowed ? 'Granted' : 'Restricted'}
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isAllowed ? '#fbbf24' : '#fb7185' }}>
                                  {isAllowed ? '✓ Granted' : '🔒 Restricted'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isWebsiteHandler && (
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions || permissionsLoading}
                >
                  <Save size={16} />
                  <span>{savingPermissions ? 'Saving...' : 'Save Permissions Configuration'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEMO DATA MANAGEMENT */}
      {activeTab === 'demo' && !isWebsiteHandler && (
        <div style={{ maxWidth: '640px' }}>
          <div className="stic-card">
            <div className="card-header-bar">
              <h3><Sparkles size={18} color="var(--primary-light)" /> Demo & Sample Data Management</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Manage testing records. You can safely clear all demo records while keeping genuine club data intact.
                </p>

                {demoStats && (
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Demo Records Count:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.8rem' }}>
                      <div>Members: <strong>{demoStats.members}</strong></div>
                      <div>Programs: <strong>{demoStats.programs}</strong></div>
                      <div>Transactions: <strong>{demoStats.transactions}</strong></div>
                      <div>Photos: <strong>{demoStats.photos}</strong></div>
                      <div>Sponsors: <strong>{demoStats.sponsors}</strong></div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="btn btn-danger btn-sm" onClick={handleClearDemoData}>
                    <Trash2 size={15} /> Clear All Demo Records
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleResetDemoData}>
                    <RefreshCw size={15} /> Restore Demo Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && !isWebsiteHandler && (
        <div className="stic-card">
          <div className="card-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><History size={18} color="var(--primary-light)" /> System Activity & Audit Trail</h3>
            <span className="badge badge-info">{auditLogs.length} Records</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {auditLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading audit logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                No audit entries recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="stic-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time (IST)</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Action</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {log.log_date || log.created_at?.split(' ')[0]}
                        </td>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                          {log.log_time || log.created_at?.split(' ')[1]}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          <span className="badge badge-neutral">{log.role || log.user_id}</span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.department || log.entity_type}</td>
                        <td>
                          <span className={`badge ${log.action === 'Created' ? 'badge-success' : log.action === 'Deleted' ? 'badge-danger' : 'badge-primary'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.84rem', color: 'var(--text-main)', maxWidth: '450px' }}>
                          {log.change_summary || log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
