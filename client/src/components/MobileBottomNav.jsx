import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FolderOpen,
  Menu,
  Sparkles
} from 'lucide-react';

/**
 * MobileBottomNav Component
 * Ultra-responsive iOS/Android style bottom navigation bar with frosted glass,
 * active indicator, badges, and quick tab switching.
 */
export default function MobileBottomNav({
  currentView,
  setView,
  onOpenMenu,
  stats
}) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      badge: stats?.summary?.totalMembers
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: CalendarDays,
      badge: stats?.summary?.totalPrograms
    },
    {
      id: 'documents',
      label: 'Docs & Media',
      icon: FolderOpen,
      match: ['documents', 'photos', 'videos']
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      isAction: true,
      onClick: onOpenMenu
    }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isAction
            ? false
            : tab.match
            ? tab.match.includes(currentView)
            : currentView === tab.id;

          const handleClick = () => {
            if (tab.isAction) {
              if (tab.onClick) tab.onClick();
            } else {
              setView(tab.id);
            }
          };

          return (
            <button
              key={tab.id}
              type="button"
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={handleClick}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={20} className="mobile-nav-icon" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="mobile-nav-badge">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="mobile-nav-label">{tab.label}</span>
              {isActive && <div className="mobile-nav-active-dot" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
