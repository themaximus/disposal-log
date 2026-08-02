import React, { useState, useEffect } from 'react';

export default function TaskModal({ taskToEdit, boardId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [images, setImages] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|webm|mov|ogg)$/i.test(url);

  const parseGoogleDriveUrl = (url) => {
    if (typeof url !== 'string') return url;
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return url;
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setDifficulty(taskToEdit.difficulty || 1);
      
      let existingMedia = [];
      if (Array.isArray(taskToEdit.images) && taskToEdit.images.length > 0) {
        existingMedia = taskToEdit.images;
      } else if (typeof taskToEdit.images_json === 'string') {
        try {
          const parsed = JSON.parse(taskToEdit.images_json);
          if (Array.isArray(parsed)) existingMedia = parsed;
        } catch (e) {}
      } else if (taskToEdit.image_url) {
        existingMedia = [taskToEdit.image_url];
      }
      setImages(existingMedia);

      let existingSubtasks = [];
      if (Array.isArray(taskToEdit.subtasks)) {
        existingSubtasks = taskToEdit.subtasks;
      } else if (typeof taskToEdit.subtasks_json === 'string') {
        try {
          const parsed = JSON.parse(taskToEdit.subtasks_json);
          if (Array.isArray(parsed)) existingSubtasks = parsed;
        } catch(e) {}
      }
      setSubtasks(existingSubtasks);
    }
  }, [taskToEdit]);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setIsUploading(true);

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.urls && Array.isArray(data.urls)) {
          setImages(prev => [...prev, ...data.urls]);
        }
      })
      .catch(console.error)
      .finally(() => setIsUploading(false));
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newItem = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks(prev => [...prev, newItem]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (index) => {
    setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, completed: !st.completed } : st));
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const completedCount = subtasks.filter(st => st.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: taskToEdit && taskToEdit.id ? taskToEdit.id : null,
      board_id: boardId,
      status: taskToEdit && taskToEdit.status ? taskToEdit.status : undefined,
      title,
      description,
      difficulty,
      images,
      subtasks
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>{taskToEdit ? 'Редактировать Механику' : 'Новая Механика'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название механики</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Система крафта / Логика стрельбы"
            />
          </div>
          
          <div className="form-group">
            <label>Описание задачи</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробное ТЗ механики..."
            />
          </div>

          {/* Sub-tasks Checklists Section */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>checklist</span>
                Чек-лист Подзадач
              </label>
              {subtasks.length > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--github-blue-text)' }}>
                  {completedCount} из {subtasks.length} ({progressPercent}%)
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="subtask-progress-bar-wrapper" style={{ height: '5px', background: 'var(--github-canvas)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.6rem', border: '1px solid var(--github-border)' }}>
                <div
                  className="subtask-progress-fill"
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: progressPercent === 100 ? 'var(--github-green-text)' : 'var(--github-blue)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            )}

            <div className="subtask-input-group" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                value={newSubtaskText}
                onChange={e => setNewSubtaskText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="Добавить пункт чек-листа (например: Настроить коллайдеры)..."
                style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddSubtask}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                + Пункт
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="subtasks-editor-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="subtask-editor-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--github-canvas)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--github-border)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, overflow: 'hidden' }}>
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(idx)}
                        style={{ accentColor: 'var(--github-green)' }}
                      />
                      <span style={{
                        fontSize: '0.82rem',
                        color: st.completed ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: st.completed ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {st.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--github-red-text)', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                      title="Удалить пункт"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Медиафайлы (Изображения и Видео MP4/WebM)</label>
            
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (imageUrlInput.trim()) {
                      const formatted = parseGoogleDriveUrl(imageUrlInput.trim());
                      setImages(prev => [...prev, formatted]);
                      setImageUrlInput('');
                    }
                  }
                }}
                placeholder="Вставьте ссылку на картинку или ссылку с Google Drive..."
                style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.82rem' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    const formatted = parseGoogleDriveUrl(imageUrlInput.trim());
                    setImages(prev => [...prev, formatted]);
                    setImageUrlInput('');
                  }
                }}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                + Ссылка
              </button>
            </div>

            <label className="custom-upload-zone">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-zone-content">
                <span className="material-symbols-outlined upload-icon" style={{ fontSize: '1.8rem', color: 'var(--github-blue-text)' }}>cloud_upload</span>
                <div>
                  <span className="upload-title">
                    {isUploading ? 'Загрузка файлов...' : 'Выбрать локальные файлы'}
                  </span>
                  <span className="upload-subtitle">Поддерживаются PNG, JPG, MP4, WebM</span>
                </div>
              </div>
            </label>

            {images.length > 0 && (
              <div className="media-preview-grid">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="media-preview-item">
                    {isVideoUrl(imgUrl) ? (
                      <video src={imgUrl} />
                    ) : (
                      <img src={imgUrl} alt="Preview" />
                    )}
                    <button
                      type="button"
                      className="btn-remove-media"
                      onClick={() => handleRemoveImage(idx)}
                      title="Удалить файл"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Сложность (Звёзды)</label>
            <div className="star-rating-picker">
              {[1, 2, 3].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`star-picker-btn ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  <span className="star-icons">{'★'.repeat(d)}</span>
                  <span className="star-label">
                    {d === 1 ? 'Низкая' : d === 2 ? 'Средняя' : 'Высокая'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              {taskToEdit ? 'Сохранить изменения' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
