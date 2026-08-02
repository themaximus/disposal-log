import React from 'react';

export default function TaskCard({ task, onEdit, onDelete, onDragStart, onDragOver, onDrop }) {
  const diffStars = '★'.repeat(task.difficulty || 1) + '☆'.repeat(3 - (task.difficulty || 1));
  
  const validCover = (task.images && task.images.length > 0 && typeof task.images[0] === 'string' && task.images[0].startsWith('/uploads/'))
    ? task.images[0]
    : (task.image_url && task.image_url.startsWith('/uploads/')) ? task.image_url : null;

  return (
    <div
      className="task-card"
      data-diff={task.difficulty || 1}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={(e) => onDragOver(e, task)}
      onDrop={(e) => onDrop(e, task)}
    >
      {validCover && (
        <img
          src={validCover}
          alt="Cover"
          className="card-banner"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
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
