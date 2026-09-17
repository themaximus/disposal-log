// useDiagramData.js - Хук управления диаграммами, автосохранением и синхронизацией
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DiagramSyncService from '../services/DiagramSyncService';
import DiagramGroupingService from '../utils/diagramGroupingService';
import { STARTER_PRESETS } from '../utils/diagramStorage';
import { normalizeHandleId } from '../utils/diagramFormatService';

const normalizeEdges = (eds = []) => (eds || []).map(e => ({
  ...e,
  sourceHandle: normalizeHandleId(e.sourceHandle) || null,
  targetHandle: normalizeHandleId(e.targetHandle) || null
}));

export function useDiagramData({ currentUser, nodes, setNodes, edges, setEdges }) {
  const [diagrams, setDiagrams] = useState([]);
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  const saveTimeoutRef = useRef(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Загрузка диаграмм
  const loadDiagrams = useCallback(async () => {
    const list = await DiagramSyncService.loadDiagrams(currentUser);
    setDiagrams(list);
    if (list.length > 0) {
      setCurrentDiagramId(list[0].id);
      setNodes(DiagramGroupingService.sortNodesParentsFirst(list[0].nodes || []));
      setEdges(normalizeEdges(list[0].edges || []));
    }
  }, [currentUser, setNodes, setEdges]);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  // Автосохранение с дебаунсом
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentDiagramId) return;

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const curDiagram = diagrams.find(d => String(d.id) === String(currentDiagramId));
      const title = curDiagram?.title || 'Схема';

      await DiagramSyncService.saveDiagram(currentDiagramId, title, currentNodes, currentEdges, currentUser);

      // Обновляем состояние diagrams в памяти
      setDiagrams(prev => prev.map(d => {
        if (String(d.id) === String(currentDiagramId)) {
          return {
            ...d,
            nodes: currentNodes,
            edges: currentEdges,
            updated_at: new Date().toISOString()
          };
        }
        return d;
      }));

      setSaveStatus('saved');
    }, 400);
  }, [currentDiagramId, diagrams, currentUser]);

  // Переключение активной схемы
  const handleSelectDiagram = useCallback((diagId) => {
    const target = diagrams.find(d => String(d.id) === String(diagId));
    if (!target) return;

    setCurrentDiagramId(target.id);
    setNodes(DiagramGroupingService.sortNodesParentsFirst(target.nodes || []));
    setEdges(normalizeEdges(target.edges || []));
  }, [diagrams, setNodes, setEdges]);

  // Создание новой схемы
  const handleCreateDiagram = useCallback(async (title, presetId) => {
    const preset = STARTER_PRESETS.find(p => p.id === presetId) || STARTER_PRESETS[0];
    const finalTitle = (title || '').trim() || preset.title || 'Новая схема';
    const finalNodes = JSON.parse(JSON.stringify(preset.data.nodes));
    const finalEdges = normalizeEdges(JSON.parse(JSON.stringify(preset.data.edges)));

    const newDiagram = await DiagramSyncService.createDiagram(finalTitle, finalNodes, finalEdges, currentUser);
    setDiagrams(prev => [newDiagram, ...prev]);
    setCurrentDiagramId(newDiagram.id);
    setNodes(DiagramGroupingService.sortNodesParentsFirst(finalNodes));
    setEdges(finalEdges);
    return newDiagram;
  }, [currentUser, setNodes, setEdges]);

  // Удаление схемы
  const handleDeleteDiagram = useCallback(async () => {
    if (diagrams.length <= 1) {
      alert('Нельзя удалить последнюю схему.');
      return false;
    }
    const current = diagrams.find(d => String(d.id) === String(currentDiagramId));
    if (!window.confirm(`Удалить схему «${current?.title || ''}»?`)) return false;

    await DiagramSyncService.deleteDiagram(currentDiagramId, currentUser);

    const remaining = diagrams.filter(d => String(d.id) !== String(currentDiagramId));
    setDiagrams(remaining);
    setCurrentDiagramId(remaining[0].id);
    setNodes(DiagramGroupingService.sortNodesParentsFirst(remaining[0].nodes || []));
    setEdges(normalizeEdges(remaining[0].edges || []));
    return true;
  }, [diagrams, currentDiagramId, currentUser, setNodes, setEdges]);

  // Импорт проекта как новая отдельная вкладка
  const handleImportProjectAsNew = useCallback(async (project) => {
    const finalTitle = (project.title || 'Импортированная схема').trim();
    const finalNodes = project.nodes || [];
    const finalEdges = normalizeEdges(project.edges || []);

    const newDiagram = await DiagramSyncService.createDiagram(finalTitle, finalNodes, finalEdges, currentUser);
    setDiagrams(prev => [newDiagram, ...prev]);
    setCurrentDiagramId(newDiagram.id);
    setNodes(DiagramGroupingService.sortNodesParentsFirst(finalNodes));
    setEdges(finalEdges);
    return newDiagram;
  }, [currentUser, setNodes, setEdges]);

  // Замена содержимого текущей схемы импортированным проектом
  const handleReplaceCurrentWithProject = useCallback(async (project) => {
    if (!currentDiagramId) return;
    const finalNodes = project.nodes || [];
    const finalEdges = normalizeEdges(project.edges || []);
    setNodes(DiagramGroupingService.sortNodesParentsFirst(finalNodes));
    setEdges(finalEdges);
    triggerAutoSave();
  }, [currentDiagramId, setNodes, setEdges, triggerAutoSave]);

  // Объединение (слияние) импортированного проекта с текущим холстом
  const handleMergeProjectIntoCurrent = useCallback((project) => {
    if (!currentDiagramId) return;
    const existingNodeIds = new Set(nodesRef.current.map(n => n.id));
    const idMap = {};
    const offsetX = 140;
    const offsetY = 140;

    const newNodes = (project.nodes || []).map((n, idx) => {
      let newId = n.id;
      if (existingNodeIds.has(n.id)) {
        newId = `imported_${Date.now()}_${idx}`;
      }
      idMap[n.id] = newId;

      return {
        ...n,
        id: newId,
        position: {
          x: (n.position?.x || 0) + offsetX,
          y: (n.position?.y || 0) + offsetY
        },
        selected: true
      };
    });

    const newEdges = (project.edges || []).map((e, idx) => {
      const mappedSource = idMap[e.source] || e.source;
      const mappedTarget = idMap[e.target] || e.target;
      return {
        ...e,
        id: `imported_edge_${Date.now()}_${idx}`,
        source: mappedSource,
        target: mappedTarget
      };
    });

    setNodes(prev => DiagramGroupingService.sortNodesParentsFirst([
      ...prev.map(n => ({ ...n, selected: false })),
      ...newNodes
    ]));
    setEdges(prev => [...prev, ...newEdges]);
    triggerAutoSave();
  }, [currentDiagramId, setNodes, setEdges, triggerAutoSave]);

  const activeDiagram = useMemo(() => {
    return diagrams.find(d => String(d.id) === String(currentDiagramId)) || diagrams[0] || null;
  }, [diagrams, currentDiagramId]);

  return {
    diagrams,
    setDiagrams,
    currentDiagramId,
    setCurrentDiagramId,
    activeDiagram,
    saveStatus,
    triggerAutoSave,
    loadDiagrams,
    handleSelectDiagram,
    handleCreateDiagram,
    handleDeleteDiagram,
    handleImportProjectAsNew,
    handleReplaceCurrentWithProject,
    handleMergeProjectIntoCurrent,
    nodesRef,
    edgesRef
  };
}

export default useDiagramData;
