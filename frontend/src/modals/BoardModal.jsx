import React, { useState } from 'react';

export default function BoardModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('space_dashboard');

  const iconsList = ['space_dashboard', 'rocket_launch', 'sports_esports', 'lightbulb', 'palette', 'folder_open'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, icon });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>space_dashboard</span>
            Новая Доска
          </h2>
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
            <label>Иконка Доски (Material Icon)</label>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {iconsList.map(ic => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: icon === ic ? 'var(--github-blue)' : 'var(--github-canvas)',
                    border: '1px solid var(--github-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{ic}</span>
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
