// useDiagramHistory.js - История действий (Undo / Redo) с поддержкой Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y
import { useRef, useCallback, useEffect, useState } from 'react';

export function useDiagramHistory({
  nodes,
  setNodes,
  edges,
  setEdges,
  triggerAutoSave
}) {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const isUndoRedoActionRef = useRef(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  // Сделать снимок состояния перед любым действием
  const takeSnapshot = useCallback((explicitNodes, explicitEdges) => {
    if (isUndoRedoActionRef.current) return;
    const currentNodes = (explicitNodes && explicitNodes.length > 0) ? explicitNodes : nodesRef.current;
    const currentEdges = (explicitEdges && explicitEdges.length > 0) ? explicitEdges : edgesRef.current;
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges))
    };
    pastRef.current.push(snapshot);
    if (pastRef.current.length > 60) {
      pastRef.current.shift();
    }
    futureRef.current = []; // Очистить стек Redo при новом действии
    updateFlags();
  }, [updateFlags]);

  // Отмена (Undo - Ctrl+Z)
  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const previous = pastRef.current.pop();
    const current = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    };
    futureRef.current.push(current);

    isUndoRedoActionRef.current = true;
    setNodes(previous.nodes);
    setEdges(previous.edges);
    updateFlags();

    setTimeout(() => {
      isUndoRedoActionRef.current = false;
      triggerAutoSave();
    }, 50);
  }, [setNodes, setEdges, triggerAutoSave, updateFlags]);

  // Повтор (Redo - Ctrl+Shift+Z / Ctrl+Y)
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const next = futureRef.current.pop();
    const current = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    };
    pastRef.current.push(current);

    isUndoRedoActionRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    updateFlags();

    setTimeout(() => {
      isUndoRedoActionRef.current = false;
      triggerAutoSave();
    }, 50);
  }, [setNodes, setEdges, triggerAutoSave, updateFlags]);

  // Очистить историю (при загрузке новой схемы)
  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    updateFlags();
  }, [updateFlags]);

  // Глобальный слушатель горячих клавиш Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const isZ = e.code === 'KeyZ' || e.key?.toLowerCase() === 'z' || e.key?.toLowerCase() === 'я' || e.keyCode === 90;
        const isY = e.code === 'KeyY' || e.key?.toLowerCase() === 'y' || e.key?.toLowerCase() === 'н' || e.keyCode === 89;

        if (isZ) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (isY) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  };
}

export default useDiagramHistory;
