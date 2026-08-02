import React from 'react';

export default function Header({ currentUser, currentTab, onSelectTab, onOpenAuth, onOpenProfile, onAddTask }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo" onClick={() => onSelectTab('landing')} style={{ cursor: 'pointer' }}>
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

        <div className="nav-tabs-group">
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
              <span className="user-provider-badge">{currentUser.provider === 'github' ? 'GitHub' : 'Google'}</span>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary btn-small" onClick={onOpenAuth}>
            🔑 Войти
          </button>
        )}

        {currentTab === 'workspace' && (
          <button className="btn btn-primary" onClick={onAddTask}>
            + Добавить задачу
          </button>
        )}
      </div>
    </header>
  );
}
