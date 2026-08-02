import React, { useState } from 'react';

export default function BoardModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📋');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, icon });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Новая Доска</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название доски</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Разработка Геймплея"
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткая суть бэклога"
            />
          </div>
          <div className="form-group">
            <label>Иконка / Имодзи</label>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {['📋', '🚀', '🎮', '💡', '🎨'].map(em => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setIcon(em)}
                  style={{ fontSize: '1.2rem', padding: '0.3rem 0.5rem', background: icon === em ? 'var(--github-blue)' : 'var(--github-canvas)', border: '1px solid var(--github-border)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">Создать</button>
          </div>
        </form>
      </div>
    </div>
  );
}
