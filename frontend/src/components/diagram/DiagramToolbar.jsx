// DiagramToolbar.jsx - Верхняя панель управления схемой (Single Responsibility: Toolbar UI)
import React from 'react';

function DiagramToolbar({
  diagrams,
  currentDiagramId,
  onSelectDiagram,
  onOpenNewModal,
  onDeleteDiagram,
  saveStatus,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  interactionMode,
  setInteractionMode,
  onAddHierarchyNode,
  onAddLogicNode,
  onAddTextNode,
  onAddEmptySection,
  selectedGroupableCount = 0,
  onGroupSelected,
  onOpenPrefabsModal,
  onOpenExportModal,
  onOpenImportModal,
  snapToGrid = true,
  onToggleSnapToGrid,
  isFullscreen,
  onToggleFullscreen
}) {
  return (
    <div className="diagram-top-bar">
      {/* Left: Brand and Diagram Selector */}
      <div className="diagram-bar-left">
        <div className="diagram-brand-pill">
          <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
            account_tree
          </span>
          <span className="diagram-brand-title">Иерархия & Схемы</span>
        </div>

        <div className="diagram-selector-wrapper">
          <select
            className="diagram-selector-dropdown"
            value={currentDiagramId || ''}
            onChange={(e) => onSelectDiagram(e.target.value)}
            title="Выберите схему"
          >
            {diagrams.map(diag => (
              <option key={diag.id} value={diag.id}>
                {diag.title}
              </option>
            ))}
          </select>
          <button
            className="btn-diagram-tool btn-schema-action"
            onClick={onOpenNewModal}
            title="Создать новую схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>add</span>
          </button>
          <button
            className="btn-diagram-tool btn-schema-action btn-danger-tool"
            onClick={onDeleteDiagram}
            title="Удалить текущую схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>delete</span>
          </button>

          {/* Undo / Redo Buttons */}
          <div className="diagram-history-actions nodrag" style={{ display: 'inline-flex', gap: '2px', marginLeft: '4px' }}>
            <button
              type="button"
              className="btn-diagram-tool btn-schema-action"
              onClick={onUndo}
              disabled={!canUndo}
              title="Отменить действие (Ctrl+Z)"
              style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>undo</span>
            </button>
            <button
              type="button"
              className="btn-diagram-tool btn-schema-action"
              onClick={onRedo}
              disabled={!canRedo}
              title="Повторить действие (Ctrl+Shift+Z)"
              style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'default' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>redo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: Save Status */}
      <div className="diagram-bar-center">
        <div className={`diagram-save-status ${saveStatus}`}>
          <span className="status-dot"></span>
          <span>{saveStatus === 'saving' ? 'Синхронизация...' : '✓ Сохранено'}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="diagram-bar-right">
        {/* Interaction Mode Toggle: Pan vs Selection Box */}
        <div className="diagram-mode-toggle nodrag">
          <button
            className={`btn-mode-pill ${interactionMode === 'pan' ? 'active' : ''}`}
            onClick={() => setInteractionMode('pan')}
            title="Режим руки: перемещение холста (зажмите Shift для рамки выделения)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>pan_tool</span>
          </button>
          <button
            className={`btn-mode-pill ${interactionMode === 'select' ? 'active' : ''}`}
            onClick={() => setInteractionMode('select')}
            title="Режим рамки выделения: тяните мышь для выбора нескольких блоков"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>select_all</span>
          </button>
        </div>

        {/* Snap to Grid Toggle */}
        <button
          type="button"
          className={`btn-diagram-tool btn-grid-toggle ${snapToGrid ? 'btn-tool-active' : ''}`}
          onClick={onToggleSnapToGrid}
          title={snapToGrid ? 'Прилипание к сетке: ВКЛ (кликните, чтобы отключить)' : 'Прилипание к сетке: ВЫКЛ (кликните, чтобы включить)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: snapToGrid ? '#58a6ff' : '#8b949e' }}>
            {snapToGrid ? 'grid_on' : 'grid_off'}
          </span>
          <span>Сетка</span>
        </button>

        <button
          className="btn-diagram-tool btn-primary-diagram"
          onClick={onAddHierarchyNode}
          title="Добавить блок префаба / иерархии объектов"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>account_tree</span>
          <span>+ Префаб</span>
        </button>

        <button
          className="btn-diagram-tool"
          onClick={onAddLogicNode}
          title="Добавить блок алгоритма / логики"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--github-yellow)' }}>code</span>
          <span>+ Логика</span>
        </button>

        <button
          className="btn-diagram-tool btn-text-block-tool"
          onClick={onAddTextNode}
          title="Добавить текстовый блок / заметку с точками связей"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#58a6ff' }}>notes</span>
          <span>+ Текст</span>
        </button>

        <button
          className="btn-diagram-tool btn-section-tool"
          onClick={onAddEmptySection}
          title="Создать новую рамку секции на холсте"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#ff4455' }}>crop_free</span>
          <span>+ Секция</span>
        </button>

        {selectedGroupableCount >= 2 && (
          <button
            className="btn-diagram-tool btn-group-active"
            onClick={onGroupSelected}
            title="Сгруппировать выбранные блоки в секцию (Ctrl+G)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#ff4455' }}>folder_zip</span>
            <span>Сгруппировать ({selectedGroupableCount})</span>
          </button>
        )}

        <button
          className="btn-diagram-tool btn-prefabs-library"
          onClick={onOpenPrefabsModal}
          title="Библиотека готовых и пользовательских префабов блоков"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#bc8cff' }}>category</span>
          <span>📦 Префабы</span>
        </button>

        <div className="diagram-io-divider" style={{ width: '1px', height: '22px', background: '#30363d', margin: '0 2px' }}></div>

        {/* Import & Export */}
        <button
          type="button"
          className="btn-diagram-tool btn-io-tool"
          onClick={onOpenImportModal}
          title="Импорт схемы из файла (.diagram или .json)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: '#bc8cff' }}>upload</span>
          <span>Импорт</span>
        </button>

        <button
          type="button"
          className="btn-diagram-tool btn-io-tool"
          onClick={onOpenExportModal}
          title="Экспорт схемы (PNG / SVG / PDF / .diagram)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: '#58a6ff' }}>download</span>
          <span>Экспорт</span>
        </button>

        <button
          className="btn-diagram-tool"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(DiagramToolbar);
