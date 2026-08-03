import React, { useState } from 'react';

export default function ProfileModal({ user, onClose, onLogout, onRefreshUser }) {
  const [unlinkStatus, setUnlinkStatus] = useState('');

  if (!user) return null;

  const handleUnlinkDrive = () => {
    const token = localStorage.getItem('session_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    setUnlinkStatus('Отключение...');
    fetch('/api/auth/google-drive/unlink', { method: 'POST', headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUnlinkStatus('✅ Диск отключён');
          if (typeof onRefreshUser === 'function') onRefreshUser();
          setTimeout(() => setUnlinkStatus(''), 2000);
        } else {
          setUnlinkStatus('❌ Ошибка');
        }
      })
      .catch(() => setUnlinkStatus('❌ Ошибка'));
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
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

        {/* Google Drive Integration Card */}
        <div style={{ marginBottom: '1.25rem', background: 'var(--github-surface)', border: '1px solid var(--github-border)', padding: '0.85rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: user.google_access_token ? '#3fb950' : '#8b949e' }}>
                {user.google_access_token ? 'cloud_done' : 'cloud_off'}
              </span>
              Google Диск
            </div>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600, background: user.google_access_token ? 'rgba(63, 185, 80, 0.15)' : 'rgba(139, 148, 158, 0.15)', color: user.google_access_token ? '#3fb950' : '#8b949e' }}>
              {user.google_access_token ? 'Подключён 🟢' : 'Не подключён ⚪'}
            </span>
          </div>

          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
            {user.google_access_token
              ? 'Google Диск подключён к вашему аккаунту для хранения медиафайлов.'
              : 'Подключите ваш Google Диск для сохранения прикреплённых фото/видео к задачам.'}
          </p>

          {user.google_access_token ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem', color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              onClick={handleUnlinkDrive}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>link_off</span>
              {unlinkStatus || 'Отключить Google Диск'}
            </button>
          ) : (
            <a
              href="/api/auth/google-drive?origin=profile"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', fontSize: '0.82rem', textDecoration: 'none', background: 'rgba(56, 139, 253, 0.1)', color: '#58a6ff', borderColor: 'rgba(56, 139, 253, 0.4)', fontWeight: 600 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_to_drive</span>
              Подключить Google Диск
            </a>
          )}
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
