import React from 'react';

export default function Header({ currentUser, onAddTask, onOpenProfile }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <div className="logo-icon-wrapper">
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
          </div>
          <div className="logo-text-group">
            <h1 className="github-title">
              PULSE <span className="text-green">// Task Control</span>
            </h1>
            <div className="system-status">
              <span className="status-dot"></span>
              <span>Dev Studio Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="header-controls">
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
              <span className="user-provider-badge">{currentUser.provider || 'GitHub'}</span>
            </div>
          </div>
        ) : (
          <a href="/auth/github" className="btn btn-secondary btn-small">
            🔑 Войти через GitHub
          </a>
        )}

        <button className="btn btn-primary" onClick={onAddTask}>
          + Добавить задачу
        </button>
      </div>
    </header>
  );
}
