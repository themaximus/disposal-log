import React, { useState } from 'react';
import TaskCard from './TaskCard';
import TaskStack from './TaskStack';

export default function Column({ column, groupedItems, viewMode, onEditColumn, onDeleteColumn, onEditTask, onDeleteTask, onUnlinkGroup, onDragStartTask, onDragOverTask, onDropTask, onDropColumn }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Total task count
  const totalCount = groupedItems.reduce((acc, item) => item.isStack ? acc + item.tasks.length : acc + 1, 0);

  return (
    <section className="column" id={`column-${column.column_key}`}>
      <div className="column-header" style={{ borderTop: `3px solid ${column.color || '#388bfd'}` }}>
        <h2>
          {column.title} <span className="count">{totalCount}</span>
        </h2>
        
        <div style={{ position: 'relative' }}>
          <button
            className="btn-dots-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Настройки колонки"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>
          
          {isMenuOpen && (
            <div
              className="floating-dropdown-menu"
              style={{
                position: 'absolute',
                top: '32px',
                right: 0,
                minWidth: '160px',
                background: 'var(--github-surface)',
                border: '1px solid var(--github-border)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 9999,
                padding: '0.4rem'
              }}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button
                className="dropdown-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
                onClick={() => { setIsMenuOpen(false); onEditColumn(column); }}
              >
                ✏️ Настроить
              </button>
              <button
                className="dropdown-item danger"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--github-red-text)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
                onClick={() => { setIsMenuOpen(false); onDeleteColumn(column.id); }}
              >
                🗑️ Удалить
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="column-body"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDropColumn(e, column.column_key)}
      >
        <div
          className="task-list"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${viewMode || 1}, minmax(0, 1fr))`,
            gap: '0.85rem',
            alignContent: 'start',
            alignItems: 'start'
          }}
        >
          {groupedItems.map(item => {
            if (item.isStack) {
              return (
                <TaskStack
                  key={`stack-${item.groupId}`}
                  groupId={item.groupId}
                  tasks={item.tasks}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onUnlinkGroup={onUnlinkGroup}
                  onDragStartTask={onDragStartTask}
                  onDragOverTask={onDragOverTask}
                  onDropTask={onDropTask}
                />
              );
            }

            return (
              <TaskCard
                key={item.task.id}
                task={item.task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDragStart={onDragStartTask}
                onDragOverTask={onDragOverTask}
                onDrop={onDropTask}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
