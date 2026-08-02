import React from 'react';

export default function SyncToast({ status, message }) {
  if (!status) return null;

  return (
    <div className={`sync-indicator active ${status}`}>
      {status === 'syncing' && <span className="sync-spinner"></span>}
      {status === 'success' && <span className="sync-icon" style={{ display: 'inline-block', color: '#3fb950' }}>✓</span>}
      {status === 'error' && <span className="sync-icon" style={{ display: 'inline-block', color: '#f85149' }}>✕</span>}
      <span>{message || 'Сохранение...'}</span>
    </div>
  );
}
