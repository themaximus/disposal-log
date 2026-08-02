import React from 'react';

export default function Sidebar({ boards, currentBoardId, onSelectBoard, onCreateBoard, onOpenShare, isCollapsed, onToggleCollapse }) {
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
                <button
                  className="btn-dots-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShare(b);
                  }}
                  title="Настройки доступа и шеринг"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>more_vert</span>
                </button>
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
