import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Camera
} from 'lucide-react';
import { authState } from '../api';
import SRITLogo from './SRITLogo';
import ViewModeSwitch from './ViewModeSwitch';

export default function TopHeader({
  setMobileOpen,
  setView,
  searchQuery,
  setSearchQuery,
  onOpenQuickAction,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar,
  isMobile,
  viewMode,
  onToggleViewMode
}) {
  const [currentUser, setCurrentUser] = useState(authState.getUser());
  const user = currentUser;
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) setCurrentUser(e.detail);
      else setCurrentUser(authState.getUser());
    };
    window.addEventListener('stic_user_updated', handleUserUpdate);
    return () => window.removeEventListener('stic_user_updated', handleUserUpdate);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery && searchQuery.trim()) {
      setView('search');
    }
  };

  return (
    <header className={`top-header ${isMobile ? 'top-header-mobile' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', minWidth: 0 }}>
        {isMobile ? (
          <button
            type="button"
            className="header-sidebar-toggle-btn mobile-hamburger-btn"
            onClick={() => setMobileOpen(true)}
            title="Open Mobile Navigation Menu"
            aria-label="Open Mobile Menu"
          >
            <Menu size={20} />
          </button>
        ) : (
          <button
            type="button"
            className="header-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Show Brand Logo in Header on mobile or when desktop sidebar is collapsed */}
        {(isMobile || sidebarCollapsed) && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => setView('dashboard')}
            title="Return to STIC Dashboard"
          >
            <div
              style={{
                width: isMobile ? '32px' : '34px',
                height: isMobile ? '32px' : '34px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img src="/stic_logo.png" alt="CSE – STIC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: isMobile ? '0.92rem' : '1rem', color: 'var(--text-main)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              CSE – STIC
            </span>
          </div>
        )}

        {!isMobile && (
          <form onSubmit={handleSearchSubmit} className="header-search" style={{ marginLeft: '4px' }}>
            <div className="search-input-wrap">
              <Search size={16} className="search-icon-pos" />
              <input
                type="text"
                placeholder="Search members, programs, docs, finance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length >= 2) setView('search');
                }}
              />
            </div>
          </form>
        )}
      </div>

      <div className="header-actions" style={{ gap: isMobile ? '8px' : '12px' }}>
        {/* Desktop View & Mobile View Switcher Pill */}
        <ViewModeSwitch
          viewMode={viewMode}
          onToggleViewMode={onToggleViewMode}
          compact={isMobile}
        />

        <div style={{ position: 'relative' }}>
          <button
            className={`btn btn-primary btn-sm ${isMobile ? 'btn-icon-mobile' : ''}`}
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            style={{ padding: isMobile ? '7px 9px' : '8px 14px', borderRadius: '10px' }}
            title="Quick Action"
          >
            <Plus size={16} />
            {!isMobile && <span>Quick Action</span>}
            {!isMobile && <ChevronDown size={14} />}
          </button>

          {showQuickMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                onClick={() => setShowQuickMenu(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '220px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 101,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {(!user?.is_website_handler || user?.permissions?.manage_announcements) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: 'var(--accent-cyan)' }}
                    onClick={() => { setShowQuickMenu(false); setView('website'); }}
                  >
                    + New Announcement
                  </button>
                )}
                {(!user?.is_website_handler || user?.permissions?.manage_members) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                    onClick={() => { setShowQuickMenu(false); onOpenQuickAction('member'); }}
                  >
                    + Add Member
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  onClick={() => { setShowQuickMenu(false); onOpenQuickAction('program'); }}
                >
                  + Add Program
                </button>
                {(!user?.is_website_handler || user?.permissions?.manage_finance) &&
                 user?.role !== 'Content and Documentation Lead' &&
                 user?.role !== 'Social Media Lead' &&
                 user?.role !== 'Technical Lead' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                    onClick={() => { setShowQuickMenu(false); onOpenQuickAction('transaction'); }}
                  >
                    + Add Transaction
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  onClick={() => { setShowQuickMenu(false); onOpenQuickAction('document'); }}
                >
                  + Create Document (Template)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  onClick={() => { setShowQuickMenu(false); onOpenQuickAction('photo'); }}
                >
                  + Upload Photo
                </button>
                {(!user?.is_website_handler || user?.permissions?.manage_sponsors) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                    onClick={() => { setShowQuickMenu(false); onOpenQuickAction('sponsor'); }}
                  >
                    + Add Sponsor
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Unified Active Role & Profile Pill */}
        {currentUser?.role && (
          <button
            type="button"
            onClick={() => setView('settings')}
            style={{
              padding: '4px 12px 4px 6px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Account Profile & Security Settings"
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: currentUser?.role === 'HOD'
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'var(--primary-soft)',
                border: currentUser?.role === 'HOD'
                  ? '1.5px solid #facc15'
                  : '1.5px solid var(--primary-light)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt="DP"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : currentUser?.role === 'HOD' ? (
                <img
                  src="/hod_salute.png"
                  alt="🫡"
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            {!isMobile && (
              <span>
                {currentUser?.is_website_handler
                  ? 'Website Handler'
                  : currentUser?.role === 'HOD'
                  ? 'HOD'
                  : currentUser?.role}
              </span>
            )}
          </button>
        )}

        {/* Light / Dark Background Switch */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-switch-header-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Background`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#fbbf24" />
              {!isMobile && <span>Light</span>}
            </>
          ) : (
            <>
              <Moon size={15} color="#0284c7" />
              {!isMobile && <span>Dark</span>}
            </>
          )}
        </button>

        {/* SRIT Institutional Logo - Far Right Header Placement (Desktop) */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--border-subtle)',
              marginLeft: '2px',
              cursor: 'pointer'
            }}
            title="Srinivasa Ramanujan Institute of Technology (SRIT)"
            onClick={() => setView('dashboard')}
          >
            <SRITLogo theme={theme} height={38} />
          </div>
        )}
      </div>
    </header>
  );
}
