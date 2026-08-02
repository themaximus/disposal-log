import React from 'react';

export default function Sidebar({ boards, currentBoardId, onSelectBoard, onCreateBoard, onOpenShare, isCollapsed, onToggleCollapse }) {
  return (
    <aside className={`boards-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header-bar" onClick={onToggleCollapse} title="Свернуть / Развернуть сайдбар">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="sidebar-icon">📁</span>
          <span className="sidebar-heading" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Мои Доски</span>
        </div>
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{isCollapsed ? '▶' : '◀'}</span>
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
                <span className="board-item-icon">{b.icon || '📋'}</span>
                <span className="board-item-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.name}
                </span>
              </div>
              {!isCollapsed && (
                <button
                  className="btn-dots"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShare(b);
                  }}
                  title="Настройки доступа"
                >
                  🔗
                </button>
              )}
            </div>
          ))}
        </div>

        {!isCollapsed && (
          <button className="btn btn-secondary btn-new-board" style={{ marginTop: '0.8rem', width: '100%' }} onClick={onCreateBoard}>
            + Создать доску
          </button>
        )}
      </div>
    </aside>
  );
}
