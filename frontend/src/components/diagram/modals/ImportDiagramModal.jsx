// ImportDiagramModal.jsx - Модальное окно импорта проекта .diagram / .json
import React, { useState, useRef } from 'react';
import { readDiagramFileAsync } from '../../../utils/diagramFormatService';

export default function ImportDiagramModal({
  isOpen,
  onClose,
  onImportNewDiagram,
  onReplaceCurrentDiagram,
  onMergeIntoCurrentDiagram,
  currentDiagramTitle
}) {
  const [parsedProject, setParsedProject] = useState(null);
  const [importMode, setImportMode] = useState('new'); // 'new' | 'replace' | 'merge'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setParsedProject(null);
    setErrorMsg(null);
    setIsLoading(false);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await readDiagramFileAsync(file);
      setParsedProject(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Не удалось прочитать файл');
      setParsedProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleConfirmImport = () => {
    if (!parsedProject) return;

    if (importMode === 'new' && onImportNewDiagram) {
      onImportNewDiagram(parsedProject);
    } else if (importMode === 'replace' && onReplaceCurrentDiagram) {
      onReplaceCurrentDiagram(parsedProject);
    } else if (importMode === 'merge' && onMergeIntoCurrentDiagram) {
      onMergeIntoCurrentDiagram(parsedProject);
    }

    handleClose();
  };

  return (
    <div className="diagram-modal-backdrop nodrag" onClick={handleClose}>
      <div
        className="diagram-modal import-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="diagram-modal-header">
          <div className="modal-title-with-icon">
            <span className="material-symbols-outlined modal-icon-glow" style={{ color: '#bc8cff' }}>
              upload_file
            </span>
            <h3>Импорт схемы (.diagram / JSON)</h3>
          </div>
          <button className="btn-modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="diagram-modal-body">
          {errorMsg && (
            <div className="export-error-banner">
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!parsedProject ? (
            /* Drag and drop / Select file zone */
            <div
              className={`import-drop-zone ${isDragOver ? 'drag-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".diagram,.json"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <span className="material-symbols-outlined drop-zone-icon">
                file_upload
              </span>
              <p className="drop-zone-title">
                {isLoading ? 'Анализ структуры файла...' : 'Перетащите сюда файл .diagram или .json'}
              </p>
              <span className="drop-zone-subtitle">
                или кликните для выбора с компьютера
              </span>
              <div className="drop-zone-badge">
                Поддерживается стандарт <code>disposal-diagram-v1.0</code>
              </div>
            </div>
          ) : (
            /* Preview of parsed file and import mode options */
            <div className="import-preview-wrapper">
              <div className="import-project-summary-card">
                <div className="summary-card-header">
                  <span className="material-symbols-outlined" style={{ color: '#58a6ff' }}>description</span>
                  <div className="summary-title-col">
                    <span className="summary-project-title">{parsedProject.title}</span>
                    <span className="summary-project-sub">
                      Спецификация: <code>{parsedProject.schema}</code>
                      {parsedProject.exportedAt && ` • ${new Date(parsedProject.exportedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-diagram-tool btn-change-file"
                    onClick={handleReset}
                    title="Выбрать другой файл"
                  >
                    Сменить
                  </button>
                </div>

                <div className="summary-stats-grid">
                  <div className="summary-stat-pill">
                    <span className="stat-label">Блоков:</span>
                    <span className="stat-val">{parsedProject.nodes.length}</span>
                  </div>
                  <div className="summary-stat-pill">
                    <span className="stat-label">Связей:</span>
                    <span className="stat-val">{parsedProject.edges.length}</span>
                  </div>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="export-form-section" style={{ marginTop: '12px' }}>
                <label className="export-section-label">Как импортировать данные:</label>
                <div className="import-mode-options">
                  <label className={`import-mode-option ${importMode === 'new' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'new'}
                      onChange={() => setImportMode('new')}
                    />
                    <div className="mode-option-content">
                      <span className="mode-option-title">⚡ Открыть как новую отдельную схему</span>
                      <span className="mode-option-desc">Создаст новую вкладку схемы с названием «{parsedProject.title}»</span>
                    </div>
                  </label>

                  <label className={`import-mode-option ${importMode === 'replace' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <div className="mode-option-content">
                      <span className="mode-option-title">🔄 Заменить текущую схему</span>
                      <span className="mode-option-desc">Заменит все блоки в «{currentDiagramTitle}» содержимым файла</span>
                    </div>
                  </label>

                  <label className={`import-mode-option ${importMode === 'merge' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <div className="mode-option-content">
                      <span className="mode-option-title">➕ Добавить к текущей схеме</span>
                      <span className="mode-option-desc">Добавит блоки из файла в текущий холст со сдвигом координат</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="diagram-modal-footer">
          <button
            type="button"
            className="btn-diagram-tool"
            onClick={handleClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn-diagram-tool btn-primary-diagram"
            onClick={handleConfirmImport}
            disabled={!parsedProject || isLoading}
            style={{ minWidth: '130px', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check</span>
            <span>Импортировать</span>
          </button>
        </div>
      </div>
    </div>
  );
}
