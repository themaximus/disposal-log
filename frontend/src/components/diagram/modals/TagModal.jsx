// TagModal.jsx - Модальное окно назначения тега сущности (@)
import React from 'react';

const POPULAR_TAGS = ['PREFAB', 'PLAYER', 'ENEMY', 'LOOT', 'GAMEPLAY SCRIPT', 'FSM AI', 'UI', 'PHYSICS', 'AUDIO'];

export default function TagModal({
  isOpen,
  onClose,
  tagInputValue,
  setTagInputValue,
  onSaveTag
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
              label
            </span>
            <h2 className="modal-title">Привязка и Тег блока</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Тег / Роль сущности в игре</label>
            <input
              type="text"
              className="form-control"
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              placeholder="Например: PREFAB, PLAYER, AI, LOOT, UI, AUDIO"
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveTag(); }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', marginBottom: '4px' }}>Популярные теги:</span>
            {POPULAR_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className="tag-preset-chip"
                onClick={() => setTagInputValue(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={onSaveTag}>Сохранить тег</button>
        </div>
      </div>
    </div>
  );
}
