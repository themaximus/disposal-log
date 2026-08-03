import React, { useState } from 'react';

export default function AuthModal({ onClose, onOpenGuestMode }) {
  const [viewMode, setViewMode] = useState('select'); // 'select' | 'guest_info'

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.3rem', color: 'var(--github-blue-text)' }}>
              {viewMode === 'guest_info' ? 'devices_off' : 'key'}
            </span>
            {viewMode === 'guest_info' ? 'Работа без аккаунта' : 'Вход в аккаунт'}
          </h2>
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        {viewMode === 'select' ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              Выберите удобный способ авторизации для сохранения ваших досок в облаке и синхронизации:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <a href="/api/auth/github" className="btn-oauth btn-github">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Войти через GitHub
              </a>

              <a href="/api/auth/google" className="btn-oauth btn-google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Войти через Google
              </a>

              <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--github-border)' }}></div>
                <span style={{ padding: '0 0.8rem' }}>ИЛИ</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--github-border)' }}></div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', fontWeight: 600 }}
                onClick={() => setViewMode('guest_info')}
              >
                Продолжить без аккаунта
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, lineHeight: 1.45 }}>
              При работе без аккаунта все доски и задачи сохраняются <strong>локально в браузере (localStorage)</strong>.
            </p>

            {/* Pros Box */}
            <div style={{ background: 'rgba(46, 160, 67, 0.08)', border: '1px solid rgba(46, 160, 67, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ color: 'var(--github-green-text)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Плюсы работы без аккаунта:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                <li>Мгновенный старт без ввода паролей</li>
                <li>100% приватность (данные остаются только у вас)</li>
                <li>Работает даже без соединения с интернетом</li>
              </ul>
            </div>

            {/* Cons Box */}
            <div style={{ background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ color: '#f85149', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Минусы и ограничения:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <li>Данные привязаны только к текущему браузеру</li>
                <li>Очистка истории/кэша браузера сотрет доски</li>
                <li>Нет синхронизации с другими устройствами</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--github-green)', borderColor: 'var(--github-green-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', fontWeight: 700 }}
                onClick={() => {
                  onClose();
                  if (typeof onOpenGuestMode === 'function') onOpenGuestMode();
                }}
              >
                Продолжить без аккаунта
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
                onClick={() => setViewMode('select')}
              >
                ← Назад к выбору авторизации
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
