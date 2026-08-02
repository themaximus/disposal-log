import React, { useState, useEffect } from 'react';

export default function TaskModal({ taskToEdit, boardId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(1);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setDifficulty(taskToEdit.difficulty || 1);
    }
  }, [taskToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: taskToEdit ? taskToEdit.id : null,
      board_id: boardId,
      title,
      description,
      difficulty
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '480px' }}>
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
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробное ТЗ механики..."
            />
          </div>
          <div className="form-group">
            <label>Сложность (Звёзды)</label>
            <div className="difficulty-selector">
              {[1, 2, 3].map(d => (
                <label key={d}>
                  <input
                    type="radio"
                    name="diff"
                    value={d}
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                  />
                  {'★'.repeat(d)}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">
              {taskToEdit ? 'Сохранить изменения' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
