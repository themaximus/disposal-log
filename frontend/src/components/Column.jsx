import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function Column({ column, tasks, onEditColumn, onDeleteColumn, onEditTask, onDeleteTask, onDragStartTask, onDragOverTask, onDropTask, onDropColumn }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <section className="column" id={`column-${column.column_key}`}>
      <div className="column-header" style={{ borderTop: `3px solid ${column.color || '#388bfd'}` }}>
        <h2>
          {column.title} <span className="count">{tasks.length}</span>
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
          {tasks.map(task => (
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
      </div>
    </section>
  );
}
