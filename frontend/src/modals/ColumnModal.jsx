import React, { useState, useEffect } from 'react';

export default function ColumnModal({ columnToEdit, boardId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#388bfd');

  useEffect(() => {
    if (columnToEdit) {
      setTitle(columnToEdit.title || '');
      setColor(columnToEdit.color || '#388bfd');
    }
  }, [columnToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: columnToEdit ? columnToEdit.id : null,
      board_id: boardId,
      title,
      color,
      column_key: columnToEdit ? columnToEdit.column_key : title.toLowerCase().replace(/\s+/g, '_')
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h2>{columnToEdit ? 'Настройка Колонки' : 'Новая Колонка'}</h2>
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название колонки</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: В тестировании / Ревью"
            />
          </div>
          <div className="form-group">
            <label>Цвет акцента колонки</label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: '40px', height: '38px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Выберите цвет полосы колонки</span>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
