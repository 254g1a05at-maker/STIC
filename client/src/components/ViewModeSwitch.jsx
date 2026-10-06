import React from 'react';
import { Monitor, Smartphone, Sparkles } from 'lucide-react';

/**
 * ViewModeSwitch Component
 * Allows user to seamlessly toggle between Desktop View and Mobile View,
 * plus Auto detection mode.
 */
export default function ViewModeSwitch({ viewMode, onToggleViewMode, compact = false }) {
  return (
    <div
      className={`view-mode-switch-pill ${compact ? 'compact' : ''}`}
      role="group"
      aria-label="Viewport display mode"
    >
      <button
        type="button"
        className={`view-mode-btn ${viewMode === 'desktop' ? 'active' : ''}`}
        onClick={() => onToggleViewMode('desktop')}
        title="Force Desktop View (Widescreen layout with full sidebar and data grids)"
      >
        <Monitor size={compact ? 13 : 14} />
        {!compact && <span>Desktop</span>}
      </button>

      <button
        type="button"
        className={`view-mode-btn ${viewMode === 'mobile' ? 'active' : ''}`}
        onClick={() => onToggleViewMode('mobile')}
        title="Force Mobile View (Touch-optimized layout with mobile drawer and bottom navigation)"
      >
        <Smartphone size={compact ? 13 : 14} />
        {!compact && <span>Mobile</span>}
      </button>

      <button
        type="button"
        className={`view-mode-btn auto-btn ${viewMode === 'auto' ? 'active' : ''}`}
        onClick={() => onToggleViewMode('auto')}
        title="Auto Responsive View (Adapts automatically based on your screen size)"
      >
        <Sparkles size={compact ? 11 : 12} />
        <span className="auto-text">{compact ? 'A' : 'Auto'}</span>
      </button>
    </div>
  );
}
