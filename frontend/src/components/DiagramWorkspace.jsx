import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DIAGRAM_TEMPLATES,
  getOfflineDiagrams,
  saveOfflineDiagram,
  deleteOfflineDiagram,
  downloadDiagramFile
} from '../utils/diagramStorage';

export default function DiagramWorkspace({ currentUser, onOpenAuth }) {
  const [diagrams, setDiagrams] = useState([]);
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(DIAGRAM_TEMPLATES[0].id);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const workspaceContainerRef = useRef(null);
  const currentDiagramRef = useRef(null);

  // Token helper
  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('session_token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  // Load diagrams list (from server if user logged in, or localStorage)
  const fetchDiagrams = useCallback(async () => {
    if (currentUser) {
      try {
        const res = await authFetch('/api/diagrams');
        if (res.ok) {
          const serverDiagrams = await res.json();
          if (Array.isArray(serverDiagrams) && serverDiagrams.length > 0) {
            setDiagrams(serverDiagrams);
            setCurrentDiagramId(serverDiagrams[0].id);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load server diagrams, using offline:', err);
      }
    }

    const offlineList = getOfflineDiagrams();
    setDiagrams(offlineList);
    if (offlineList.length > 0) {
      setCurrentDiagramId(offlineList[0].id);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  // Current active diagram
  const currentDiagram = diagrams.find(d => String(d.id) === String(currentDiagramId)) || diagrams[0] || null;

  useEffect(() => {
    currentDiagramRef.current = currentDiagram;
  }, [currentDiagram]);

  // Load diagram XML into draw.io iframe
  const loadDiagramIntoIframe = useCallback((xml) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      const msg = JSON.stringify({
        action: 'load',
        autosave: 1,
        xml: xml || ''
      });
      iframeRef.current.contentWindow.postMessage(msg, '*');
    } catch (e) {
      console.error('Failed to postMessage to diagrams.net:', e);
    }
  }, []);

  // Handle postMessage from diagrams.net embed
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes('diagrams.net')) return;

      let msgData;
      try {
        msgData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (e) {
        return;
      }

      if (!msgData || !msgData.event) return;

      // 1. Initial Handshake
      if (msgData.event === 'init') {
        setIsIframeReady(true);
        const xmlToLoad = currentDiagramRef.current ? currentDiagramRef.current.xml : DIAGRAM_TEMPLATES[0].xml;
        loadDiagramIntoIframe(xmlToLoad);
      }

      // 2. Autosave or Save Event from Editor
      if (msgData.event === 'autosave' || msgData.event === 'save') {
        if (!msgData.xml || !currentDiagramRef.current) return;
        setSaveStatus('saving');

        const updatedDiag = {
          ...currentDiagramRef.current,
          xml: msgData.xml,
          updated_at: new Date().toISOString()
        };

        // Update local React state
        setDiagrams(prev => prev.map(d => String(d.id) === String(updatedDiag.id) ? updatedDiag : d));
        currentDiagramRef.current = updatedDiag;

        // Save to offline storage
        saveOfflineDiagram(updatedDiag);

        // If user is logged in, also sync to SQLite backend
        if (currentUser && typeof updatedDiag.id === 'number') {
          authFetch(`/api/diagrams/${updatedDiag.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: updatedDiag.title, xml: updatedDiag.xml })
          }).catch(err => console.error('Failed to sync diagram with server:', err));
        }

        setTimeout(() => {
          setSaveStatus('saved');
        }, 500);
      }

      // 3. Export Event from Editor
      if (msgData.event === 'export' && msgData.data) {
        const title = currentDiagramRef.current ? currentDiagramRef.current.title : 'diagram';
        const format = msgData.format || 'png';
        const blob = msgData.data.startsWith('data:')
          ? null
          : new Blob([msgData.data], { type: format === 'svg' ? 'image/svg+xml' : 'application/octet-stream' });

        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9а-яё_-]/gi, '_')}.${format}`;
        link.href = blob ? URL.createObjectURL(blob) : msgData.data;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (blob) URL.revokeObjectURL(link.href);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUser, loadDiagramIntoIframe]);

  // Switch active diagram
  const handleSelectDiagram = (diagId) => {
    const target = diagrams.find(d => String(d.id) === String(diagId));
    if (!target) return;

    setCurrentDiagramId(target.id);
    currentDiagramRef.current = target;
    if (isIframeReady) {
      loadDiagramIntoIframe(target.xml);
    }
  };

  // Create new diagram
  const handleCreateDiagram = async () => {
    const chosenTemplate = DIAGRAM_TEMPLATES.find(t => t.id === selectedTemplateId) || DIAGRAM_TEMPLATES[0];
    const finalTitle = newTitle.trim() || chosenTemplate.title || 'Новая схема';
    const finalXml = chosenTemplate.xml;

    if (currentUser) {
      try {
        const res = await authFetch('/api/diagrams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: finalTitle, xml: finalXml })
        });
        if (res.ok) {
          const created = await res.json();
          setDiagrams(prev => [created, ...prev]);
          setCurrentDiagramId(created.id);
          currentDiagramRef.current = created;
          loadDiagramIntoIframe(created.xml);
          setIsNewModalOpen(false);
          setNewTitle('');
          return;
        }
      } catch (err) {
        console.error('Error creating diagram on server, fallback to local:', err);
      }
    }

    const newLocalDiag = {
      id: 'diag_' + Date.now(),
      title: finalTitle,
      xml: finalXml,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = saveOfflineDiagram(newLocalDiag);
    setDiagrams(updated);
    setCurrentDiagramId(newLocalDiag.id);
    currentDiagramRef.current = newLocalDiag;
    loadDiagramIntoIframe(newLocalDiag.xml);
    setIsNewModalOpen(false);
    setNewTitle('');
  };

  // Rename current diagram
  const handleSaveRename = async () => {
    if (!currentDiagram || !renameValue.trim()) return;
    const newName = renameValue.trim();

    const updated = { ...currentDiagram, title: newName };
    setDiagrams(prev => prev.map(d => String(d.id) === String(currentDiagram.id) ? updated : d));
    currentDiagramRef.current = updated;
    saveOfflineDiagram(updated);

    if (currentUser && typeof currentDiagram.id === 'number') {
      authFetch(`/api/diagrams/${currentDiagram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName })
      }).catch(err => console.error('Failed to rename on server:', err));
    }

    setIsRenameModalOpen(false);
  };

  // Delete current diagram
  const handleDeleteCurrentDiagram = async () => {
    if (!currentDiagram) return;
    if (diagrams.length <= 1) {
      alert('Нельзя удалить последнюю оставшуюся диаграмму.');
      return;
    }

    if (!window.confirm(`Удалить диаграмму «${currentDiagram.title}»?`)) return;

    const toDeleteId = currentDiagram.id;
    const remaining = diagrams.filter(d => String(d.id) !== String(toDeleteId));
    setDiagrams(remaining);
    deleteOfflineDiagram(toDeleteId);

    if (currentUser && typeof toDeleteId === 'number') {
      authFetch(`/api/diagrams/${toDeleteId}`, { method: 'DELETE' })
        .catch(err => console.error('Failed to delete on server:', err));
    }

    const nextDiag = remaining[0];
    setCurrentDiagramId(nextDiag.id);
    currentDiagramRef.current = nextDiag;
    loadDiagramIntoIframe(nextDiag.xml);
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    setSaveStatus('saving');
    try {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ action: 'save' }), '*');
    } catch (e) {}
  };

  // Request export from draw.io iframe
  const handleExportRequest = (format) => {
    setIsExportMenuOpen(false);
    if (!currentDiagram) return;

    if (format === 'drawio' || format === 'xml') {
      downloadDiagramFile(currentDiagram.title, currentDiagram.xml, format);
      return;
    }

    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        action: 'export',
        format: format, // 'png' | 'svg'
        xml: currentDiagram.xml
      }), '*');
    } catch (e) {
      console.error('Export request failed:', e);
    }
  };

  // Import .drawio or .xml file
  const handleFileImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlContent = event.target.result;
      const importedTitle = file.name.replace(/\.(drawio|xml)$/i, '');

      const newDiag = {
        id: 'diag_' + Date.now(),
        title: importedTitle || 'Импортированная схема',
        xml: xmlContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updated = saveOfflineDiagram(newDiag);
      setDiagrams(updated);
      setCurrentDiagramId(newDiag.id);
      currentDiagramRef.current = newDiag;
      loadDiagramIntoIframe(newDiag.xml);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (workspaceContainerRef.current?.requestFullscreen) {
        workspaceContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={workspaceContainerRef}
      className={`diagram-workspace-container ${isFullscreen ? 'diagram-fullscreen' : ''}`}
    >
      {/* Top Header Bar for Diagrams */}
      <div className="diagram-top-bar">
        {/* Left: Brand / Title / Selector */}
        <div className="diagram-bar-left">
          <div className="diagram-brand-pill">
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
              account_tree
            </span>
            <span className="diagram-brand-title">Схемы & Архитектура</span>
          </div>

          <div className="diagram-selector-wrapper">
            <select
              className="diagram-selector-dropdown"
              value={currentDiagramId || ''}
              onChange={(e) => handleSelectDiagram(e.target.value)}
              title="Выберите схему для редактирования"
            >
              {diagrams.map(diag => (
                <option key={diag.id} value={diag.id}>
                  {diag.title}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-diagram-tool"
            onClick={() => {
              setRenameValue(currentDiagram ? currentDiagram.title : '');
              setIsRenameModalOpen(true);
            }}
            title="Переименовать схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
          </button>
        </div>

        {/* Center: Save Status Indicator */}
        <div className="diagram-bar-center">
          <div className={`diagram-save-status ${saveStatus}`}>
            <span className="status-dot"></span>
            <span>
              {saveStatus === 'saving'
                ? 'Синхронизация...'
                : saveStatus === 'unsaved'
                ? 'Несохраненные правки'
                : 'Сохранено'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="diagram-bar-right">
          <button
            className="btn-diagram-tool btn-primary-diagram"
            onClick={() => {
              setNewTitle('');
              setIsNewModalOpen(true);
            }}
            title="Создать новую схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
            <span>Новая схема</span>
          </button>

          <button
            className="btn-diagram-tool"
            onClick={handleManualSave}
            title="Сохранить изменения"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--github-green-text)' }}>save</span>
            <span>Сохранить</span>
          </button>

          <button
            className="btn-diagram-tool"
            onClick={() => fileInputRef.current?.click()}
            title="Импортировать схему из .drawio или .xml"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>file_upload</span>
            <span>Импорт</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".drawio,.xml"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />

          {/* Export Dropdown */}
          <div className="diagram-export-wrapper" style={{ position: 'relative' }}>
            <button
              className="btn-diagram-tool"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              title="Экспортировать схему"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>file_download</span>
              <span>Экспорт</span>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_drop_down</span>
            </button>

            {isExportMenuOpen && (
              <div className="diagram-dropdown-menu">
                <button onClick={() => handleExportRequest('png')}>
                  <span className="material-symbols-outlined">image</span>
                  <span>Экспорт в PNG</span>
                </button>
                <button onClick={() => handleExportRequest('svg')}>
                  <span className="material-symbols-outlined">code</span>
                  <span>Экспорт в SVG</span>
                </button>
                <button onClick={() => handleExportRequest('drawio')}>
                  <span className="material-symbols-outlined">description</span>
                  <span>Файл .drawio (XML)</span>
                </button>
              </div>
            )}
          </div>

          <button
            className="btn-diagram-tool btn-danger-tool"
            onClick={handleDeleteCurrentDiagram}
            title="Удалить текущую схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
          </button>

          <button
            className="btn-diagram-tool"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </div>

      {/* Editor Iframe Area (Embedded diagrams.net with jgraph dark mode) */}
      <div className="diagram-canvas-viewport">
        <iframe
          ref={iframeRef}
          className="diagram-iframe"
          title="jgraph-diagrams-editor"
          src="https://embed.diagrams.net/?embed=1&ui=dark&proto=json&spin=1&libraries=1&lang=ru&saveAndExit=0&noExitBtn=1"
          allow="clipboard-read; clipboard-write"
        />
      </div>

      {/* Modal: New Diagram with Template Chooser */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal-content diagram-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
                  dashboard_customize
                </span>
                <h2 className="modal-title">Создать новую диаграмму</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsNewModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название диаграммы</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Например: Игровой цикл, Сетевой протокол, Схема БД..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Выберите стартовый шаблон</label>
                <div className="diagram-templates-grid">
                  {DIAGRAM_TEMPLATES.map(tpl => (
                    <div
                      key={tpl.id}
                      className={`diagram-template-card ${selectedTemplateId === tpl.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                    >
                      <div className="template-card-icon">
                        <span className="material-symbols-outlined">{tpl.icon}</span>
                      </div>
                      <div className="template-card-info">
                        <div className="template-card-title">{tpl.title}</div>
                        <div className="template-card-desc">{tpl.description}</div>
                      </div>
                      {selectedTemplateId === tpl.id && (
                        <span className="material-symbols-outlined template-selected-badge">check_circle</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleCreateDiagram}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', marginRight: '4px' }}>
                  add_circle
                </span>
                Создать диаграмму
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename Diagram */}
      {isRenameModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRenameModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Переименовать схему</h2>
              <button className="btn-close-modal" onClick={() => setIsRenameModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Новое название</label>
                <input
                  type="text"
                  className="form-control"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsRenameModalOpen(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveRename}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
