import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => {
        let Icon = CheckCircle;
        if (t.type === 'error') Icon = XCircle;
        else if (t.type === 'warning') Icon = AlertTriangle;
        else if (t.type === 'info') Icon = Info;

        return (
          <div key={t.id} className={`toast-message ${t.type || 'success'}`}>
            <Icon size={18} className="flex-shrink-0" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{t.title || 'Notification'}</div>
              {t.message && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
