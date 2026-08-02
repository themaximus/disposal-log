import React, { useState, useEffect } from 'react';

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
  onToggleBoardMode,
  onOpenSyncModal,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobileDrawer
}) {
  const [activeMenuBoardId, setActiveMenuBoardId] = useState(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsFilterPanelOpen(false);
    }
  }, [isCollapsed]);

  const handleMobileNavClick = (action) => {
    if (typeof onCloseMobileDrawer === 'function') onCloseMobileDrawer();
    action();
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar_url) return user.avatar_url;
    if (user.github_id) return `https://avatars.githubusercontent.com/u/${user.github_id}?v=4`;
    return null;
  };

  return (
    <aside className={`boards-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Top Group: Brand Header & Nav Tabs */}
      <div className="sidebar-top-group">
        {/* Brand Header: Entire block (PULSE + Folder) is clickable to toggle collapse */}
        <div
          className="sidebar-brand-header"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
        >
          <div className="sidebar-logo-block">
            <div className="sidebar-folder-wrapper">
              <span className="material-symbols-outlined sidebar-icon">folder</span>
              <span className="material-symbols-outlined sidebar-hover-arrow">
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </div>

            {!isCollapsed && (
              <div className="sidebar-logo-text">
                <span className="github-title" style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>PULSE</span>
                <span className="system-status">
                  <span className="status-dot"></span> Online
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Nav Tabs */}
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
            onClick={() => handleMobileNavClick(() => onSelectTab('workspace'))}
            title="Рабочее пространство Задачи"
          >
            <span className="material-symbols-outlined">space_dashboard</span>
            {!isCollapsed && <span>Задачи</span>}
          </button>

          {/* Collapsible Filter / View Modes Dropdown Panel */}
          {currentTab === 'workspace' && (
            <div className="sidebar-filter-wrapper" style={{ position: 'relative' }}>
              <button
                className={`sidebar-nav-btn ${isFilterPanelOpen ? 'active' : ''}`}
                onClick={() => {
                  if (isCollapsed) onToggleCollapse();
                  setIsFilterPanelOpen(!isFilterPanelOpen);
                }}
                title="Вид и Фильтры"
              >
                <span className="material-symbols-outlined">tune</span>
                {!isCollapsed && <span>Вид и Фильтры</span>}
                {!isCollapsed && (
                  <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '0.9rem' }}>
                    {isFilterPanelOpen ? 'expand_less' : 'expand_more'}
                  </span>
                )}
              </button>

              {isFilterPanelOpen && !isCollapsed && (
                <div className="sidebar-filter-panel">
                  <div className="filter-panel-section">
                    <span className="filter-section-title">Количество карточек в ряд:</span>
                    <div className="view-modes-panel-grid">
                      <button
                        className={`btn-view-panel ${viewMode === 1 ? 'active' : ''}`}
                        onClick={() => onChangeViewMode(1)}
                      >
                        1 столбик
                      </button>
                      <button
                        className={`btn-view-panel ${viewMode === 2 ? 'active' : ''}`}
                        onClick={() => onChangeViewMode(2)}
                      >
                        2 столбика
                      </button>
                      <button
                        className={`btn-view-panel ${viewMode === 3 ? 'active' : ''}`}
                        onClick={() => onChangeViewMode(3)}
                      >
                        3 столбика
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Group: Boards List (Scrollable) */}
      <div className="sidebar-content">
        <div className="sidebar-boards-header">
          {!isCollapsed && (
            <span className="sidebar-heading">
              {currentUser ? 'МОИ ДОСКИ' : 'ГОСТЕВАЯ ДОСКА'}
            </span>
          )}
        </div>

        <div className="boards-list">
          {boards.map(b => (
            <div
              key={b.id}
              className={`board-item ${b.id === currentBoardId ? 'active' : ''}`}
              onClick={() => handleMobileNavClick(() => onSelectBoard(b.id))}
              style={{ position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1 }}>
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
                {!isCollapsed && b.is_offline && (
                  <span className="offline-badge" style={{ fontSize: '0.62rem', background: 'rgba(56, 139, 253, 0.15)', color: 'var(--github-blue-text)', border: '1px solid rgba(56, 139, 253, 0.3)', padding: '0.05rem 0.3rem', borderRadius: '4px', marginLeft: 'auto' }}>
                    Офлайн
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
                    title="Настройки доски и режима"
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
                        minWidth: '190px',
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
                          if (typeof onOpenSyncModal === 'function') onOpenSyncModal(b);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--github-blue-text)' }}>
                          cloud_sync
                        </span>
                        Синхронизация
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

        {!isCollapsed && currentUser && (
          <button className="btn btn-secondary btn-new-board" style={{ marginTop: '0.6rem', width: '100%' }} onClick={onCreateBoard}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: '4px' }}>add</span>
            Создать доску
          </button>
        )}
      </div>

      {/* Bottom Fixed Footer: Settings Gear ON TOP (only for logged in users), Profile UNDERNEATH */}
      <div className="sidebar-footer">
        {/* Settings Button on Top */}
        {currentUser && (
          <button
            className="btn-sidebar-settings-full"
            onClick={onOpenSettings}
            title="Настройки TG и Системы"
          >
            <span className="material-symbols-outlined gear-icon">settings</span>
            {!isCollapsed && <span>Настройки системы</span>}
          </button>
        )}

        {/* User Profile Widget Underneath */}
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
      </div>
    </aside>
  );
}
