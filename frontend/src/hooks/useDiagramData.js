// useDiagramData.js - Хук управления диаграммами, автосохранением и синхронизацией
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DiagramSyncService from '../services/DiagramSyncService';
import DiagramGroupingService from '../utils/diagramGroupingService';
import { STARTER_PRESETS } from '../utils/diagramStorage';

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
      setEdges(list[0].edges || []);
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
    setEdges(target.edges || []);
  }, [diagrams, setNodes, setEdges]);

  // Создание новой схемы
  const handleCreateDiagram = useCallback(async (title, presetId) => {
    const preset = STARTER_PRESETS.find(p => p.id === presetId) || STARTER_PRESETS[0];
    const finalTitle = (title || '').trim() || preset.title || 'Новая схема';
    const finalNodes = JSON.parse(JSON.stringify(preset.data.nodes));
    const finalEdges = JSON.parse(JSON.stringify(preset.data.edges));

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
    setEdges(remaining[0].edges || []);
    return true;
  }, [diagrams, currentDiagramId, currentUser, setNodes, setEdges]);

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
    nodesRef,
    edgesRef
  };
}

export default useDiagramData;
