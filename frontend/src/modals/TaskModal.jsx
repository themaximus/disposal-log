import React, { useState, useEffect } from 'react';

async function uploadFileDirectToGoogleDrive(fileObj, accessToken) {
  const metadata = {
    name: fileObj.name,
    mimeType: fileObj.type || 'application/octet-stream'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const arrayBuffer = await fileObj.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + (fileObj.type || 'application/octet-stream') + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    close_delim;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  const data = await res.json();
  if (!data.id) throw new Error('Google Drive upload failed');

  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  return `https://lh3.googleusercontent.com/d/${data.id}`;
}

export default function TaskModal({ taskToEdit, task, boardId, currentUser, onClose, onSave }) {
  const activeTask = taskToEdit || task;
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
    if (activeTask) {
      setTitle(activeTask.title || '');
      setDescription(activeTask.description || '');
      setDifficulty(activeTask.difficulty || 1);
      
      let existingMedia = [];
      if (Array.isArray(activeTask.images) && activeTask.images.length > 0) {
        existingMedia = activeTask.images;
      } else if (typeof activeTask.images_json === 'string') {
        try {
          const parsed = JSON.parse(activeTask.images_json);
          if (Array.isArray(parsed)) existingMedia = parsed;
        } catch (e) {}
      } else if (activeTask.image_url) {
        existingMedia = [activeTask.image_url];
      }
      setImages(existingMedia);

      let existingSubtasks = [];
      if (Array.isArray(activeTask.subtasks)) {
        existingSubtasks = activeTask.subtasks;
      } else if (typeof activeTask.subtasks_json === 'string') {
        try {
          const parsed = JSON.parse(activeTask.subtasks_json);
          if (Array.isArray(parsed)) existingSubtasks = parsed;
        } catch(e) {}
      }
      setSubtasks(existingSubtasks);
    }
  }, [activeTask]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const googleToken = currentUser && currentUser.google_access_token;

    if (!googleToken) {
      window.location.href = '/api/auth/google-drive';
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const driveUrl = await uploadFileDirectToGoogleDrive(files[i], googleToken);
        uploadedUrls.push(driveUrl);
      }
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Direct Google Drive upload error:', err);
    } finally {
      setIsUploading(false);
    }
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
      id: activeTask && activeTask.id ? activeTask.id : null,
      board_id: boardId,
      status: activeTask && activeTask.status ? activeTask.status : undefined,
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
          <h2>{activeTask ? 'Редактировать Механику' : 'Новая Механика'}</h2>
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
            
            {currentUser && currentUser.google_access_token ? (
              <div style={{
                background: 'rgba(46, 160, 67, 0.1)',
                border: '1px solid rgba(46, 160, 67, 0.3)',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--github-green-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#2ea043' }}>check_circle</span>
                  Google Диск подключен. Все медиафайлы хранятся в нём.
                </div>
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--github-blue-text)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>open_in_new</span>
                  Мой Диск
                </a>
              </div>
            ) : currentUser ? (
              <div style={{
                background: 'rgba(56, 139, 253, 0.08)',
                border: '1px solid rgba(56, 139, 253, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem 0.9rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#4285F4' }}>cloud</span>
                    Подключить личный Google Диск
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Сохраняйте медиафайлы прямо в ваше личное облако Google.
                  </div>
                </div>
                <a
                  href="/api/auth/google-drive"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#4285F4',
                    color: '#fff',
                    borderColor: '#4285F4'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>add_link</span>
                  Подключить
                </a>
              </div>
            ) : null}

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
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>palette</span>
              Цвет метки карточки
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { level: 1, color: '#3fb950', name: 'Зелёный' },
                { level: 2, color: '#d29922', name: 'Жёлтый' },
                { level: 3, color: '#f85149', name: 'Красный' },
                { level: 4, color: '#388bfd', name: 'Синий' },
                { level: 5, color: '#a371f7', name: 'Фиолетовый' },
                { level: 6, color: '#8b949e', name: 'Серый' }
              ].map(item => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setDifficulty(item.level)}
                  style={{
                    flex: 1,
                    minWidth: '55px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.25rem',
                    background: 'var(--github-canvas)',
                    border: difficulty === item.level ? `2px solid ${item.color}` : '1px solid var(--github-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: difficulty === item.level ? `0 0 10px ${item.color}40` : 'none'
                  }}
                  title={item.name}
                >
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 6px ${item.color}80`
                  }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: difficulty === item.level ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {item.name}
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
