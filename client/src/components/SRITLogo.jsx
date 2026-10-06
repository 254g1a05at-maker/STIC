import React from 'react';

export default function SRITLogo({ height = 40 }) {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '3px 8px',
        borderRadius: '8px',
        border: '1px solid rgba(234, 88, 12, 0.25)',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src="/srit_official_logo.png?v=2"
        alt="SRIT Official Logo"
        style={{
          height: `${height}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
