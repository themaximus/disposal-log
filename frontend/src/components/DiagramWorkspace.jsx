import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import GameDevHierarchyNode from './diagram/GameDevHierarchyNode';
import LogicStepNode from './diagram/LogicStepNode';
import {
  STARTER_PRESETS,
  getOfflineDiagrams,
  saveOfflineDiagram,
  deleteOfflineDiagram
} from '../utils/diagramStorage';

export default function DiagramWorkspace({ currentUser, onOpenAuth }) {
  const [diagrams, setDiagrams] = useState([]);
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Nodes & Edges state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(STARTER_PRESETS[0].id);

  const [isNodeEditModalOpen, setIsNodeEditModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editFormData, setEditFormData] = useState({ rootPath: '', itemsText: '', title: '', linesText: '' });

  const workspaceContainerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Auth fetch helper
  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('session_token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  // Node edit callback
  const handleEditNode = useCallback((nodeId) => {
    setNodes(currentNodes => {
      const target = currentNodes.find(n => n.id === nodeId);
      if (target) {
        setEditingNodeId(nodeId);
        if (target.type === 'hierarchyNode') {
          const itemsText = (target.data.items || []).map(i => {
            const indent = '  '.repeat(i.level);
            const branch = i.isLast ? '└── ' : '├── ';
            const icon = i.icon ? i.icon + ' ' : '';
            const details = i.details ? ` (${i.details})` : '';
            return `${indent}${branch}${icon}${i.name}${details}`;
          }).join('\n');

          setEditFormData({
            type: 'hierarchyNode',
            rootPath: target.data.rootPath || '',
            tag: target.data.tag || 'PREFAB',
            itemsText
          });
        } else {
          const linesText = (target.data.lines || []).map(l => {
            const prefix = l.prefix || '├── ';
            const icon = l.icon ? l.icon + ' ' : '';
            const comment = l.comment ? ` // ${l.comment}` : '';
            return `${prefix}${icon}${l.code}${comment}`;
          }).join('\n');

          setEditFormData({
            type: 'logicNode',
            title: target.data.title || '',
            nodeType: target.data.nodeType || 'SCRIPT',
            linesText
          });
        }
        setIsNodeEditModalOpen(true);
      }
      return currentNodes;
    });
  }, [setNodes]);

  // Define custom node types with edit handler attached
  const nodeTypes = useMemo(() => ({
    hierarchyNode: (props) => <GameDevHierarchyNode {...props} data={{ ...props.data, onEdit: handleEditNode }} />,
    logicNode: (props) => <LogicStepNode {...props} data={{ ...props.data, onEdit: handleEditNode }} />
  }), [handleEditNode]);

  // Load diagrams list
  const loadDiagrams = useCallback(async () => {
    if (currentUser) {
      try {
        const res = await authFetch('/api/diagrams');
        if (res.ok) {
          const serverDiagrams = await res.json();
          if (Array.isArray(serverDiagrams) && serverDiagrams.length > 0) {
            const formatted = serverDiagrams.map(d => {
              let parsedData = { nodes: [], edges: [] };
              try {
                parsedData = typeof d.xml === 'string' && d.xml.startsWith('{') ? JSON.parse(d.xml) : null;
              } catch (e) {}
              return {
                id: d.id,
                title: d.title,
                nodes: parsedData?.nodes || STARTER_PRESETS[0].data.nodes,
                edges: parsedData?.edges || STARTER_PRESETS[0].data.edges,
                created_at: d.created_at,
                updated_at: d.updated_at
              };
            });
            setDiagrams(formatted);
            setCurrentDiagramId(formatted[0].id);
            setNodes(formatted[0].nodes || []);
            setEdges(formatted[0].edges || []);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching server diagrams, using offline:', err);
      }
    }

    const offline = getOfflineDiagrams();
    setDiagrams(offline);
    if (offline.length > 0) {
      setCurrentDiagramId(offline[0].id);
      setNodes(offline[0].nodes || []);
      setEdges(offline[0].edges || []);
    }
  }, [currentUser, setNodes, setEdges]);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  // Connect handler between ports
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#58a6ff', strokeWidth: 2 }
    }, eds));
    triggerAutoSave();
  }, [setEdges]);

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setNodes(currentNodes => {
        setEdges(currentEdges => {
          if (!currentDiagramId) return currentEdges;

          const updatedDiag = {
            id: currentDiagramId,
            title: diagrams.find(d => String(d.id) === String(currentDiagramId))?.title || 'Схема',
            nodes: currentNodes,
            edges: currentEdges,
            updated_at: new Date().toISOString()
          };

          saveOfflineDiagram(updatedDiag);

          if (currentUser && typeof currentDiagramId === 'number') {
            authFetch(`/api/diagrams/${currentDiagramId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: updatedDiag.title,
                xml: JSON.stringify({ nodes: currentNodes, edges: currentEdges })
              })
            }).catch(console.error);
          }

          setSaveStatus('saved');
          return currentEdges;
        });
        return currentNodes;
      });
    }, 800);
  }, [currentDiagramId, diagrams, currentUser, setNodes, setEdges]);

  // Trigger autosave when nodes or edges change
  const handleNodesChange = (changes) => {
    onNodesChange(changes);
    const hasPositionOrRemove = changes.some(c => c.type === 'position' && c.dragging === false || c.type === 'remove');
    if (hasPositionOrRemove) {
      triggerAutoSave();
    }
  };

  const handleEdgesChange = (changes) => {
    onEdgesChange(changes);
    const hasRemove = changes.some(c => c.type === 'remove');
    if (hasRemove) triggerAutoSave();
  };

  // Switch diagram
  const handleSelectDiagram = (diagId) => {
    const target = diagrams.find(d => String(d.id) === String(diagId));
    if (!target) return;

    setCurrentDiagramId(target.id);
    setNodes(target.nodes || []);
    setEdges(target.edges || []);
  };

  // Add new GameDev Prefab node
  const handleAddHierarchyNode = () => {
    const newId = 'node_' + Date.now();
    const newNode = {
      id: newId,
      type: 'hierarchyNode',
      position: { x: 100 + Math.random() * 80, y: 100 + Math.random() * 80 },
      data: {
        tag: 'PREFAB',
        rootPath: 'Assets/Prefabs/NewEntity/NewEntity.prefab',
        items: [
          { level: 0, isLast: true, icon: '🟢', name: 'NewEntity', details: 'Transform, Rigidbody' },
          { level: 1, isLast: true, icon: '👁️', name: 'MeshVisual', details: 'MeshFilter, MeshRenderer' }
        ]
      }
    };
    setNodes(nds => [...nds, newNode]);
    triggerAutoSave();
  };

  // Add new Logic Step node
  const handleAddLogicNode = () => {
    const newId = 'node_' + Date.now();
    const newNode = {
      id: newId,
      type: 'logicNode',
      position: { x: 200 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: {
        nodeType: 'LOGIC',
        title: 'EntityController.Tick()',
        lines: [
          { prefix: '├── ', icon: '⚡', code: 'if (isActive && isGrounded)', comment: 'Проверка флагов' },
          { prefix: '└── ', icon: '🔄', code: 'PerformAction(deltaTime);', comment: 'Выполнение шага' }
        ]
      }
    };
    setNodes(nds => [...nds, newNode]);
    triggerAutoSave();
  };

  // Create new diagram with preset
  const handleCreateDiagram = async () => {
    const preset = STARTER_PRESETS.find(p => p.id === selectedPresetId) || STARTER_PRESETS[0];
    const finalTitle = newTitle.trim() || preset.title || 'Новая схема';
    const finalNodes = JSON.parse(JSON.stringify(preset.data.nodes));
    const finalEdges = JSON.parse(JSON.stringify(preset.data.edges));

    if (currentUser) {
      try {
        const res = await authFetch('/api/diagrams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: finalTitle,
            xml: JSON.stringify({ nodes: finalNodes, edges: finalEdges })
          })
        });
        if (res.ok) {
          const created = await res.json();
          const newDiag = { id: created.id, title: finalTitle, nodes: finalNodes, edges: finalEdges };
          setDiagrams(prev => [newDiag, ...prev]);
          setCurrentDiagramId(newDiag.id);
          setNodes(finalNodes);
          setEdges(finalEdges);
          setIsNewModalOpen(false);
          setNewTitle('');
          return;
        }
      } catch (e) {
        console.error('Failed to create server diagram:', e);
      }
    }

    const newLocal = {
      id: 'diag_' + Date.now(),
      title: finalTitle,
      nodes: finalNodes,
      edges: finalEdges,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = saveOfflineDiagram(newLocal);
    setDiagrams(updated);
    setCurrentDiagramId(newLocal.id);
    setNodes(finalNodes);
    setEdges(finalEdges);
    setIsNewModalOpen(false);
    setNewTitle('');
  };

  // Delete current diagram
  const handleDeleteDiagram = () => {
    if (diagrams.length <= 1) {
      alert('Нельзя удалить последнюю схему.');
      return;
    }
    const current = diagrams.find(d => String(d.id) === String(currentDiagramId));
    if (!window.confirm(`Удалить схему «${current?.title || ''}»?`)) return;

    deleteOfflineDiagram(currentDiagramId);
    if (currentUser && typeof currentDiagramId === 'number') {
      authFetch(`/api/diagrams/${currentDiagramId}`, { method: 'DELETE' }).catch(console.error);
    }

    const remaining = diagrams.filter(d => String(d.id) !== String(currentDiagramId));
    setDiagrams(remaining);
    setCurrentDiagramId(remaining[0].id);
    setNodes(remaining[0].nodes || []);
    setEdges(remaining[0].edges || []);
  };

  // Save node edit modal changes
  const handleSaveNodeEdit = () => {
    if (!editingNodeId) return;

    setNodes(currentNodes => {
      return currentNodes.map(n => {
        if (n.id !== editingNodeId) return n;

        if (n.type === 'hierarchyNode') {
          // Parse lines
          const lines = editFormData.itemsText.split('\n').filter(l => l.trim().length > 0);
          const parsedItems = lines.map((line, idx) => {
            const raw = line.trim();
            const isLast = raw.startsWith('└──') || idx === lines.length - 1;
            const cleaned = raw.replace(/^[├└]──\s*/, '');
            const matchDetails = cleaned.match(/^(.*?)\s*\((.*?)\)$/);

            let icon = '';
            let name = cleaned;
            let details = '';

            if (matchDetails) {
              name = matchDetails[1];
              details = matchDetails[2];
            }

            const iconMatch = name.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji})\s*(.*)$/u);
            if (iconMatch) {
              icon = iconMatch[1];
              name = iconMatch[2];
            }

            // Estimate level from leading whitespace
            const leadingSpaces = line.search(/\S|$/);
            const level = Math.max(0, Math.floor(leadingSpaces / 2));

            return { level, isLast, icon, name: name.trim(), details: details.trim() };
          });

          return {
            ...n,
            data: {
              ...n.data,
              rootPath: editFormData.rootPath || n.data.rootPath,
              tag: editFormData.tag || 'PREFAB',
              items: parsedItems.length > 0 ? parsedItems : n.data.items
            }
          };
        } else {
          const lines = editFormData.linesText.split('\n').filter(l => l.trim().length > 0);
          const parsedLines = lines.map(line => {
            const raw = line.trim();
            const prefix = raw.startsWith('└──') ? '└── ' : '├── ';
            const cleaned = raw.replace(/^[├└]──\s*/, '');
            const commentSplit = cleaned.split('//');
            return {
              prefix,
              code: commentSplit[0]?.trim() || '',
              comment: commentSplit[1]?.trim() || ''
            };
          });

          return {
            ...n,
            data: {
              ...n.data,
              title: editFormData.title || n.data.title,
              nodeType: editFormData.nodeType || 'SCRIPT',
              lines: parsedLines.length > 0 ? parsedLines : n.data.lines
            }
          };
        }
      });
    });

    setIsNodeEditModalOpen(false);
    triggerAutoSave();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      workspaceContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const activeDiagram = diagrams.find(d => String(d.id) === String(currentDiagramId)) || diagrams[0];

  return (
    <div
      ref={workspaceContainerRef}
      className={`diagram-workspace-container ${isFullscreen ? 'diagram-fullscreen' : ''}`}
    >
      {/* Top Header Bar */}
      <div className="diagram-top-bar">
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
              onChange={(e) => handleSelectDiagram(e.target.value)}
              title="Выберите схему"
            >
              {diagrams.map(diag => (
                <option key={diag.id} value={diag.id}>
                  {diag.title}
                </option>
              ))}
            </select>
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
          <button
            className="btn-diagram-tool btn-primary-diagram"
            onClick={handleAddHierarchyNode}
            title="Добавить блок префаба / иерархии объектов"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>account_tree</span>
            <span>+ Префаб</span>
          </button>

          <button
            className="btn-diagram-tool"
            onClick={handleAddLogicNode}
            title="Добавить блок алгоритма / логики"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--github-yellow)' }}>code</span>
            <span>+ Логика</span>
          </button>

          <button
            className="btn-diagram-tool"
            onClick={() => { setNewTitle(''); setIsNewModalOpen(true); }}
            title="Создать новую схему"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
            <span>Новая схема</span>
          </button>

          <button
            className="btn-diagram-tool btn-danger-tool"
            onClick={handleDeleteDiagram}
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

      {/* React Flow Canvas */}
      <div className="diagram-canvas-viewport">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#58a6ff', strokeWidth: 2 }
          }}
        >
          <Background variant="dots" gap={18} size={1.2} color="#30363d" />
          <Controls className="react-flow-custom-controls" />
          <MiniMap
            className="react-flow-custom-minimap"
            nodeColor={() => '#1f242c'}
            maskColor="rgba(13, 17, 23, 0.75)"
          />
        </ReactFlow>
      </div>

      {/* Modal: New Diagram with Presets */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal-content diagram-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
                  dashboard_customize
                </span>
                <h2 className="modal-title">Создать новую схему</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsNewModalOpen(false)}>✕</button>
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
              <button className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleCreateDiagram}>Создать схему</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Node Content */}
      {isNodeEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNodeEditModalOpen(false)}>
          <div className="modal-content diagram-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Редактирование содержимого блока</h2>
              <button className="btn-close-modal" onClick={() => setIsNodeEditModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              {editFormData.type === 'hierarchyNode' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Путь к ассету / префабу</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.rootPath}
                      onChange={(e) => setEditFormData({ ...editFormData, rootPath: e.target.value })}
                      placeholder="Assets/Prefabs/Player/Player.prefab"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Иерархия объектов и компонентов (по строкам)</label>
                    <div className="form-hint" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Формат строки: <code>└── 🟢 ИмяОбъекта (Компонент1, Компонент2)</code>
                    </div>
                    <textarea
                      rows={8}
                      className="form-control"
                      style={{ fontFamily: 'Consolas, monospace', fontSize: '0.88rem' }}
                      value={editFormData.itemsText}
                      onChange={(e) => setEditFormData({ ...editFormData, itemsText: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Заголовок / Имя скрипта</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Код и комментарии логики (по строкам)</label>
                    <textarea
                      rows={6}
                      className="form-control"
                      style={{ fontFamily: 'Consolas, monospace', fontSize: '0.88rem' }}
                      value={editFormData.linesText}
                      onChange={(e) => setEditFormData({ ...editFormData, linesText: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNodeEditModalOpen(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveNodeEdit}>Применить изменения</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
