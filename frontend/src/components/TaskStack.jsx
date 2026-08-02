import React from 'react';
import TaskCard from './TaskCard';

export default function TaskStack({ groupId, tasks, onEditTask, onDeleteTask, onUnlinkGroup, onDragStartTask, onDragOverTask, onDropTask }) {
  // Show max 3 cards visually with diagonal 3D offset (0px, 6px, 12px)
  const reversedTasks = [...tasks].reverse();
  const total = reversedTasks.length;
  const startVisibleIndex = Math.max(0, total - 3);

  const visibleCount = total - startVisibleIndex;
  const maxOffsetPx = (visibleCount - 1) * 6;

  return (
    <div
      className="stack-container"
      style={{
        position: 'relative',
        width: '100%',
        height: 'auto',
        minHeight: '160px',
        marginBottom: `calc(1rem + ${maxOffsetPx}px)`,
        marginRight: `${maxOffsetPx}px`
      }}
    >
      <div
        className="stack-badge-bar"
        style={{
          position: 'absolute',
          top: '-10px',
          right: '8px',
          zIndex: 999
        }}
      >
        <span>📚 Стопка ({tasks.length})</span>
        <button
          className="btn-unlink-stack"
          title="Разгруппировать стопку"
          onClick={(e) => {
            e.stopPropagation();
            onUnlinkGroup(groupId);
          }}
        >
          🔓
        </button>
      </div>

      {reversedTasks.map((task, index) => {
        const isVisible = index >= startVisibleIndex;
        if (!isVisible) return null;

        const offsetIndex = index - startVisibleIndex;
        const offsetPx = offsetIndex * 6;

        return (
          <div
            key={task.id}
            className="stack-card-layer"
            style={{
              position: offsetIndex > 0 ? 'absolute' : 'relative',
              top: offsetIndex > 0 ? `${offsetPx}px` : undefined,
              left: offsetIndex > 0 ? `${offsetPx}px` : undefined,
              width: '100%',
              zIndex: index + 1
            }}
          >
            <TaskCard
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={onDragStartTask}
              onDragOver={onDragOverTask}
              onDrop={onDropTask}
            />
          </div>
        );
      })}
    </div>
  );
}
