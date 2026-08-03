import React, { useState, useEffect } from 'react';

export default function ManageColumnsModal({ board, columns, onClose, onSaveColumns, onAddColumn, onEditColumn, onDeleteColumn }) {
  const [colsList, setColsList] = useState(columns || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#388bfd');

  useEffect(() => {
    setColsList(columns || []);
  }, [columns]);

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...colsList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    // Update positions
    const reordered = updated.map((c, idx) => ({ ...c, position: idx }));
    setColsList(reordered);
    onSaveColumns(reordered);
  };

  const handleMoveDown = (index) => {
    if (index >= colsList.length - 1) return;
    const updated = [...colsList];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    // Update positions
    const reordered = updated.map((c, idx) => ({ ...c, position: idx }));
    setColsList(reordered);
    onSaveColumns(reordered);
  };

  const handleCreateColumnSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddColumn({
      title: newTitle.trim(),
      color: newColor,
      board_id: board ? board.id : null
    });
    setNewTitle('');
    setIsAddingNew(false);
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>view_column</span>
            Порядок и Колоноки Доски
          </h2>
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Здесь можно менять порядок отображения колонок, редактировать их или добавлять новые.
        </p>

        {/* Existing Columns List with Reorder Controls */}
        <div className="manage-columns-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem', maxHeight: '240px', overflowY: 'auto' }}>
          {colsList.map((col, idx) => (
            <div
              key={col.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--github-canvas)',
                border: '1px solid var(--github-border)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                  #{idx + 1}
                </span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.color || '#388bfd' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {col.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  title="Переместить влево/вверх"
                  style={{ opacity: idx === 0 ? 0.3 : 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_upward</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  disabled={idx === colsList.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  title="Переместить вправо/вниз"
                  style={{ opacity: idx === colsList.length - 1 ? 0.3 : 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_downward</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onEditColumn(col)}
                  title="Редактировать название/цвет"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>edit</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => onDeleteColumn(col.id)}
                  title="Удалить колонку"
                  style={{ color: 'var(--github-red-text)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inline Add New Column Form */}
        {isAddingNew ? (
          <form onSubmit={handleCreateColumnSubmit} style={{ background: 'var(--github-canvas)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--github-blue)', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Название новой колонки</label>
              <input
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Например: В тестировании"
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Цвет:</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  style={{ width: '32px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddingNew(false)} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>Создать</button>
              </div>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}
            onClick={() => setIsAddingNew(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Добавить новую колонку
          </button>
        )}

        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}
