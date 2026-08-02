import React, { useState } from 'react';

export default function TaskCard({ task, isInStack, onEdit, onDelete, onDragStart, onDragOverTask, onDragOver, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);

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
