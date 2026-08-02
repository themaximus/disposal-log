import React from 'react';
import TaskCard from './TaskCard';

export default function TaskStack({ groupId, tasks, onEditTask, onDeleteTask, onUnlinkGroup, onDragStartTask, onDragOverTask, onDropTask }) {
  // Show max 3 cards visually with diagonal 3D offset (0px, 4px, 8px)
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
        maxWidth: '100%',
        boxSizing: 'border-box',
        marginBottom: `calc(0.85rem + ${maxOffsetPx}px)`
      }}
    >
      <div className="stack-header-bar">
        <span className="stack-badge-pill" title={`Стопка из ${tasks.length} задач`}>
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>layers</span>
          {tasks.length}
        </span>
        <button
          className="btn-unlink-stack"
          title="Разгруппировать стопку"
          onClick={(e) => {
            e.stopPropagation();
            onUnlinkGroup(groupId);
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>unfold_more</span>
          <span className="unlink-text">Разгруппировать</span>
        </button>
      </div>

      <div
        className="stack-deck-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          height: '185px',
          boxSizing: 'border-box'
        }}
      >
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
                top: offsetIndex > 0 ? `${offsetPx}px` : 0,
                left: offsetIndex > 0 ? `${offsetPx}px` : 0,
                width: offsetIndex > 0 ? `calc(100% - ${offsetPx}px)` : '100%',
                height: '185px',
                boxSizing: 'border-box',
                zIndex: index + 1
              }}
            >
              <TaskCard
                task={task}
                isInStack={true}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDragStart={onDragStartTask}
                onDragOverTask={onDragOverTask}
                onDrop={onDropTask}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
