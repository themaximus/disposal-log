// ExportDiagramModal.jsx - Модальное окно экспорта схемы (PNG / SVG / PDF / .diagram JSON)
import React, { useState, useEffect } from 'react';
import { exportDiagram } from '../../../utils/diagramExportService';
import { downloadDiagramProjectFile } from '../../../utils/diagramFormatService';

export default function ExportDiagramModal({
  isOpen,
  onClose,
  nodes = [],
  edges = [],
  selectedNodes = [],
  currentDiagramTitle = 'Архитектура игры',
  viewport = { x: 0, y: 0, zoom: 1 }
}) {
  const [format, setFormat] = useState('png'); // 'png' | 'svg' | 'pdf' | 'json'
  const [scope, setScope] = useState('all'); // 'all' | 'selection'
  const [scale, setScale] = useState(2); // 1 | 2 | 3
  const [background, setBackground] = useState('canvas'); // 'canvas' | 'transparent' | 'white'
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFilename(currentDiagramTitle || 'diagram');
      // If user had nodes selected before opening, default to selection if desired, or let them choose
      if (selectedNodes && selectedNodes.length >= 2) {
        setScope('selection');
      } else {
        setScope('all');
      }
      setErrorMsg(null);
      setIsExporting(false);
    }
  }, [isOpen, currentDiagramTitle, selectedNodes]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);

    try {
      if (format === 'json') {
        const targetNodes = scope === 'selection'
          ? nodes.filter(n => selectedNodes.some(sn => sn.id === n.id))
          : nodes;

        const targetNodeIds = new Set(targetNodes.map(n => n.id));
        const targetEdges = edges.filter(e => targetNodeIds.has(e.source) && targetNodeIds.has(e.target));

        downloadDiagramProjectFile({
          title: filename.trim() || currentDiagramTitle,
          nodes: targetNodes,
          edges: targetEdges,
          viewport
        }, filename.trim());

        onClose();
        return;
      }

      await exportDiagram({
        nodes,
        edges,
        scope,
        selectedNodeIds: selectedNodes.map(n => n.id),
        format,
        scale,
        background,
        title: filename.trim() || currentDiagramTitle
      });

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="diagram-modal-backdrop nodrag" onClick={onClose}>
      <div
        className="diagram-modal export-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="diagram-modal-header">
          <div className="modal-title-with-icon">
            <span className="material-symbols-outlined modal-icon-glow" style={{ color: '#58a6ff' }}>
              download
            </span>
            <h3>Экспорт схемы и документации</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="diagram-modal-body">
          {errorMsg && (
            <div className="export-error-banner">
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formats Grid */}
          <div className="export-form-section">
            <label className="export-section-label">Формат файла:</label>
            <div className="export-format-chips">
              <button
                type="button"
                className={`export-format-chip ${format === 'png' ? 'active' : ''}`}
                onClick={() => setFormat('png')}
              >
                <span className="format-chip-icon">🖼️</span>
                <div className="format-chip-info">
                  <span className="format-chip-name">PNG</span>
                  <span className="format-chip-sub">Растровое HD</span>
                </div>
              </button>

              <button
                type="button"
                className={`export-format-chip ${format === 'svg' ? 'active' : ''}`}
                onClick={() => setFormat('svg')}
              >
                <span className="format-chip-icon">📐</span>
                <div className="format-chip-info">
                  <span className="format-chip-name">SVG</span>
                  <span className="format-chip-sub">Вектор без потерь</span>
                </div>
              </button>

              <button
                type="button"
                className={`export-format-chip ${format === 'pdf' ? 'active' : ''}`}
                onClick={() => setFormat('pdf')}
              >
                <span className="format-chip-icon">📑</span>
                <div className="format-chip-info">
                  <span className="format-chip-name">PDF</span>
                  <span className="format-chip-sub">Дизайн-документ</span>
                </div>
              </button>

              <button
                type="button"
                className={`export-format-chip ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <span className="format-chip-icon">📁</span>
                <div className="format-chip-info">
                  <span className="format-chip-name">.diagram</span>
                  <span className="format-chip-sub">JSON проект</span>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Toggle: All vs Selection */}
          <div className="export-form-section">
            <label className="export-section-label">Область экспорта:</label>
            <div className="export-scope-toggle">
              <button
                type="button"
                className={`export-scope-btn ${scope === 'all' ? 'active' : ''}`}
                onClick={() => setScope('all')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>select_all</span>
                <span>Вся схема ({nodes.length} блоков)</span>
              </button>
              <button
                type="button"
                className={`export-scope-btn ${scope === 'selection' ? 'active' : ''}`}
                onClick={() => setScope('selection')}
                disabled={!selectedNodes || selectedNodes.length === 0}
                title={!selectedNodes || selectedNodes.length === 0 ? 'Сначала выделите блоки на холсте' : ''}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>crop</span>
                <span>Выделенные блоки ({selectedNodes.length})</span>
              </button>
            </div>
          </div>

          {/* Scale & Quality (Only for image/pdf) */}
          {format !== 'json' && format !== 'svg' && (
            <div className="export-form-section">
              <label className="export-section-label">Разрешение и чёткость:</label>
              <div className="export-scale-selector">
                <button
                  type="button"
                  className={`export-scale-btn ${scale === 1 ? 'active' : ''}`}
                  onClick={() => setScale(1)}
                >
                  <span>1x</span>
                  <small>Стандарт</small>
                </button>
                <button
                  type="button"
                  className={`export-scale-btn ${scale === 2 ? 'active' : ''}`}
                  onClick={() => setScale(2)}
                >
                  <span>2x HD</span>
                  <small>Четкий текст</small>
                </button>
                <button
                  type="button"
                  className={`export-scale-btn ${scale === 3 ? 'active' : ''}`}
                  onClick={() => setScale(3)}
                >
                  <span>3x UHD</span>
                  <small>Печать / 4K</small>
                </button>
              </div>
            </div>
          )}

          {/* Background options (for images and PDF) */}
          {format !== 'json' && (
            <div className="export-form-section">
              <label className="export-section-label">Фон подложки:</label>
              <div className="export-bg-selector">
                <button
                  type="button"
                  className={`export-bg-btn ${background === 'canvas' ? 'active' : ''}`}
                  onClick={() => setBackground('canvas')}
                >
                  <span className="bg-sample-dot" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}></span>
                  <span>Тёмный холст</span>
                </button>
                {format !== 'pdf' && (
                  <button
                    type="button"
                    className={`export-bg-btn ${background === 'transparent' ? 'active' : ''}`}
                    onClick={() => setBackground('transparent')}
                  >
                    <span className="bg-sample-dot checkerboard-dot"></span>
                    <span>Прозрачный</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`export-bg-btn ${background === 'white' ? 'active' : ''}`}
                  onClick={() => setBackground('white')}
                >
                  <span className="bg-sample-dot" style={{ backgroundColor: '#ffffff', border: '1px solid #d0d7de' }}></span>
                  <span>Белый</span>
                </button>
              </div>
            </div>
          )}

          {/* Filename input */}
          <div className="export-form-section">
            <label className="export-section-label">Имя сохраняемого файла:</label>
            <div className="export-filename-wrapper">
              <input
                type="text"
                className="input-github-dark"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="имя-схемы"
              />
              <span className="filename-ext-badge">
                .{format === 'json' ? 'diagram' : format}
              </span>
            </div>
          </div>
        </div>

        <div className="diagram-modal-footer">
          <button
            type="button"
            className="btn-diagram-tool"
            onClick={onClose}
            disabled={isExporting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn-diagram-tool btn-primary-diagram"
            onClick={handleExport}
            disabled={isExporting}
            style={{ minWidth: '130px', justifyContent: 'center' }}
          >
            {isExporting ? (
              <>
                <span className="material-symbols-outlined spinning-icon" style={{ fontSize: '1rem' }}>sync</span>
                <span>Генерация...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                <span>Скачать {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
