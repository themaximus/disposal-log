// NewDiagramModal.jsx - Модальное окно создания новой схемы с выбором пресета
import React from 'react';
import { STARTER_PRESETS } from '../../../utils/diagramStorage';

export default function NewDiagramModal({
  isOpen,
  onClose,
  newTitle,
  setNewTitle,
  selectedPresetId,
  setSelectedPresetId,
  onCreateDiagram
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal modal-content diagram-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
              dashboard_customize
            </span>
            <h2 className="modal-title">Создать новую схему</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Название схемы</label>
            <input
              type="text"
              className="form-control"
              placeholder="Например: Игрок и Инвентарь, Архитектура Босса..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Выберите стартовый пресет</label>
            <div className="diagram-templates-grid">
              {STARTER_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className={`diagram-template-card ${selectedPresetId === preset.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPresetId(preset.id)}
                >
                  <div className="template-card-icon">
                    <span className="material-symbols-outlined">account_tree</span>
                  </div>
                  <div className="template-card-info">
                    <div className="template-card-title">{preset.title}</div>
                    <div className="template-card-desc">{preset.description}</div>
                  </div>
                  {selectedPresetId === preset.id && (
                    <span className="material-symbols-outlined template-selected-badge">check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={onCreateDiagram}>Создать схему</button>
        </div>
      </div>
    </div>
  );
}
