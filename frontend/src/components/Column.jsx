import React from 'react';
import TaskCard from './TaskCard';

export default function Column({ column, tasks, onEditTask, onDeleteTask, onDragStartTask, onDragOverTask, onDropTask, onDropColumn }) {
  return (
    <section className="column" id={`column-${column.column_key}`}>
      <div className="column-header" style={{ borderTop: `3px solid ${column.color || '#388bfd'}` }}>
        <h2>
          {column.title} <span className="count">{tasks.length}</span>
        </h2>
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
