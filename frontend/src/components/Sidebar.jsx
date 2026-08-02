import React, { useState } from 'react';

export default function Sidebar({
  currentUser,
  currentTab,
  viewMode,
  onSelectTab,
  onChangeViewMode,
  onOpenAuth,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  boards,
  currentBoardId,
  onSelectBoard,
  onCreateBoard,
  onOpenShare,
  onOpenManageColumns,
  isCollapsed,
  onToggleCollapse
}) {
  const [activeMenuBoardId, setActiveMenuBoardId] = useState(null);

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar_url) return user.avatar_url;
    if (user.github_id) return `https://avatars.githubusercontent.com/u/${user.github_id}?v=4`;
    return null;
  };

  return (
    <aside className={`boards-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Top Brand Header */}
      <div className="sidebar-brand-header">
        <div className="sidebar-logo-block">
          <span className="material-symbols-outlined" style={{ color: 'var(--github-green-text)', fontSize: '1.4rem' }}>
            rocket_launch
          </span>
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <span className="github-title" style={{ fontSize: '1.05rem' }}>PULSE</span>
              <span className="system-status">
                <span className="status-dot"></span> Online
              </span>
            </div>
          )}
        </div>

        <button
          className="btn-collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Navigation Tabs (Главная / Задачи) */}
      <div className="sidebar-nav-section">
        <button
          className={`sidebar-nav-btn ${currentTab === 'landing' ? 'active' : ''}`}
          onClick={() => onSelectTab('landing')}
          title="Главная страница"
        >
          <span className="material-symbols-outlined">home</span>
          {!isCollapsed && <span>Главная</span>}
        </button>

        <button
          className={`sidebar-nav-btn ${currentTab === 'workspace' ? 'active' : ''}`}
          onClick={() => onSelectTab('workspace')}
          title="Рабочее пространство Задачи"
        >
          <span className="material-symbols-outlined">space_dashboard</span>
          {!isCollapsed && <span>Задачи</span>}
        </button>
      </div>

      {/* View Mode Switcher (1, 2, 3) */}
      {currentTab === 'workspace' && (
        <div className="sidebar-view-modes-box">
          {!isCollapsed && <span className="sidebar-subheading">Вид:</span>}
          <div className="view-modes" style={{ width: isCollapsed ? '100%' : 'auto', justifyContent: 'center' }}>
            <button
              className={`btn-view ${viewMode === 1 ? 'active' : ''}`}
              onClick={() => onChangeViewMode(1)}
              title="1 карточка в ряд"
            >
              1
            </button>
            <button
              className={`btn-view ${viewMode === 2 ? 'active' : ''}`}
              onClick={() => onChangeViewMode(2)}
              title="2 карточки в ряд"
            >
              2
            </button>
            <button
              className={`btn-view ${viewMode === 3 ? 'active' : ''}`}
              onClick={() => onChangeViewMode(3)}
              title="3 карточки в ряд"
            >
              3
            </button>
          </div>
        </div>
      )}

      <hr className="sidebar-divider" />

      {/* Boards Section */}
      <div className="sidebar-content">
        <div className="sidebar-boards-header">
          {!isCollapsed && <span className="sidebar-heading">Мои Доски</span>}
        </div>

        <div className="boards-list">
          {boards.map(b => (
            <div
              key={b.id}
              className={`board-item ${b.id === currentBoardId ? 'active' : ''}`}
              onClick={() => onSelectBoard(b.id)}
              style={{ position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                {b.icon && !b.icon.includes('http') && b.icon.length > 2 ? (
                  <span className="material-symbols-outlined board-item-icon">{b.icon}</span>
                ) : (
                  <span className="material-symbols-outlined board-item-icon">space_dashboard</span>
                )}
                {!isCollapsed && (
                  <span className="board-item-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.name}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn-dots-menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuBoardId(activeMenuBoardId === b.id ? null : b.id);
                    }}
                    title="Настройки доски и колонок"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>more_vert</span>
                  </button>

                  {activeMenuBoardId === b.id && (
                    <div
                      className="floating-dropdown-menu"
                      style={{
                        position: 'absolute',
                        top: '30px',
                        right: 0,
                        minWidth: '180px',
                        background: 'var(--github-surface)',
                        border: '1px solid var(--github-border)',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        zIndex: 9999,
                        padding: '0.4rem'
                      }}
                      onMouseLeave={() => setActiveMenuBoardId(null)}
                    >
                      <button
                        className="dropdown-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuBoardId(null);
                          onOpenManageColumns(b);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>view_column</span>
                        Порядок колонок
                      </button>

                      <button
                        className="dropdown-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuBoardId(null);
                          onOpenShare(b);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>share</span>
                        Доступ и шеринг
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <button className="btn btn-secondary btn-new-board" style={{ marginTop: '0.8rem', width: '100%' }} onClick={onCreateBoard}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: '4px' }}>add</span>
            Создать доску
          </button>
        )}
      </div>

      {/* Bottom Footer Section: User Profile & Settings */}
      <div className="sidebar-footer">
        {currentUser ? (
          <div className="sidebar-user-widget" onClick={onOpenProfile} title="Профиль пользователя">
            <div className="user-avatar-wrapper" style={{ width: '28px', height: '28px' }}>
              {getAvatarUrl(currentUser) ? (
                <img src={getAvatarUrl(currentUser)} alt="Avatar" className="user-avatar-img" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>account_circle</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="user-info-text">
                <span className="user-name-text">{currentUser.username || currentUser.email || 'Пользователь'}</span>
                <span className="user-provider-badge">{currentUser.auth_provider || 'local'}</span>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-primary btn-sidebar-login" onClick={onOpenAuth} title="Войти">
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>login</span>
            {!isCollapsed && <span>Войти</span>}
          </button>
        )}

        <button className="btn-icon sidebar-settings-btn" onClick={onOpenSettings} title="Настройки TG и Системы">
          <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>settings</span>
        </button>
      </div>
    </aside>
  );
}
