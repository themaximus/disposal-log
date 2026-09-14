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
import DeletableEdge from './diagram/DeletableEdge';
import BlockInspectorModal from './diagram/BlockInspectorModal';
import BlockPrefabsModal from './diagram/BlockPrefabsModal';
import { DiagramActionsContext } from './DiagramActionsContext';
import {
  STARTER_PRESETS,
  getOfflineDiagrams,
  saveOfflineDiagram,
  deleteOfflineDiagram,
  saveBlockPrefab
} from '../utils/diagramStorage';

const COMMON_ICONS = ['🟢', '👁️', '📷', '🎯', '📱', '📦', '⚔️', '🛡️', '⚙️', '💀', '💡', '🔊', '🎮', '✨', '🧟', '🦴', '⚡', '🔄', '📡', '🏷️'];

// Static types registry for React Flow
const nodeTypes = {
  hierarchyNode: GameDevHierarchyNode,
  logicNode: LogicStepNode
};

const edgeTypes = {
  deletable: DeletableEdge
};

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

  // Block Inspector & Prefabs modals
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorNodeId, setInspectorNodeId] = useState(null);
  const [isPrefabsModalOpen, setIsPrefabsModalOpen] = useState(false);

  // Modals & Detailed Node Editing
  const [isNodeEditModalOpen, setIsNodeEditModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editModeTab, setEditModeTab] = useState('visual'); // 'visual' | 'raw'
  const [editHierarchyData, setEditHierarchyData] = useState({ rootPath: '', tag: 'PREFAB', items: [], rawText: '' });
  const [editLogicData, setEditLogicData] = useState({ title: '', nodeType: 'SCRIPT', lines: [], rawText: '' });

  // Tag Modal for '@' button
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagModalNodeId, setTagModalNodeId] = useState(null);
  const [tagInputValue, setTagInputValue] = useState('');

  const workspaceContainerRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Auth fetch helper
  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('session_token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      if (!currentDiagramId) return;

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
    }, 400);
  }, [currentDiagramId, diagrams, currentUser]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    triggerAutoSave();
  }, [setNodes, setEdges, triggerAutoSave]);

  // Delete edge
  const handleDeleteEdge = useCallback((edgeId) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave]);

  // Update edge label
  const handleUpdateEdgeLabel = useCallback((edgeId, newLabel) => {
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        label: newLabel,
        data: { ...(e.data || {}), label: newLabel }
      };
    }));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave]);

  // Quick add item directly from card
  const handleQuickAdd = useCallback((nodeId) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      if (n.type === 'hierarchyNode') {
        const items = [...(n.data.items || [])];
        const updatedItems = items.map((it, idx) => idx === items.length - 1 ? { ...it, isLast: false } : it);
        updatedItems.push({
          level: items.length > 0 ? (items[items.length - 1].level || 1) : 0,
          isLast: true,
          icon: '⚙️',
          name: 'NewComponent',
          details: 'Component, Script'
        });
        return {
          ...n,
          data: { ...n.data, items: updatedItems }
        };
      } else {
        const lines = [...(n.data.lines || [])];
        const updatedLines = lines.map((l, idx) => idx === lines.length - 1 ? { ...l, prefix: '├── ' } : l);
        updatedLines.push({
          prefix: '└── ',
          icon: '⚡',
          code: 'ExecuteAction()',
          comment: 'Новый шаг логики'
        });
        return {
          ...n,
          data: { ...n.data, lines: updatedLines }
        };
      }
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline update for hierarchy item
  const handleUpdateHierarchyItem = useCallback((nodeId, itemIndex, updatedItem) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const items = [...(n.data.items || [])];
      if (itemIndex < items.length) {
        items[itemIndex] = { ...items[itemIndex], ...updatedItem };
      }
      return { ...n, data: { ...n.data, items } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline delete for hierarchy item
  const handleDeleteHierarchyItem = useCallback((nodeId, itemIndex) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const items = (n.data.items || []).filter((_, idx) => idx !== itemIndex);
      if (items.length > 0) {
        items[items.length - 1] = { ...items[items.length - 1], isLast: true };
      }
      return { ...n, data: { ...n.data, items } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline update for hierarchy root path
  const handleUpdateHierarchyRoot = useCallback((nodeId, newRootPath) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, rootPath: newRootPath } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline update for logic line
  const handleUpdateLogicLine = useCallback((nodeId, lineIndex, updatedLine) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const lines = [...(n.data.lines || [])];
      if (lineIndex < lines.length) {
        lines[lineIndex] = { ...lines[lineIndex], ...updatedLine };
      }
      return { ...n, data: { ...n.data, lines } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline delete for logic line
  const handleDeleteLogicLine = useCallback((nodeId, lineIndex) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const lines = (n.data.lines || []).filter((_, idx) => idx !== lineIndex);
      if (lines.length > 0) {
        lines[lines.length - 1] = { ...lines[lines.length - 1], prefix: '└── ' };
      }
      return { ...n, data: { ...n.data, lines } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Inline update for logic method title
  const handleUpdateLogicTitle = useCallback((nodeId, newTitle) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, title: newTitle } };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Open Tag / Mention Modal
  const handleOpenTagModal = useCallback((nodeId) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (target) {
      setTagModalNodeId(nodeId);
      setTagInputValue(target.data.tag || target.data.nodeType || '');
      setIsTagModalOpen(true);
    }
  }, []);

  // Open Block Inspector Modal
  const handleOpenInspector = useCallback((nodeId) => {
    setInspectorNodeId(nodeId);
    setIsInspectorOpen(true);
  }, []);

  // Update node data from Inspector
  const handleUpdateNodeData = useCallback((nodeId, updatedData) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        data: { ...n.data, ...updatedData }
      };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Save prefab handler
  const handleSavePrefab = useCallback((prefab) => {
    saveBlockPrefab(prefab);
  }, []);

  // Spawn prefab handler
  const handleSpawnPrefab = useCallback((prefab) => {
    const newId = 'node_' + Date.now();
    const newNode = {
      id: newId,
      type: prefab.type || 'hierarchyNode',
      position: { x: 250 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: JSON.parse(JSON.stringify(prefab.data || {}))
    };
    setNodes(nds => [...nds, newNode]);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave]);

  // Node edit callback - Opens detailed modal
  const handleEditNode = useCallback((nodeId) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (!target) {
      console.warn('Node not found for editing:', nodeId);
      return;
    }

    setEditingNodeId(nodeId);
    if (target.type === 'hierarchyNode') {
      const items = target.data?.items || [];
      const rawText = items.map(i => {
        const indent = '  '.repeat(i.level || 0);
        const branch = i.isLast ? '└── ' : '├── ';
        const icon = i.icon ? i.icon + ' ' : '';
        const details = i.details ? ` (${i.details})` : '';
        return `${indent}${branch}${icon}${i.name}${details}`;
      }).join('\n');

      setEditHierarchyData({
        rootPath: target.data?.rootPath || '',
        tag: target.data?.tag || 'PREFAB',
        items: JSON.parse(JSON.stringify(items)),
        rawText
      });
    } else {
      const lines = target.data?.lines || [];
      const rawText = lines.map(l => {
        const prefix = l.prefix || '├── ';
        const icon = l.icon ? l.icon + ' ' : '';
        const comment = l.comment ? ` // ${l.comment}` : '';
        return `${prefix}${icon}${l.code}${comment}`;
      }).join('\n');

      setEditLogicData({
        title: target.data?.title || '',
        nodeType: target.data?.nodeType || 'SCRIPT',
        lines: JSON.parse(JSON.stringify(lines)),
        rawText
      });
    }
    setEditModeTab('visual');
    setIsNodeEditModalOpen(true);
  }, []);

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

  // Connect handler between ports - supports multiple and loose connections with DeletableEdge
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'deletable',
      animated: true,
      style: { stroke: '#58a6ff', strokeWidth: 2 }
    }, eds));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave]);

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

  // Helpers for visual row editing inside modal
  const addHierarchyItemRow = () => {
    setEditHierarchyData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { level: 1, isLast: true, icon: '⚙️', name: 'NewSubItem', details: '' }
      ]
    }));
  };

  const removeHierarchyItemRow = (index) => {
    setEditHierarchyData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const updateHierarchyItemRow = (index, field, value) => {
    setEditHierarchyData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const addLogicLineRow = () => {
    setEditLogicData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { prefix: '├── ', icon: '⚡', code: 'DoSomething()', comment: 'Комментарий' }
      ]
    }));
  };

  const removeLogicLineRow = (index) => {
    setEditLogicData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));
  };

  const updateLogicLineRow = (index, field, value) => {
    setEditLogicData(prev => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lines: updated };
    });
  };

  // Save Tag from Tag Modal
  const handleSaveTag = () => {
    if (!tagModalNodeId) return;
    const finalVal = tagInputValue.trim().toUpperCase();

    setNodes(nds => nds.map(n => {
      if (n.id !== tagModalNodeId) return n;
      if (n.type === 'hierarchyNode') {
        return { ...n, data: { ...n.data, tag: finalVal } };
      } else {
        return { ...n, data: { ...n.data, nodeType: finalVal || 'LOGIC' } };
      }
    }));

    setIsTagModalOpen(false);
    triggerAutoSave();
  };

  // Save Node Edit Modal changes
  const handleSaveNodeEdit = () => {
    if (!editingNodeId) return;

    setNodes(nds => nds.map(n => {
      if (n.id !== editingNodeId) return n;

      if (n.type === 'hierarchyNode') {
        if (editModeTab === 'raw') {
          const lines = editHierarchyData.rawText.split('\n').filter(l => l.trim().length > 0);
          const parsed = lines.map((line, idx) => {
            const raw = line.trim();
            const isLast = raw.startsWith('└──') || idx === lines.length - 1;
            const cleaned = raw.replace(/^[├└]──\s*/, '');
            const match = cleaned.match(/^(.*?)\s*\((.*?)\)$/);

            let icon = '';
            let name = cleaned;
            let details = '';
            if (match) {
              name = match[1];
              details = match[2];
            }
            const iconMatch = name.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Emoji})\s*(.*)$/u);
            if (iconMatch) {
              icon = iconMatch[1];
              name = iconMatch[2];
            }
            const leading = line.search(/\S|$/);
            const level = Math.max(0, Math.floor(leading / 2));
            return { level, isLast, icon, name: name.trim(), details: details.trim() };
          });

          return {
            ...n,
            data: {
              ...n.data,
              rootPath: editHierarchyData.rootPath || n.data.rootPath,
              tag: editHierarchyData.tag || n.data.tag,
              items: parsed.length > 0 ? parsed : n.data.items
            }
          };
        } else {
          return {
            ...n,
            data: {
              ...n.data,
              rootPath: editHierarchyData.rootPath,
              tag: editHierarchyData.tag,
              items: editHierarchyData.items
            }
          };
        }
      } else {
        if (editModeTab === 'raw') {
          const lines = editLogicData.rawText.split('\n').filter(l => l.trim().length > 0);
          const parsed = lines.map(line => {
            const raw = line.trim();
            const prefix = raw.startsWith('└──') ? '└── ' : '├── ';
            const cleaned = raw.replace(/^[├└]──\s*/, '');
            const split = cleaned.split('//');
            return {
              prefix,
              code: split[0]?.trim() || '',
              comment: split[1]?.trim() || ''
            };
          });

          return {
            ...n,
            data: {
              ...n.data,
              title: editLogicData.title || n.data.title,
              nodeType: editLogicData.nodeType || n.data.nodeType,
              lines: parsed.length > 0 ? parsed : n.data.lines
            }
          };
        } else {
          return {
            ...n,
            data: {
              ...n.data,
              title: editLogicData.title,
              nodeType: editLogicData.nodeType,
              lines: editLogicData.lines
            }
          };
        }
      }
    }));

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
            className="btn-diagram-tool btn-prefabs-library"
            onClick={() => setIsPrefabsModalOpen(true)}
            title="Библиотека готовых и пользовательских префабов блоков"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#bc8cff' }}>category</span>
            <span>📦 Префабы</span>
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
        <DiagramActionsContext.Provider
          value={{
            onOpenInspector: handleOpenInspector,
            onEditNode: handleEditNode,
            onDeleteNode: handleDeleteNode,
            onQuickAdd: handleQuickAdd,
            onOpenTagModal: handleOpenTagModal,
            onUpdateHierarchyItem: handleUpdateHierarchyItem,
            onDeleteHierarchyItem: handleDeleteHierarchyItem,
            onUpdateHierarchyRoot: handleUpdateHierarchyRoot,
            onUpdateLogicLine: handleUpdateLogicLine,
            onDeleteLogicLine: handleDeleteLogicLine,
            onUpdateLogicTitle: handleUpdateLogicTitle,
            onDeleteEdge: handleDeleteEdge,
            onUpdateEdgeLabel: handleUpdateEdgeLabel
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode="dark"
            connectionMode="loose"
            deleteKeyCode={['Backspace', 'Delete']}
            edgesFocusable={true}
            edgesReconnectable={true}
            defaultEdgeOptions={{
              type: 'deletable',
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
        </DiagramActionsContext.Provider>
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

      {/* Modal: Detailed Node Editor */}
      {isNodeEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNodeEditModalOpen(false)}>
          <div className="modal-content diagram-modal node-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--github-green-text)' }}>
                  edit_document
                </span>
                <h2 className="modal-title">
                  {editingNodeId && nodes.find(n => n.id === editingNodeId)?.type === 'logicNode'
                    ? 'Редактирование блока логики'
                    : 'Редактирование блока префаба'}
                </h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsNodeEditModalOpen(false)}>✕</button>
            </div>

            <div className="node-editor-tabs-bar">
              <button
                className={`node-tab-btn ${editModeTab === 'visual' ? 'active' : ''}`}
                onClick={() => setEditModeTab('visual')}
              >
                Визуальный конструктор
              </button>
              <button
                className={`node-tab-btn ${editModeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setEditModeTab('raw')}
              >
                Текстовый режим (Raw Text)
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {editingNodeId && nodes.find(n => n.id === editingNodeId)?.type === 'hierarchyNode' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Путь к ассету / файлу</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editHierarchyData.rootPath}
                        onChange={(e) => setEditHierarchyData({ ...editHierarchyData, rootPath: e.target.value })}
                        placeholder="Assets/Prefabs/Player/Player.prefab"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Тег сущности</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editHierarchyData.tag}
                        onChange={(e) => setEditHierarchyData({ ...editHierarchyData, tag: e.target.value.toUpperCase() })}
                        placeholder="PREFAB"
                      />
                    </div>
                  </div>

                  {editModeTab === 'visual' ? (
                    <div className="form-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="form-label" style={{ margin: 0 }}>Компоненты и дочерние объекты</label>
                        <button type="button" className="btn-diagram-tool btn-primary-diagram" onClick={addHierarchyItemRow} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                          + Добавить строку
                        </button>
                      </div>

                      <div className="node-builder-table">
                        {editHierarchyData.items.map((item, idx) => (
                          <div key={idx} className="builder-row">
                            <select
                              className="builder-select-level"
                              value={item.level || 0}
                              onChange={(e) => updateHierarchyItemRow(idx, 'level', Number(e.target.value))}
                              title="Уровень вложенности"
                            >
                              <option value="0">Root (lvl 0)</option>
                              <option value="1">Sub (lvl 1)</option>
                              <option value="2">Child (lvl 2)</option>
                              <option value="3">Leaf (lvl 3)</option>
                            </select>

                            <input
                              type="text"
                              className="builder-input-icon"
                              value={item.icon || '🟢'}
                              onChange={(e) => updateHierarchyItemRow(idx, 'icon', e.target.value)}
                              title="Иконка (эмодзи)"
                            />

                            <input
                              type="text"
                              className="builder-input-name"
                              value={item.name}
                              onChange={(e) => updateHierarchyItemRow(idx, 'name', e.target.value)}
                              placeholder="Имя объекта (напр. Main Camera)"
                              title="Имя объекта"
                            />

                            <input
                              type="text"
                              className="builder-input-details"
                              value={item.details || ''}
                              onChange={(e) => updateHierarchyItemRow(idx, 'details', e.target.value)}
                              placeholder="Компоненты (напр. Camera, AudioListener)"
                              title="Компоненты в скобках"
                            />

                            <button
                              type="button"
                              className="builder-btn-delete"
                              onClick={() => removeHierarchyItemRow(idx)}
                              title="Удалить строку"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="icon-palette-bar" style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Быстрые иконки:</span>
                        {COMMON_ICONS.slice(0, 14).map(icon => (
                          <button
                            key={icon}
                            type="button"
                            className="icon-palette-chip"
                            onClick={() => {
                              if (editHierarchyData.items.length > 0) {
                                updateHierarchyItemRow(editHierarchyData.items.length - 1, 'icon', icon);
                              }
                            }}
                            title={`Вставить ${icon} в последнюю строку`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Исходный текст структуры</label>
                      <textarea
                        rows={10}
                        className="form-control"
                        style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                        value={editHierarchyData.rawText}
                        onChange={(e) => setEditHierarchyData({ ...editHierarchyData, rawText: e.target.value })}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Метод / Скрипт</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editLogicData.title}
                        onChange={(e) => setEditLogicData({ ...editLogicData, title: e.target.value })}
                        placeholder="PlayerController.Update()"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Тип блока</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editLogicData.nodeType}
                        onChange={(e) => setEditLogicData({ ...editLogicData, nodeType: e.target.value.toUpperCase() })}
                        placeholder="LOGIC"
                      />
                    </div>
                  </div>

                  {editModeTab === 'visual' ? (
                    <div className="form-group">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="form-label" style={{ margin: 0 }}>Шаги выполнения логики</label>
                        <button type="button" className="btn-diagram-tool btn-primary-diagram" onClick={addLogicLineRow} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                          + Добавить строку
                        </button>
                      </div>

                      <div className="node-builder-table">
                        {editLogicData.lines.map((line, idx) => (
                          <div key={idx} className="builder-row">
                            <input
                              type="text"
                              className="builder-input-icon"
                              value={line.icon || '⚡'}
                              onChange={(e) => updateLogicLineRow(idx, 'icon', e.target.value)}
                              title="Иконка шага"
                            />

                            <input
                              type="text"
                              className="builder-input-name"
                              value={line.code}
                              onChange={(e) => updateLogicLineRow(idx, 'code', e.target.value)}
                              placeholder="Код (напр. HandleMovement())"
                              style={{ flex: 1.5 }}
                              title="Код действия"
                            />

                            <input
                              type="text"
                              className="builder-input-details"
                              value={line.comment || ''}
                              onChange={(e) => updateLogicLineRow(idx, 'comment', e.target.value)}
                              placeholder="Пояснение / Комментарий"
                              style={{ flex: 1 }}
                              title="Комментарий"
                            />

                            <button
                              type="button"
                              className="builder-btn-delete"
                              onClick={() => removeLogicLineRow(idx)}
                              title="Удалить строку"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Исходный код шагов логики</label>
                      <textarea
                        rows={10}
                        className="form-control"
                        style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                        value={editLogicData.rawText}
                        onChange={(e) => setEditLogicData({ ...editLogicData, rawText: e.target.value })}
                      />
                    </div>
                  )}
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

      {/* Modal: '@' Tag / Mention Modal */}
      {isTagModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTagModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
                  label
                </span>
                <h2 className="modal-title">Привязка и Тег блока</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setIsTagModalOpen(false)}>✕</button>
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTag(); }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', marginBottom: '4px' }}>Популярные теги:</span>
                {['PREFAB', 'PLAYER', 'ENEMY', 'LOOT', 'GAMEPLAY SCRIPT', 'FSM AI', 'UI', 'PHYSICS', 'AUDIO'].map(tag => (
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
              <button className="btn btn-secondary" onClick={() => setIsTagModalOpen(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSaveTag}>Сохранить тег</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Inspector Modal (Properties & Style) */}
      <BlockInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        node={inspectorNodeId ? nodes.find(n => n.id === inspectorNodeId) : null}
        onUpdateNodeData={handleUpdateNodeData}
        onSavePrefab={handleSavePrefab}
      />

      {/* Block Prefabs Catalog Modal */}
      <BlockPrefabsModal
        isOpen={isPrefabsModalOpen}
        onClose={() => setIsPrefabsModalOpen(false)}
        onSpawnPrefab={handleSpawnPrefab}
      />
    </div>
  );
}
