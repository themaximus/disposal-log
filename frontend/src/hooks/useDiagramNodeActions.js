// useDiagramNodeActions.js - Хук операций над узлами, ребрами, строками и модальными окнами редактирования нод
import { useState, useCallback } from 'react';
import { addEdge } from '@xyflow/react';
import { saveBlockPrefab } from '../utils/diagramStorage';
import DiagramGroupingService from '../utils/diagramGroupingService';
import {
  updateRow,
  removeRow,
  indentRow,
  insertRow,
  rowLevel,
  childInsertIndex,
  siblingInsertIndex
} from '../utils/diagramNodeUtils';

export function useDiagramNodeActions({
  nodes,
  setNodes,
  edges,
  setEdges,
  nodesRef,
  triggerAutoSave,
  takeSnapshot
}) {
  // Block Inspector & Prefabs modals
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorNodeId, setInspectorNodeId] = useState(null);
  const [isPrefabsModalOpen, setIsPrefabsModalOpen] = useState(false);

  // Detailed Node Editing Modal
  const [isNodeEditModalOpen, setIsNodeEditModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editModeTab, setEditModeTab] = useState('visual'); // 'visual' | 'raw'
  const [editHierarchyData, setEditHierarchyData] = useState({ rootPath: '', tag: 'PREFAB', items: [], rawText: '' });
  const [editLogicData, setEditLogicData] = useState({ title: '', nodeType: 'SCRIPT', lines: [], rawText: '' });

  // Tag Modal (@)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagModalNodeId, setTagModalNodeId] = useState(null);
  const [tagInputValue, setTagInputValue] = useState('');

  // Inserts a new node near `customPos` (centered by `offset`) or near `fallback`.
  const spawnNode = useCallback((node, customPos, offset, fallback) => {
    if (takeSnapshot) takeSnapshot();
    const position = customPos ? {
      x: customPos.x - offset.x + (Math.random() - 0.5) * 40,
      y: customPos.y - offset.y + (Math.random() - 0.5) * 40
    } : {
      x: fallback.x + Math.random() * 80,
      y: fallback.y + Math.random() * 80
    };
    setNodes(nds => [...nds, { ...node, position }]);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Add new GameDev Prefab node
  const handleAddHierarchyNode = useCallback((customPos) => {
    spawnNode({
      id: 'node_' + Date.now(),
      type: 'hierarchyNode',
      data: {
        tag: 'PREFAB',
        rootPath: 'Assets/Prefabs/NewEntity/NewEntity.prefab',
        items: [
          { level: 0, isLast: true, icon: '🟢', name: 'NewEntity', details: 'Transform, Rigidbody' },
          { level: 1, isLast: true, icon: '👁️', name: 'MeshVisual', details: 'MeshFilter, MeshRenderer' }
        ]
      }
    }, customPos, { x: 160, y: 100 }, { x: 100, y: 100 });
  }, [spawnNode]);

  // Add new Logic Step node
  const handleAddLogicNode = useCallback((customPos) => {
    spawnNode({
      id: 'node_' + Date.now(),
      type: 'logicNode',
      data: {
        nodeType: 'LOGIC',
        title: 'EntityController.Tick()',
        lines: [
          { level: 0, prefix: '├── ', icon: '⚡', code: 'if (isActive && isGrounded)', comment: 'Проверка флагов' },
          { level: 1, prefix: '└── ', icon: '🔄', code: 'PerformAction(deltaTime);', comment: 'Выполнение шага' }
        ]
      }
    }, customPos, { x: 160, y: 80 }, { x: 200, y: 150 });
  }, [spawnNode]);

  // Add new Text / Note node
  const handleAddTextNode = useCallback((customPos) => {
    spawnNode({
      id: 'node_text_' + Date.now(),
      type: 'textNode',
      data: {
        tag: 'NOTE',
        icon: '📝',
        text: 'Новая текстовая надпись / примечание',
        textColor: '#f0f6fc',
        fontSize: 'md',
        align: 'left',
        scale: 1
      },
      style: { width: 280 }
    }, customPos, { x: 140, y: 60 }, { x: 180, y: 180 });
  }, [spawnNode]);

  // Spawn node connected to dragged wire
  const handleSpawnNodeConnected = useCallback(({ type, flowPosition, sourceNodeId, sourceHandleId, handleType }) => {
    if (takeSnapshot) takeSnapshot();
    const newId = 'node_' + (type === 'textNode' ? 'text_' : '') + Date.now();
    let newNode = null;

    if (type === 'hierarchyNode') {
      newNode = {
        id: newId,
        type: 'hierarchyNode',
        position: { x: flowPosition.x - 40, y: flowPosition.y - 40 },
        data: {
          tag: 'PREFAB',
          rootPath: 'Assets/Prefabs/NewEntity/NewEntity.prefab',
          items: [
            { level: 0, isLast: true, icon: '🟢', name: 'NewEntity', details: 'Transform, Rigidbody' },
            { level: 1, isLast: true, icon: '👁️', name: 'MeshVisual', details: 'MeshFilter, MeshRenderer' }
          ]
        }
      };
    } else if (type === 'logicNode') {
      newNode = {
        id: newId,
        type: 'logicNode',
        position: { x: flowPosition.x - 40, y: flowPosition.y - 40 },
        data: {
          nodeType: 'LOGIC',
          title: 'EntityController.Tick()',
          lines: [
            { level: 0, prefix: '├── ', icon: '⚡', code: 'if (isActive && isGrounded)', comment: 'Проверка флагов' },
            { level: 1, prefix: '└── ', icon: '🔄', code: 'PerformAction(deltaTime);', comment: 'Выполнение шага' }
          ]
        }
      };
    } else {
      newNode = {
        id: newId,
        type: 'textNode',
        position: { x: flowPosition.x - 40, y: flowPosition.y - 40 },
        data: {
          tag: 'NOTE',
          icon: '📝',
          text: 'Новая текстовая надпись / примечание',
          textColor: '#f0f6fc',
          fontSize: 'md',
          align: 'left',
          scale: 1
        },
        style: {
          width: 280
        }
      };
    }

    const sId = (sourceHandleId || '').toLowerCase();

    let targetHandleId = 'handle-left';
    if (sId.includes('left')) {
      targetHandleId = 'handle-right';
    } else if (sId.includes('right')) {
      targetHandleId = 'handle-left';
    } else if (sId.includes('top')) {
      targetHandleId = 'handle-bottom';
    } else if (sId.includes('bottom')) {
      targetHandleId = 'handle-top';
    }

    const newEdge = {
      id: `edge_${sourceNodeId}_${newId}_${Date.now()}`,
      source: sourceNodeId,
      target: newId,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
      type: 'deletable',
      animated: true,
      style: { stroke: '#58a6ff', strokeWidth: 2 }
    };

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => addEdge(newEdge, eds));
    triggerAutoSave();
  }, [setNodes, setEdges, triggerAutoSave, takeSnapshot]);

  // Update text node properties
  const handleUpdateTextNode = useCallback((nodeId, updates) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        data: {
          ...n.data,
          ...updates
        }
      };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    triggerAutoSave();
  }, [setNodes, setEdges, triggerAutoSave, takeSnapshot]);

  // Delete edge
  const handleDeleteEdge = useCallback((edgeId) => {
    if (takeSnapshot) takeSnapshot();
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave, takeSnapshot]);

  // Update edge label
  const handleUpdateEdgeLabel = useCallback((edgeId, newLabel) => {
    if (takeSnapshot) takeSnapshot();
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e;
      return {
        ...e,
        label: newLabel,
        data: { ...(e.data || {}), label: newLabel }
      };
    }));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave, takeSnapshot]);

  // Connect handler between ports
  const onConnect = useCallback((params) => {
    if (takeSnapshot) takeSnapshot();
    setEdges((eds) => addEdge({
      ...params,
      type: 'deletable',
      animated: true,
      style: { stroke: '#58a6ff', strokeWidth: 2 }
    }, eds));
    triggerAutoSave();
  }, [setEdges, triggerAutoSave, takeSnapshot]);

  // Scale single node
  const handleScaleNode = useCallback((nodeId, newScale) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => DiagramGroupingService.scaleSingleNode(nds, nodeId, newScale));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Quick add item directly from card
  const handleQuickAdd = useCallback((nodeId) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      if (n.type === 'hierarchyNode') {
        const items = [...(n.data.items || [])];
        const updatedItems = items.map((it, idx) => idx === items.length - 1 ? { ...it, isLast: false } : it);
        const lastLevel = items.length > 0 ? (items[items.length - 1].level ?? 0) : 0;
        updatedItems.push({
          level: lastLevel,
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
        const lastLevel = lines.length > 0 ? (lines[lines.length - 1].level ?? 0) : 0;
        updatedLines.push({
          level: lastLevel,
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
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Applies `transform(data)` to one node's data with undo snapshot + autosave.
  const mutateNodeData = useCallback((nodeId, transform) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.map(n => (n.id === nodeId ? { ...n, data: transform(n.data) } : n)));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  const mutateRows = useCallback((nodeId, field, transform) => {
    mutateNodeData(nodeId, data => ({ ...data, [field]: transform(data[field] || []) }));
  }, [mutateNodeData]);

  const currentRows = (nodeId, field) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    return (node && node.data[field]) || [];
  };

  // Hierarchy rows keep an `isLast` flag on the final item.
  const markLastItem = (items) => (items.length > 0
    ? items.map((it, idx) => (idx === items.length - 1 ? { ...it, isLast: true } : it))
    : items);

  // --- Hierarchy items ---

  const handleUpdateHierarchyItem = useCallback((nodeId, itemIndex, updatedItem) => {
    mutateRows(nodeId, 'items', items => (itemIndex < items.length ? updateRow(items, itemIndex, updatedItem) : items));
  }, [mutateRows]);

  const handleDeleteHierarchyItem = useCallback((nodeId, itemIndex) => {
    mutateRows(nodeId, 'items', items => markLastItem(removeRow(items, itemIndex)));
  }, [mutateRows]);

  const handleAddHierarchySubItem = useCallback((nodeId, parentIndex) => {
    const newIndex = childInsertIndex(currentRows(nodeId, 'items'), parentIndex);
    mutateRows(nodeId, 'items', items => markLastItem(insertRow(items, childInsertIndex(items, parentIndex), {
      level: rowLevel(items[parentIndex]) + 1,
      isLast: false,
      icon: '⚙️',
      name: 'NewChildObject',
      details: 'Component, Script'
    })));
    return newIndex;
  }, [mutateRows]);

  const handleAddHierarchySiblingItem = useCallback((nodeId, itemIndex) => {
    const newIndex = siblingInsertIndex(currentRows(nodeId, 'items'), itemIndex);
    mutateRows(nodeId, 'items', items => insertRow(items, siblingInsertIndex(items, itemIndex), {
      level: rowLevel(items[itemIndex]),
      isLast: true,
      icon: '⚙️',
      name: 'NewComponent',
      details: 'Component, Script'
    }));
    return newIndex;
  }, [mutateRows]);

  const handleIndentHierarchyItem = useCallback((nodeId, itemIndex, delta) => {
    mutateRows(nodeId, 'items', items => indentRow(items, itemIndex, delta));
  }, [mutateRows]);

  // Inline update for hierarchy root path, icon and color
  const handleUpdateHierarchyRoot = useCallback((nodeId, updates) => {
    const rootUpdates = typeof updates === 'string' ? { rootPath: updates } : updates;
    mutateNodeData(nodeId, data => ({ ...data, ...rootUpdates }));
  }, [mutateNodeData]);

  // --- Logic lines ---

  const handleUpdateLogicLine = useCallback((nodeId, lineIndex, updatedLine) => {
    mutateRows(nodeId, 'lines', lines => (lineIndex < lines.length ? updateRow(lines, lineIndex, updatedLine) : lines));
  }, [mutateRows]);

  const handleDeleteLogicLine = useCallback((nodeId, lineIndex) => {
    mutateRows(nodeId, 'lines', lines => removeRow(lines, lineIndex));
  }, [mutateRows]);

  const handleAddLogicSubLine = useCallback((nodeId, parentIndex) => {
    const newIndex = childInsertIndex(currentRows(nodeId, 'lines'), parentIndex);
    mutateRows(nodeId, 'lines', lines => insertRow(lines, childInsertIndex(lines, parentIndex), {
      level: rowLevel(lines[parentIndex]) + 1,
      prefix: '├── ',
      icon: '⚡',
      code: 'ExecuteSubAction()',
      comment: 'Вложенное действие'
    }));
    return newIndex;
  }, [mutateRows]);

  const handleAddLogicSiblingLine = useCallback((nodeId, lineIndex) => {
    const newIndex = siblingInsertIndex(currentRows(nodeId, 'lines'), lineIndex);
    mutateRows(nodeId, 'lines', lines => insertRow(lines, siblingInsertIndex(lines, lineIndex), {
      level: rowLevel(lines[lineIndex]),
      icon: '⚡',
      code: 'PerformAction()',
      comment: 'Новый шаг'
    }));
    return newIndex;
  }, [mutateRows]);

  const handleIndentLogicLine = useCallback((nodeId, lineIndex, delta) => {
    mutateRows(nodeId, 'lines', lines => indentRow(lines, lineIndex, delta));
  }, [mutateRows]);

  // Inline update for logic method title, icon and color
  const handleUpdateLogicTitle = useCallback((nodeId, updates) => {
    const titleUpdates = typeof updates === 'string' ? { title: updates } : updates;
    mutateNodeData(nodeId, data => ({ ...data, ...titleUpdates }));
  }, [mutateNodeData]);

  // Open Tag / Mention Modal
  const handleOpenTagModal = useCallback((nodeId) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (target) {
      setTagModalNodeId(nodeId);
      setTagInputValue(target.data.tag || target.data.nodeType || '');
      setIsTagModalOpen(true);
    }
  }, [nodesRef]);

  // Save Tag from Tag Modal
  const handleSaveTag = useCallback(() => {
    if (!tagModalNodeId) return;
    if (takeSnapshot) takeSnapshot();
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
  }, [tagModalNodeId, tagInputValue, setNodes, triggerAutoSave, takeSnapshot]);

  // Open Block Inspector Modal
  const handleOpenInspector = useCallback((nodeId) => {
    setInspectorNodeId(nodeId);
    setIsInspectorOpen(true);
  }, []);

  // Update node data from Inspector
  const handleUpdateNodeData = useCallback((nodeId, updatedData) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.map(n => {
      if (String(n.id) !== String(nodeId)) return n;
      return {
        ...n,
        data: { ...n.data, ...updatedData }
      };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Save prefab handler
  const handleSavePrefab = useCallback((prefab) => {
    saveBlockPrefab(prefab);
  }, []);

  // Spawn prefab handler
  const handleSpawnPrefab = useCallback((prefab) => {
    if (takeSnapshot) takeSnapshot();
    const newId = 'node_' + Date.now();
    const newNode = {
      id: newId,
      type: prefab.type || 'hierarchyNode',
      position: { x: 250 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: JSON.parse(JSON.stringify(prefab.data || {}))
    };
    setNodes(nds => [...nds, newNode]);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Open Detailed Node Editor Modal
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
        const indent = '  '.repeat(l.level || 0);
        const prefix = l.prefix || '├── ';
        const icon = l.icon ? l.icon + ' ' : '';
        const comment = l.comment ? ` // ${l.comment}` : '';
        return `${indent}${prefix}${icon}${l.code}${comment}`;
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
  }, [nodesRef]);

  // Helpers for visual row editing inside modal
  const addHierarchyItemRow = useCallback(() => {
    setEditHierarchyData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { level: 1, isLast: true, icon: '⚙️', name: 'NewSubItem', details: '' }
      ]
    }));
  }, []);

  const removeHierarchyItemRow = useCallback((index) => {
    setEditHierarchyData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  }, []);

  const updateHierarchyItemRow = useCallback((index, field, value) => {
    setEditHierarchyData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  }, []);

  const addLogicLineRow = useCallback(() => {
    setEditLogicData(prev => {
      const lastLevel = prev.lines.length > 0 ? (prev.lines[prev.lines.length - 1].level || 0) : 0;
      return {
        ...prev,
        lines: [
          ...prev.lines,
          { level: lastLevel, prefix: '├── ', icon: '⚡', code: 'DoSomething()', comment: 'Комментарий' }
        ]
      };
    });
  }, []);

  const removeLogicLineRow = useCallback((index) => {
    setEditLogicData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));
  }, []);

  const updateLogicLineRow = useCallback((index, field, value) => {
    setEditLogicData(prev => {
      const updated = [...prev.lines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lines: updated };
    });
  }, []);

  // Save changes from Detailed Node Edit Modal
  const handleSaveNodeEdit = useCallback(() => {
    if (!editingNodeId) return;
    if (takeSnapshot) takeSnapshot();

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
            const leading = line.search(/\S|$/);
            const level = Math.max(0, Math.floor(leading / 2));
            const raw = line.trim();
            const prefix = raw.startsWith('└──') ? '└── ' : '├── ';
            const cleaned = raw.replace(/^[├└│\s─]*\s*/, '');
            const split = cleaned.split('//');
            return {
              level,
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
  }, [editingNodeId, editModeTab, editHierarchyData, editLogicData, setNodes, triggerAutoSave]);

  const editingNode = nodes.find(n => n.id === editingNodeId) || null;
  const inspectorNode = inspectorNodeId ? nodes.find(n => String(n.id) === String(inspectorNodeId)) : null;

  return {
    // Inspector & Prefabs Modals
    isInspectorOpen,
    setIsInspectorOpen,
    inspectorNodeId,
    inspectorNode,
    handleOpenInspector,
    handleUpdateNodeData,
    handleSavePrefab,
    handleSpawnPrefab,
    isPrefabsModalOpen,
    setIsPrefabsModalOpen,

    // Node Edit Modal
    isNodeEditModalOpen,
    setIsNodeEditModalOpen,
    editingNodeId,
    editingNode,
    editModeTab,
    setEditModeTab,
    editHierarchyData,
    setEditHierarchyData,
    editLogicData,
    setEditLogicData,
    handleEditNode,
    handleSaveNodeEdit,
    addHierarchyItemRow,
    removeHierarchyItemRow,
    updateHierarchyItemRow,
    addLogicLineRow,
    removeLogicLineRow,
    updateLogicLineRow,

    // Tag Modal
    isTagModalOpen,
    setIsTagModalOpen,
    tagModalNodeId,
    tagInputValue,
    setTagInputValue,
    handleOpenTagModal,
    handleSaveTag,

    // Actions
    handleAddHierarchyNode,
    handleAddLogicNode,
    handleAddTextNode,
    handleSpawnNodeConnected,
    handleUpdateTextNode,
    handleDeleteNode,
    handleDeleteEdge,
    handleUpdateEdgeLabel,
    onConnect,
    handleQuickAdd,
    handleScaleNode,
    handleUpdateHierarchyItem,
    handleDeleteHierarchyItem,
    handleAddHierarchySubItem,
    handleAddHierarchySiblingItem,
    handleIndentHierarchyItem,
    handleUpdateHierarchyRoot,
    handleUpdateLogicLine,
    handleDeleteLogicLine,
    handleAddLogicSubLine,
    handleAddLogicSiblingLine,
    handleIndentLogicLine,
    handleUpdateLogicTitle
  };
}

export default useDiagramNodeActions;
