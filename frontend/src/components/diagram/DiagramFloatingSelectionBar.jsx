// DiagramFloatingSelectionBar.jsx - Всплывающая панель быстрых действий над несколькими выбранными нодами
import React from 'react';

export default function DiagramFloatingSelectionBar({
  selectedNodes,
  onGroup,
  onUngroup,
  onScaleSelected,
  onDeleteSelected,
  onClearSelection
}) {
  if (!selectedNodes || selectedNodes.length < 2) return null;

  const hasGroupableNodes = selectedNodes.some(n => n.type !== 'sectionNode');
  const hasSectionNodes = selectedNodes.some(n => n.type === 'sectionNode');

  const handleUngroupAllSelected = () => {
    selectedNodes
      .filter(n => n.type === 'sectionNode')
      .forEach(s => onUngroup(s.id));
  };

  return (
    <div className="diagram-floating-selection-bar nodrag">
      <div className="selection-badge">
        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#58a6ff' }}>
          check_box
        </span>
        <span>Выбрано: <strong>{selectedNodes.length}</strong></span>
      </div>

      {/* Group Scale Controls */}
      <div className="floating-scale-group">
        <span className="floating-scale-label">
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>zoom_in</span>
          Масштаб:
        </span>
        <button
          type="button"
          className="floating-btn-scale"
          onClick={() => onScaleSelected && onScaleSelected(0.9)}
          title="Уменьшить масштаб выделенных блоков (-10%)"
        >
          -
        </button>
        <button
          type="button"
          className="floating-scale-chip"
          onClick={() => onScaleSelected && onScaleSelected(0.75)}
          title="Масштаб 75%"
        >
          75%
        </button>
        <button
          type="button"
          className="floating-scale-chip"
          onClick={() => onScaleSelected && onScaleSelected(1.0, true)}
          title="Сбросить масштаб на 100%"
        >
          100%
        </button>
        <button
          type="button"
          className="floating-scale-chip"
          onClick={() => onScaleSelected && onScaleSelected(1.25)}
          title="Масштаб 125%"
        >
          125%
        </button>
        <button
          type="button"
          className="floating-btn-scale"
          onClick={() => onScaleSelected && onScaleSelected(1.1)}
          title="Увеличить масштаб выделенных блоков (+10%)"
        >
          +
        </button>
      </div>

      {hasGroupableNodes && (
        <button
          className="floating-btn-action btn-group-primary"
          onClick={onGroup}
          title="Сгруппировать выбранные блоки в секцию (Ctrl+G)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>crop_free</span>
          <span>Сгруппировать</span>
          <kbd>Ctrl+G</kbd>
        </button>
      )}

      {hasSectionNodes && (
        <button
          className="floating-btn-action btn-ungroup-action"
          onClick={handleUngroupAllSelected}
          title="Разгруппировать секции (Ctrl+Shift+G)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>lock_open</span>
          <span>Разгруппировать</span>
          <kbd>Ctrl+Shift+G</kbd>
        </button>
      )}

      <button
        className="floating-btn-action btn-delete-sel"
        onClick={onDeleteSelected}
        title="Удалить выбранные элементы (Delete)"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
        <span>Удалить</span>
      </button>

      <button
        className="floating-btn-close"
        onClick={onClearSelection}
        title="Снять выделение (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
