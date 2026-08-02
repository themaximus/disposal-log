import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function Column({ column, groupedItems, onEditColumn, onDeleteColumn, onEditTask, onDeleteTask, onUnlinkGroup, onDragStartTask, onDragOverTask, onDropTask, onDropColumn }) {
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
            className="btn-col-action"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Настройки колонки"
          >
            ⋮
          </button>
          
          {isMenuOpen && (
            <div
              className="floating-dropdown-menu"
              style={{ top: '30px', right: 0, minWidth: '160px' }}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button className="dropdown-item" onClick={() => { setIsMenuOpen(false); onEditColumn(column); }}>
                ✏️ Настроить
              </button>
              <button className="dropdown-item danger" onClick={() => { setIsMenuOpen(false); onDeleteColumn(column.id); }}>
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
        <div className="task-list">
          {groupedItems.map(item => {
            if (item.isStack) {
              return (
                <div key={`stack-${item.groupId}`} className="stack-container">
                  <div className="stack-badge-bar">
                    <span>📚 Стопка ({item.tasks.length})</span>
                    <button
                      className="btn-unlink-stack"
                      title="Рассгруппировать стопку"
                      onClick={() => onUnlinkGroup(item.groupId)}
                    >
                      🔓
                    </button>
                  </div>
                  {item.tasks.map((task, idx) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onDragStart={onDragStartTask}
                      onDragOver={onDragOverTask}
                      onDrop={onDropTask}
                    />
                  ))}
                </div>
              );
            }

            return (
              <TaskCard
                key={item.task.id}
                task={item.task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDragStart={onDragStartTask}
                onDragOver={onDragOverTask}
                onDrop={onDropTask}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
