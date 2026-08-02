import React, { useState } from 'react';
import TaskCard from './TaskCard';
import TaskStack from './TaskStack';

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
