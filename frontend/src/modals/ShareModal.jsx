import React, { useState, useEffect } from 'react';

export default function ShareModal({ board, onClose }) {
  const [shareMode, setShareMode] = useState('link');
  const [shareUrl, setShareUrl] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!board) return;
    fetch(`/api/boards/${board.id}/share`)
      .then(res => res.json())
      .then(data => {
        setShareMode(data.shareMode || 'link');
        setShareUrl(data.shareUrl || window.location.href);
        setInvitedEmails(data.invitedEmails || []);
      })
      .catch(console.error);
  }, [board]);

  const handleSelectMode = (mode) => {
    setShareMode(mode);
    fetch(`/api/boards/${board.id}/share/mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareMode: mode })
    });
  };

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    fetch(`/api/boards/${board.id}/share/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail })
    }).then(() => {
      setInvitedEmails([...invitedEmails, newEmail]);
      setNewEmail('');
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Ссылка скопирована в буфер обмена!');
  };

  if (!board) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--github-blue-text)' }}>share</span>
            Доступ к доске: {board.name}
          </h2>
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className="option-cards-group">
          <div className={`option-card ${shareMode === 'link' ? 'active' : ''}`} onClick={() => handleSelectMode('link')}>
            <div className="option-card-icon">
              <span className="material-symbols-outlined">key</span>
            </div>
            <div className="option-card-content">
              <div className="option-card-title">По секретной ссылке</div>
              <div className="option-card-sub">Доступен только обладателям уникальной ссылки UUID</div>
            </div>
            <div className="option-card-check">
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>check</span>
            </div>
          </div>

          <div className={`option-card ${shareMode === 'private' ? 'active' : ''}`} onClick={() => handleSelectMode('private')}>
            <div className="option-card-icon">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div className="option-card-content">
              <div className="option-card-title">Приватный доступ</div>
              <div className="option-card-sub">Только вы имеете доступ к этой доске</div>
            </div>
            <div className="option-card-check">
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>check</span>
            </div>
          </div>

          <div className={`option-card ${shareMode === 'restricted' ? 'active' : ''}`} onClick={() => handleSelectMode('restricted')}>
            <div className="option-card-icon">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className="option-card-content">
              <div className="option-card-title">Ограниченный (по E-mail)</div>
              <div className="option-card-sub">Доступен только приглашенным пользователям</div>
            </div>
            <div className="option-card-check">
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>check</span>
            </div>
          </div>
        </div>

        {shareMode === 'restricted' && (
          <div style={{ marginBottom: '1rem', background: 'var(--github-canvas)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--github-border)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Пригласить по E-mail:</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="colleague@gmail.com"
                style={{ flex: 1, padding: '0.4rem', background: 'var(--github-surface)', border: '1px solid var(--github-border)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
              />
              <button className="btn btn-primary" onClick={handleAddEmail}>+ Добавить</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{ flex: 1, padding: '0.45rem', background: 'var(--github-canvas)', border: '1px solid var(--github-border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.78rem' }}
          />
          <button className="btn btn-secondary" onClick={handleCopyLink}>Скопировать</button>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}
