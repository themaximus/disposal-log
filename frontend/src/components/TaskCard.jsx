import React, { useState } from 'react';

export default function TaskCard({ task, isInStack, onEdit, onDelete, onDragStart, onDragOverTask, onDragOver, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);

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

    fetch(`/api/tasks/${task.id}/subtasks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks: updated })
    }).catch(console.error);
  };

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      className={`task-card ${isInStack ? 'in-stack' : ''} ${isDragOver ? 'drag-over-target' : ''}`}
      data-diff={task.difficulty || 1}
      draggable
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
        <div className="drop-stack-badge">
          ➕ Создать стопку
        </div>
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
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              🖼️ {mediaList.length}
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

        {/* Sub-task Progress Badge & Bar */}
        {totalSubtasks > 0 && (
          <div className="card-subtasks-section" style={{ marginTop: '0.55rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span className="subtask-badge-pill" style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: completedSubtasks === totalSubtasks ? 'var(--github-green-text)' : 'var(--github-blue-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                ☑️ {completedSubtasks}/{totalSubtasks} ({subtaskPercent}%)
              </span>
            </div>
            <div className="card-subtask-progress-track" style={{
              height: '4px',
              background: 'var(--github-canvas)',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--github-border)'
            }}>
              <div style={{
                height: '100%',
                width: `${subtaskPercent}%`,
                background: completedSubtasks === totalSubtasks ? 'var(--github-green-text)' : 'var(--github-blue)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Quick interactive subtask items (Visible in non-stack or 1-column view) */}
            {!isInStack && (
              <div className="card-subtask-quick-list" style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {subtasks.map((st, idx) => (
                  <label
                    key={st.id || idx}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      color: st.completed ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: st.completed ? 'line-through' : 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={(e) => handleToggleSubtask(e, idx)}
                      style={{ accentColor: 'var(--github-green)' }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.text}
                    </span>
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
          <span>📅 {task.created_at ? new Date(task.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'Сегодня'}</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-icon edit" onClick={() => onEdit(task)} title="Редактировать">✏️</button>
            <button className="btn-icon delete" onClick={() => onDelete(task.id)} title="Удалить">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  );
}
