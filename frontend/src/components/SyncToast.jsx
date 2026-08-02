import React, { useState, useEffect } from 'react';

export default function SyncToast({ status, message }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'syncing' || status === 'error') {
      setVisible(true);
    } else if (status === 'synced') {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [status, message]);

  if (!visible || !status) return null;

  return (
    <div className={`sync-indicator active ${status}`}>
      {status === 'syncing' && <span className="sync-spinner"></span>}
      {status === 'synced' && <span className="sync-icon" style={{ display: 'inline-block', color: '#3fb950' }}>✓</span>}
      {status === 'error' && <span className="sync-icon" style={{ display: 'inline-block', color: '#f85149' }}>✕</span>}
      <span>{message || 'Сохранение...'}</span>
    </div>
  );
}
