import React, { useState, useEffect } from 'react';

export default function TaskModal({ taskToEdit, boardId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|webm|mov|ogg)$/i.test(url);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: taskToEdit ? taskToEdit.id : null,
      board_id: boardId,
      title,
      description,
      difficulty,
      images
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '500px' }}>
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

          <div className="form-group">
            <label>Медиафайлы (Изображения и Видео MP4/WebM)</label>
            
            <label className="custom-upload-zone">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-zone-content">
                <span className="upload-icon">📁</span>
                <div>
                  <span className="upload-title">
                    {isUploading ? 'Загрузка файлов...' : 'Выбрать или перетащить медиафайлы'}
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
