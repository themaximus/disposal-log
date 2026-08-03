import React, { useState, useEffect } from 'react';

export default function TaskViewModal({ task, columns, onClose, onEdit, onSubtasksChange }) {
  const [subtasks, setSubtasks] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(null); // Lightbox state: null or index

  useEffect(() => {
    if (task) {
      if (Array.isArray(task.subtasks)) {
        setSubtasks(task.subtasks);
      } else if (typeof task.subtasks_json === 'string') {
        try {
          const parsed = JSON.parse(task.subtasks_json);
          if (Array.isArray(parsed)) setSubtasks(parsed);
        } catch (e) {}
      }
    }
  }, [task]);

  if (!task) return null;

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

  const handleToggleSubtask = (index) => {
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
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const diffColors = {
    1: '#3fb950',
    2: '#d29922',
    3: '#f85149',
    4: '#388bfd',
    5: '#a371f7',
    6: '#8b949e'
  };

  const currentColumn = Array.isArray(columns)
    ? columns.find(c => c.column_key === task.status || String(c.id) === String(task.status))
    : null;

  const columnTitle = currentColumn ? currentColumn.title : (task.status || 'Задачи');
  const columnColor = currentColumn ? currentColumn.color : (diffColors[task.difficulty || 1] || '#3fb950');

  const currentMedia = activeMediaIndex !== null ? mediaList[activeMediaIndex] : null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '680px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start', gap: '0.75rem', borderBottom: '1px solid var(--github-border)', paddingBottom: '0.85rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: columnColor
                }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {columnTitle}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: 1.35 }}>
              {task.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              onClick={() => { onClose(); onEdit(task); }}
              title="Редактировать задачу"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
              Редактировать
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '1.1rem 0.2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Description Section */}
          <div>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>notes</span>
              Подробное описание
            </h4>

            {task.description ? (
              <div
                style={{
                  background: 'var(--github-canvas)',
                  border: '1px solid var(--github-border)',
                  borderRadius: '8px',
                  padding: '1rem 1.1rem',
                  fontSize: '0.92rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {task.description}
              </div>
            ) : (
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Описание отсутствует. Нажмите «Редактировать», чтобы добавить подробности.
              </div>
            )}
          </div>

          {/* Subtasks Checklist Section */}
          {totalSubtasks > 0 && (
            <div style={{ background: 'var(--github-surface)', border: '1px solid var(--github-border)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--github-blue-text)' }}>checklist</span>
                  Чек-лист задач ({completedSubtasks}/{totalSubtasks})
                </h4>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: progressPercent === 100 ? '#3fb950' : 'var(--text-muted)' }}>
                  {progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', background: 'var(--github-border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: progressPercent === 100 ? '#3fb950' : '#388bfd',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Subtasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {subtasks.map((st, idx) => (
                  <label
                    key={st.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: 'var(--github-canvas)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--github-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(idx)}
                      style={{ accentColor: '#3fb950', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.86rem', color: st.completed ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: st.completed ? 'line-through' : 'none' }}>
                      {st.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Media Gallery Section */}
          {mediaList.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>collections</span>
                Медиафайлы
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                {mediaList.map((mediaUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    style={{
                      position: 'relative',
                      height: '130px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--github-border)',
                      background: '#000',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                    className="media-gallery-thumb"
                  >
                    {isVideoUrl(mediaUrl) ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                        <video
                          src={`${mediaUrl}#t=0.1`}
                          preload="metadata"
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.35)'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '2.4rem', color: '#ffffff', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>
                            play_circle
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={`Attachment ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity 0.2s' }} className="thumb-overlay" />
                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>zoom_in</span>
                      Открыть
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div style={{ borderTop: '1px solid var(--github-border)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <div>
            Создано: {task.created_at ? new Date(task.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Сегодня'}
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.35rem 0.85rem' }}>
            Закрыть
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox / Large Media Viewer Overlay */}
      {currentMedia && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setActiveMediaIndex(null)}
        >
          {/* Top Bar for Lightbox */}
          <div
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              zIndex: 10
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Медиафайл {activeMediaIndex + 1} из {mediaList.length}
            </div>
            <button
              onClick={() => setActiveMediaIndex(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Prev / Next Buttons */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((activeMediaIndex - 1 + mediaList.length) % mediaList.length);
                }}
                style={{
                  position: 'absolute',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
                title="Предыдущее"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex((activeMediaIndex + 1) % mediaList.length);
                }}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
                title="Следующее"
              >
                ›
              </button>
            </>
          )}

          {/* Large Media Content Display */}
          <div style={{ maxWidth: '90vw', maxHeight: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            {isVideoUrl(currentMedia) ? (
              <video
                src={currentMedia}
                controls
                autoPlay
                style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}
              />
            ) : (
              <img
                src={currentMedia}
                alt="Full Preview"
                style={{ maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
