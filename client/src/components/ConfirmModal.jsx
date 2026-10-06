import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm Delete', cancelText = 'Cancel', isDangerous = true, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 style={{ color: isDangerous ? '#fb7185' : 'var(--text-main)' }}>
            <AlertTriangle size={20} />
            {title || 'Confirm Action'}
          </h3>
          <button className="btn-icon" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {message || 'Are you sure you want to perform this action? This operation cannot be undone.'}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
