import React, { useState, useEffect } from 'react';

export default function TaskCard({ task, isInStack, isDwellStackReady, onEdit, onDelete, onSubtasksChange, onDragStart, onDragOverTask, onDragOver, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);

  useEffect(() => {
    if (Array.isArray(task.subtasks)) {
      setSubtasks(task.subtasks);
    } else if (typeof task.subtasks_json === 'string') {
      try {
        const parsed = JSON.parse(task.subtasks_json);
        if (Array.isArray(parsed)) setSubtasks(parsed);
      } catch (e) {}
    }
  }, [task.subtasks, task.subtasks_json]);

  const diffStars = '★'.repeat(task.difficulty || 1) + '☆'.repeat(3 - (task.difficulty || 1));
  
  const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|webm|mov|ogg)$/i.test(url);

  const getMediaList = () => {
    if (Array.isArray(task.images) && task.images.length > 0) return task.images;
    if (typeof task.images_json === 'string') {
      try {
        const parsed = JSON.parse(task.images_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (task.image_url) return [task.image_url];
    return [];
  };

  const mediaList = getMediaList();
  const firstMedia = mediaList.length > 0 ? mediaList[0] : null;

  const dragOverHandler = onDragOverTask || onDragOver;

  // Toggle subtask directly from card
  const handleToggleSubtask = (e, index) => {
    e.stopPropagation();
    const updated = subtasks.map((st, i) => i === index ? { ...st, completed: !st.completed } : st);
    setSubtasks(updated);

    if (typeof onSubtasksChange === 'function') {
      onSubtasksChange(task.id, updated);
    } else {
      fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updated })
      }).catch(console.error);
    }
  };

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      className={`task-card ${isInStack ? 'in-stack' : ''} ${isDragOver ? 'drag-over-target' : ''} ${isDwellStackReady ? 'dwell-ready' : ''}`}
      data-diff={task.difficulty || 1}
      draggable
      onClick={(e) => {
        if (!e.target.closest('button, input, label, a')) {
          onEdit(task);
        }
      }}
      onDragStart={(e) => {
        if (typeof onDragStart === 'function') onDragStart(e, task);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        if (typeof dragOverHandler === 'function') dragOverHandler(e, task);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        if (typeof onDrop === 'function') onDrop(e, task);
      }}
    >
      {isDragOver && (
        isDwellStackReady ? (
          <div className="drop-stack-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>layers</span>
            Создать стопку
          </div>
        ) : (
          <div className="drop-dwell-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="material-symbols-outlined sync-spinner" style={{ fontSize: '0.85rem' }}>timer</span>
            Удерживайте 2 сек. для стопки
          </div>
        )
      )}

      {firstMedia && (
        <div style={{ position: 'relative', width: '100%' }}>
          {isVideoUrl(firstMedia) ? (
            <video
              src={firstMedia}
              className="card-banner"
              autoPlay
              muted
              loop
              playsInline
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <img
              src={firstMedia}
              alt="Cover"
              className="card-banner"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {mediaList.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>collections</span>
              {mediaList.length}
            </div>
          )}
        </div>
      )}

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{task.title}</h3>
          <span className="card-stars">{diffStars}</span>
        </div>

        {task.description && (
          <p className="card-desc">{task.description}</p>
        )}

        {/* Sub-task Minimalistic & Subtle Box */}
        {totalSubtasks > 0 && (
          <div className="card-subtasks-box">
            <div className="subtasks-box-header">
              <span className={`subtask-badge-pill ${completedSubtasks === totalSubtasks ? 'done' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>checklist</span>
                Чек-лист {completedSubtasks}/{totalSubtasks}
              </span>
              <span className="subtask-percent-text">{subtaskPercent}%</span>
            </div>
            
            <div className="card-subtask-progress-track">
              <div
                className={`subtask-progress-bar-fill ${completedSubtasks === totalSubtasks ? 'done' : ''}`}
                style={{ width: `${subtaskPercent}%` }}
              />
            </div>

            {!isInStack && (
              <div className="card-subtask-quick-list">
                {subtasks.map((st, idx) => (
                  <label
                    key={st.id || idx}
                    className={`subtask-row ${st.completed ? 'completed' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={(e) => handleToggleSubtask(e, idx)}
                    />
                    <span className="subtask-text">{st.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="card-tags">
            {task.tags.map((t, idx) => (
              <span key={idx} className="tag-badge" style={{ backgroundColor: t.color || '#3b82f6' }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        <div className="card-footer">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>calendar_today</span>
            {task.created_at ? new Date(task.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'Сегодня'}
          </span>
          <div className="card-actions" style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-icon edit" onClick={(e) => { e.stopPropagation(); onEdit(task); }} title="Редактировать">
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>edit</span>
            </button>
            <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} title="Удалить">
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
