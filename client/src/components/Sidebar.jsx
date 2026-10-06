import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  UserCheck,
  Image,
  Video,
  FileText,
  IndianRupee,
  HandCoins,
  Search,
  History,
  Settings,
  LogOut,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { authState } from '../api';

export default function Sidebar({ currentView, setView, mobileOpen, setMobileOpen, stats, collapsed, onToggleCollapse }) {
  const [currentUser, setCurrentUser] = useState(authState.getUser());
  const user = currentUser;
  const [isCoreCollapsed, setIsCoreCollapsed] = useState(false);

  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail) setCurrentUser(e.detail);
      else setCurrentUser(authState.getUser());
    };
    window.addEventListener('stic_user_updated', handleUserUpdate);
    return () => window.removeEventListener('stic_user_updated', handleUserUpdate);
  }, []);

  const handleNav = (viewId) => {
    setView(viewId);
    if (setMobileOpen) setMobileOpen(false);
  };

  const navSections = [
    {
      title: 'Core Management',
      isCollapsible: true,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'members', label: 'Club Members', icon: Users, badge: stats?.summary?.totalMembers },
        { id: 'departments', label: 'Departments & Teams', icon: Building2, badge: stats?.summary?.totalDepartments || stats?.departments?.length || 6 },
        { id: 'all-members', label: 'All Members Directory', icon: FolderOpen }
      ]
    },
    {
      title: 'Programs & Events',
      items: [
        { id: 'programs', label: 'Programs & Events', icon: CalendarDays, badge: stats?.summary?.totalPrograms },
        { id: 'coordinators', label: 'Event Coordinators', icon: UserCheck }
      ]
    },
    {
      title: 'Website & Media',
      items: [
        { id: 'website', label: 'Website & Announcements', icon: Globe },
        { id: 'photos', label: 'Photos Gallery', icon: Image },
        { id: 'videos', label: 'Videos Archive', icon: Video },
        { id: 'documents', label: 'Content & Documentation', icon: FileText }
      ]
    },
    {
      title: 'Finance & Outreach',
      items: [
        { id: 'finance', label: 'Finance & Accounts', icon: IndianRupee },
        { id: 'sponsors', label: 'Sponsorships', icon: HandCoins }
      ]
    },
    {
      title: 'System & Tools',
      items: [
        { id: 'search', label: 'Global Search', icon: Search },
        { id: 'activity-log', label: 'Activity Log', icon: History },
        { id: 'settings', label: 'Settings & Security', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99
          }}
        />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Brand with Exact Official Logo */}
        <div className="sidebar-brand">
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              flexShrink: 0,
              cursor: collapsed ? 'pointer' : 'default'
            }}
            onClick={collapsed ? onToggleCollapse : undefined}
            title={collapsed ? 'Click to expand sidebar' : undefined}
          >
            <img
              src="/stic_logo.png"
              alt="CSE – STIC Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="brand-text">
            <h2>CSE – STIC</h2>
            <p>Innovate • Sustain • Impact</p>
          </div>
          {mobileOpen && (
            <button
              type="button"
              className="mobile-drawer-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation drawer"
              title="Close Menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section, idx) => {
            const isCoreSection = section.isCollapsible;
            const isCollapsed = isCoreSection && isCoreCollapsed && !collapsed;

            return (
              <div key={idx} style={{ marginBottom: '14px' }}>
                <div
                  className="nav-section-title"
                  onClick={() => isCoreSection && setIsCoreCollapsed(!isCoreCollapsed)}
                  style={{
                    cursor: isCoreSection ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>{section.title}</span>
                  {isCoreSection && (
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      aria-label="Toggle Core Management"
                    >
                      {isCoreCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    </button>
                  )}
                </div>

                {(!isCoreSection || !isCollapsed || collapsed) && (
                  <div style={{ transition: 'all 0.25s ease-in-out' }}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id || (item.id === 'programs' && currentView === 'program-detail');
                      return (
                        <div
                          key={item.id}
                          className={`nav-link ${isActive ? 'active' : ''}`}
                          onClick={() => handleNav(item.id)}
                          title={item.label}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                          {item.id === 'finance' && (
                            (user?.is_website_handler && !user?.permissions?.manage_finance) ||
                            user?.role === 'Content and Documentation Lead' ||
                            user?.role === 'Social Media Lead' ||
                            user?.role === 'Technical Lead'
                          ) ? (
                            <span className="nav-link-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Lock size={10} /> Restricted
                            </span>
                          ) : item.badge !== undefined && item.badge !== null && (
                            <span className="nav-link-badge">{item.badge}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div
              className="user-avatar-circle"
              style={{
                background: currentUser?.avatar_url
                  ? 'transparent'
                  : currentUser?.role === 'HOD'
                  ? 'linear-gradient(135deg, #eab308, #ca8a04)'
                  : currentUser?.is_website_handler
                  ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                  : 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: currentUser?.avatar_url ? '2px solid var(--primary-light)' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => handleNav('settings')}
              title="Click to customize your DP & Settings"
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || 'DP'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : currentUser?.role === 'HOD' ? (
                <img
                  src="/hod_salute.png"
                  alt="🫡"
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                />
              ) : (
                currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : (currentUser?.role ? currentUser.role.charAt(0).toUpperCase() : 'A')
              )}
            </div>
            <div
              className="user-meta"
              style={{ minWidth: 0, cursor: 'pointer' }}
              onClick={() => handleNav('settings')}
              title="Click to view Account & Settings"
            >
              <div className="name" title={currentUser?.full_name || currentUser?.role || 'Administrator'}>
                {currentUser?.role === 'HOD' ? 'Head of Department' : currentUser?.role === 'STIC Website Handler' ? 'STIC Website Handler' : (currentUser?.full_name || currentUser?.role || 'Admin')}
              </div>
              <div className="role" style={{ fontSize: '0.72rem', color: currentUser?.role === 'HOD' ? '#facc15' : currentUser?.is_website_handler ? '#38bdf8' : (currentUser?.role?.includes('Lead') ? '#facc15' : 'var(--primary-light)') }}>
                {currentUser?.role === 'HOD'
                  ? '🫡 Department Head'
                  : currentUser?.is_website_handler
                  ? 'Technical Website Manager'
                  : currentUser?.role?.includes('Lead')
                  ? `${currentUser.role} · Committee Lead`
                  : `${currentUser?.role || 'Admin'} · Representative`}
              </div>
            </div>
            <button
              className="btn-icon"
              title="Logout"
              onClick={authState.logout}
              style={{ marginLeft: 'auto' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
