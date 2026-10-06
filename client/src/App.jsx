import React, { useState, useEffect } from 'react';
import { authState, api } from './api';
import { Monitor, Smartphone } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MobileBottomNav from './components/MobileBottomNav';
import Toast from './components/Toast';
import ClubAnimationStudio from './components/ClubAnimationStudio';
import HodWelcomeTransition from './components/HodWelcomeTransition';

import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import MembersView from './views/MembersView';
import DepartmentsView from './views/DepartmentsView';
import ProgramsView from './views/ProgramsView';
import ProgramDetailView from './views/ProgramDetailView';
import PhotosView from './views/PhotosView';
import VideosView from './views/VideosView';
import DocumentsView from './views/DocumentsView';
import FinanceView from './views/FinanceView';
import SponsorsView from './views/SponsorsView';
import CoordinatorsView from './views/CoordinatorsView';
import SearchView from './views/SearchView';
import ActivityLogView from './views/ActivityLogView';
import SettingsView from './views/SettingsView';
import WebsiteView from './views/WebsiteView';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('STIC render error caught by boundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentView !== this.props.currentView && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="stic-card" style={{ maxWidth: '520px', margin: '0 auto', padding: '36px', borderColor: 'rgba(244, 63, 94, 0.4)' }}>
            <h3 style={{ color: '#fb7185', marginBottom: '12px' }}>View Display Glitch</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred rendering this section.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Refresh View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(false);
  const [showHodWelcome, setShowHodWelcome] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = authState.getUser();
      const t = authState.getToken();
      if (u && t) return u;
    } catch {
      // ignore storage errors
    }
    return null;
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('stic_sidebar_collapsed') === 'true';
  });

  // Viewport Display Mode: 'auto' (Screen Adaptive) | 'desktop' (Force Desktop) | 'mobile' (Force Mobile)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('stic_view_mode') || 'auto';
  });
  const [windowWidth, setWindowWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && windowWidth <= 1024);

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('stic_view_mode', mode);
    showToast(
      'info',
      `${mode === 'auto' ? '⚡ Auto Responsive' : mode === 'desktop' ? '🖥️ Desktop View' : '📱 Mobile View'} Active`,
      mode === 'auto'
        ? 'Viewport dynamically matches your screen size.'
        : `Interface mode switched to ${mode.toUpperCase()} layout.`
    );
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('stic_sidebar_collapsed', String(next));
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 310);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme Management (Light / Dark Background)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('stic_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stic_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Dashboard Stats & Settings Cache
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [allMembers, setAllMembers] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [demoStats, setDemoStats] = useState(null);

  // Quick Action trigger states
  const [quickActionType, setQuickActionType] = useState(null);

  // Toast stack
  const [toasts, setToasts] = useState([]);

  const showToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      showToast('error', 'Session Expired', 'Please log in again.');
    };
    window.addEventListener('stic_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('stic_unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const loadInitialData = async () => {
    try {
      setStatsLoading(true);
      const [statsRes, memRes, progRes, settRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: null })),
        api.getMembers().catch(() => ({ data: [] })),
        api.getPrograms().catch(() => ({ data: [] })),
        api.getSettings().catch(() => ({ data: null }))
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (memRes.data) setAllMembers(memRes.data);
      if (progRes.data) setAllPrograms(progRes.data);
      if (settRes.data?.demo_stats) setDemoStats(settRes.data.demo_stats);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStats = loadInitialData;

  const handleOpenQuickAction = (type) => {
    if (type === 'member') {
      setCurrentView('members');
      setQuickActionType('member');
    } else if (type === 'program') {
      setCurrentView('programs');
      setQuickActionType('program');
    } else if (type === 'transaction') {
      setCurrentView('finance');
      setQuickActionType('transaction');
    } else if (type === 'document') {
      setCurrentView('documents');
      setQuickActionType('document');
    } else if (type === 'photo') {
      setCurrentView('photos');
      setQuickActionType('photo');
    } else if (type === 'sponsor') {
      setCurrentView('sponsors');
      setQuickActionType('sponsor');
    }
  };

  if (showIntro) {
    return (
      <ClubAnimationStudio
        isIntro={true}
        autoPlay={true}
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginView
          theme={theme}
          onToggleTheme={toggleTheme}
          onReplayIntro={() => setShowIntro(true)}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
          isMobile={isMobile}
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            if (u.role === 'HOD' || u.username === 'HOD') {
              setShowHodWelcome(true);
            } else {
              showToast('success', `Welcome back, ${u.full_name}!`, 'STIC management console initialized.');
            }
          }}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className={`app-layout ${isMobile ? 'mode-mobile' : 'mode-desktop'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          setCurrentView(v);
          setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        stats={stats}
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Viewport */}
      <div className={`main-viewport ${isMobile ? 'mobile-viewport' : (sidebarCollapsed ? 'sidebar-collapsed' : '')}`}>
        {/* Sticky Header with Live Search & Quick Actions */}
        <TopHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          setMobileOpen={setMobileOpen}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
          setView={setCurrentView}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (q.length >= 2 && currentView !== 'search') {
              setCurrentView('search');
            }
          }}
          onOpenQuickAction={handleOpenQuickAction}
          demoStats={demoStats}
          isMobile={isMobile}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />

        {/* View Router */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary currentView={currentView}>
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={statsLoading}
              setView={setCurrentView}
              setSelectedProgramId={(id) => {
                setSelectedProgramId(id);
                setCurrentView('program-detail');
              }}
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {(currentView === 'members' || currentView === 'all-members') && (
            <MembersView
              departments={stats?.departments || []}
              showToast={showToast}
              openAddTrigger={quickActionType === 'member'}
              onCloseAddTrigger={() => setQuickActionType(null)}
            />
          )}

          {currentView === 'departments' && (
            <DepartmentsView showToast={showToast} onRefreshStats={loadInitialData} />
          )}

          {currentView === 'programs' && (
            <ProgramsView
              showToast={showToast}
              allMembers={allMembers}
              onSelectProgram={(id) => {
                setSelectedProgramId(id);
                setCurrentView('program-detail');
              }}
              openAddTrigger={quickActionType === 'program'}
              onCloseAddTrigger={() => setQuickActionType(null)}
            />
          )}

          {currentView === 'program-detail' && selectedProgramId && (
            <ProgramDetailView
              programId={selectedProgramId}
              onBack={() => setCurrentView('programs')}
              showToast={showToast}
              allMembers={allMembers}
              onFinanceChange={fetchStats}
            />
          )}

          {currentView === 'coordinators' && (
            <CoordinatorsView
              showToast={showToast}
              onSelectProgram={(id) => {
                setSelectedProgramId(id);
                setCurrentView('program-detail');
              }}
            />
          )}

          {currentView === 'photos' && (
            <PhotosView
              showToast={showToast}
              allPrograms={allPrograms}
              openAddTrigger={quickActionType === 'photo'}
              onCloseAddTrigger={() => setQuickActionType(null)}
            />
          )}

          {currentView === 'videos' && (
            <VideosView
              showToast={showToast}
              allPrograms={allPrograms}
            />
          )}

          {currentView === 'documents' && (
            <DocumentsView
              showToast={showToast}
              allPrograms={allPrograms}
              openAddTrigger={quickActionType === 'document'}
              onCloseAddTrigger={() => setQuickActionType(null)}
            />
          )}

          {currentView === 'website' && (
            <WebsiteView
              showToast={showToast}
              setView={setCurrentView}
            />
          )}

          {currentView === 'finance' && (
            ((currentUser?.is_website_handler && !currentUser?.permissions?.manage_finance) ||
            currentUser?.role === 'Content and Documentation Lead' ||
            currentUser?.role === 'Social Media Lead' ||
            currentUser?.role === 'Technical Lead') ? (
              <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="stic-card" style={{ maxWidth: '580px', margin: '0 auto', padding: '36px', borderColor: 'rgba(244, 63, 94, 0.35)', background: 'var(--bg-surface)' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#fb7185',
                    fontSize: '24px'
                  }}>
                    🔒
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#fb7185', fontWeight: 800 }}>
                    Access Restricted: Finance Lead & Administration Only
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '16px' }}>
                    The <strong>{currentUser?.role}</strong> role is restricted from accessing the Finance & Accounts section. Club financial ledgers, bank transactions, and budgets are reserved exclusively for the <strong>Finance Lead</strong> and Club Leadership.
                  </p>
                  <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem', marginBottom: '24px' }}>
                    You can manage programs, media, documents, and records assigned to your department.
                  </p>
                  <button className="btn btn-primary" onClick={() => setCurrentView('dashboard')}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <FinanceView
                showToast={showToast}
                allPrograms={allPrograms}
                openAddTrigger={quickActionType === 'transaction'}
                onCloseAddTrigger={() => setQuickActionType(null)}
                onFinanceChange={fetchStats}
              />
            )
          )}

          {currentView === 'sponsors' && (
            <SponsorsView
              showToast={showToast}
              allPrograms={allPrograms}
              openAddTrigger={quickActionType === 'sponsor'}
              onCloseAddTrigger={() => setQuickActionType(null)}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setView={setCurrentView}
              setSelectedProgramId={(id) => {
                setSelectedProgramId(id);
                setCurrentView('program-detail');
              }}
            />
          )}

          {(currentView === 'activity-log' || currentView === 'reports') && (
            <ActivityLogView showToast={showToast} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              showToast={showToast}
              onRefreshStats={loadInitialData}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <MobileBottomNav
          currentView={currentView}
          setView={(v) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenMenu={() => setMobileOpen(true)}
          stats={stats}
        />
      )}

      {/* Floating View Mode Quick-Switcher Pill (allows instant Desktop / Mobile toggling anytime) */}
      <aside className="floating-view-mode-pill" aria-label="Floating View Switcher">
        <button
          type="button"
          className="floating-mode-btn"
          onClick={() => handleToggleViewMode(isMobile ? 'desktop' : 'mobile')}
          title={isMobile ? 'Currently in Mobile View. Click to switch to Desktop View.' : 'Currently in Desktop View. Click to switch to Mobile View.'}
        >
          {isMobile ? <Monitor size={15} /> : <Smartphone size={15} />}
          <span>{isMobile ? 'Desktop View' : 'Mobile View'}</span>
        </button>
      </aside>

      {/* Global Toast Stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Special HOD Presidential Salute Pop Welcome Transition */}
      {showHodWelcome && (
        <HodWelcomeTransition
          onComplete={() => {
            setShowHodWelcome(false);
            showToast('success', 'Welcome back, Head of the Department 🫡', 'Executive CSE Department Head portal active.');
          }}
        />
      )}
    </div>
  );
}
