import React from 'react';

export default function ProfileModal({ user, onClose, onLogout }) {
  if (!user) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2>👤 Профиль Пользователя</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', background: 'var(--github-canvas)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--github-border)' }}>
          <img
            src={user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}
            alt="Avatar"
            style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--github-blue)' }}
          />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name || user.email || 'Разработчик'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email || 'No Email'}</div>
            <span style={{ display: 'inline-block', marginTop: '0.3rem', background: 'rgba(56, 139, 253, 0.15)', color: '#58a6ff', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
              Провайдер: {user.provider === 'github' ? 'GitHub 🐙' : 'Google 🔴'}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', background: 'var(--github-surface)', border: '1px solid var(--github-border)', padding: '0.85rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>🛡️ Безопасность сессии</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Сессия активна. Доступ к созданию и управлению досками подтверждён.</div>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onLogout} style={{ color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.4)' }}>
            🚪 Выйти из аккаунта
          </button>
          <button className="btn btn-primary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
