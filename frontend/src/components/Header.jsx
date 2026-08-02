import React from 'react';

export default function Header({ currentUser, currentTab, viewMode, onSelectTab, onChangeViewMode, onOpenAuth, onOpenProfile, onOpenSettings, onAddTask, onLogout }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo" onClick={() => onSelectTab('landing')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-wrapper">
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
          </div>
          <div className="logo-text-group">
            <h1 className="github-title" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>PULSE</h1>
            <div className="system-status">
              <span className="status-dot"></span>
              <span>Task Control // Dev Studio</span>
            </div>
          </div>
        </div>

        <nav className="nav-tabs-group">
          <button
            className={`nav-tab-btn ${currentTab === 'landing' ? 'active' : ''}`}
            onClick={() => onSelectTab('landing')}
          >
            Главная
          </button>
          <button
            className={`nav-tab-btn ${currentTab === 'workspace' ? 'active' : ''}`}
            onClick={() => onSelectTab('workspace')}
          >
            Задачи
          </button>
        </nav>
      </div>

      <div className="header-controls">
        {currentTab === 'workspace' && (
          <div className="view-modes">
            {[1, 2, 3].map(m => (
              <button
                key={m}
                className={`btn-view ${viewMode === m ? 'active' : ''}`}
                onClick={() => onChangeViewMode(m)}
                title={`${m} колонок`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {currentUser ? (
          <div className="user-profile-widget" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
            <div className="user-avatar-wrapper">
              <img
                src={currentUser.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}
                alt="Avatar"
                className="user-avatar-img"
              />
            </div>
            <div className="user-info-text">
              <span className="user-name-text">{currentUser.name || currentUser.email}</span>
              <span className="user-provider-badge">{currentUser.provider === 'github' ? 'GitHub 🐙' : 'Google 🔴'}</span>
            </div>
            <button
              className="btn-logout-icon"
              title="Выйти из аккаунта"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <circle cx="12" cy="12" r="10" fill="#f85149"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            Войти
          </button>
        )}

        <button className="btn btn-secondary" onClick={onOpenSettings} title="Настройки TG и Системы">
          ⚙️
        </button>

        {currentTab === 'workspace' && (
          <button className="btn btn-primary" onClick={onAddTask}>
            ＋ Добавить задачу
          </button>
        )}
      </div>
    </header>
  );
}
