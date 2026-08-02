import React, { useState } from 'react';

export default function Sidebar({ boards, currentBoardId, onSelectBoard, onCreateBoard, onOpenShare, onOpenManageColumns, isCollapsed, onToggleCollapse }) {
  const [activeMenuBoardId, setActiveMenuBoardId] = useState(null);

  return (
    <aside className={`boards-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header-bar" onClick={onToggleCollapse} title="Свернуть / Развернуть сайдбар">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="sidebar-folder-wrapper">
            <span className="material-symbols-outlined sidebar-icon">folder</span>
            <span className="material-symbols-outlined sidebar-hover-arrow">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </div>
          <span className="sidebar-heading" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Мои Доски</span>
        </div>
      </div>

      <div className="sidebar-content">
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
                <span className="board-item-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.name}
                </span>
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
    </aside>
  );
}
