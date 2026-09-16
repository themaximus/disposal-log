// useDiagramGrouping.js - Хук управления секциями, группировкой и горячими клавишами группировки
import { useCallback, useMemo, useEffect } from 'react';
import DiagramGroupingService from '../utils/diagramGroupingService';

export function useDiagramGrouping({ nodes, setNodes, setEdges, nodesRef, triggerAutoSave, setSelectedNodes, takeSnapshot }) {
  // Сгруппировать выбранные ноды в секцию
  const handleGroupSelectedNodes = useCallback(() => {
    if (takeSnapshot) takeSnapshot();
    const currentNodes = nodesRef.current;
    const sorted = DiagramGroupingService.groupSelectedNodes(currentNodes);
    if (!sorted) return;

    setNodes(sorted);
    if (setSelectedNodes) setSelectedNodes([]);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, setSelectedNodes, nodesRef, takeSnapshot]);

  // Разгруппировать секцию (и удалить прикреплённые к ней связи)
  const handleUngroup = useCallback((sectionId) => {
    if (takeSnapshot) takeSnapshot();
    const currentNodes = nodesRef.current;
    const updated = DiagramGroupingService.ungroupSection(currentNodes, sectionId);
    setNodes(updated);
    if (setEdges) {
      setEdges(eds => eds.filter(e => e.source !== sectionId && e.target !== sectionId));
    }
    triggerAutoSave();
  }, [setNodes, setEdges, triggerAutoSave, nodesRef, takeSnapshot]);

  // Обновление настроек секции (тема, заголовок, иконка, стиль границы)
  const handleUpdateSection = useCallback((sectionId, updatedData) => {
    if (takeSnapshot) takeSnapshot();
    setNodes(nds => nds.map(n => {
      if (n.id !== sectionId) return n;
      return {
        ...n,
        data: { ...n.data, ...updatedData }
      };
    }));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Удаление секции (безопасно растворяет рамку секции и возвращает элементы на корневой уровень)
  const handleDeleteSection = useCallback((sectionId) => {
    handleUngroup(sectionId);
  }, [handleUngroup]);

  // Добавить пустую секцию
  const handleAddEmptySection = useCallback((customPos) => {
    if (takeSnapshot) takeSnapshot();
    const spawnPosition = customPos ? {
      x: customPos.x - 310 + (Math.random() - 0.5) * 40,
      y: customPos.y - 210 + (Math.random() - 0.5) * 40
    } : { x: 250, y: 120 };
    const newSection = DiagramGroupingService.createEmptySection({ position: spawnPosition });
    setNodes(nds => DiagramGroupingService.sortNodesParentsFirst([newSection, ...nds]));
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, takeSnapshot]);

  // Подсчёт дочерних узлов секций
  const nodesWithAccurateChildCounts = useMemo(() => {
    return DiagramGroupingService.calculateChildCounts(nodes);
  }, [nodes]);

  // Горячие клавиши: Ctrl+G (группировка), Ctrl+Shift+G (разгруппировка)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      const isG = e.code === 'KeyG' || e.key?.toLowerCase() === 'g' || e.key?.toLowerCase() === 'п' || e.keyCode === 71;
      if ((e.ctrlKey || e.metaKey) && isG) {
        e.preventDefault();
        if (e.shiftKey) {
          const selectedSection = nodesRef.current.find(n => n.selected && n.type === 'sectionNode');
          if (selectedSection) {
            handleUngroup(selectedSection.id);
          }
        } else {
          handleGroupSelectedNodes();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGroupSelectedNodes, handleUngroup, nodesRef]);

  // Масштабирование секции и всех вложенных блоков
  const handleScaleSection = useCallback((sectionId, factor) => {
    if (takeSnapshot) takeSnapshot();
    const currentNodes = nodesRef.current;
    const updated = DiagramGroupingService.scaleSectionAndChildren(currentNodes, sectionId, factor);
    setNodes(updated);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, nodesRef, takeSnapshot]);

  // Пропорциональный пересчет детей при завершении ресайза секции
  const handleResizeSectionEnd = useCallback((sectionId, oldW, oldH, newW, newH) => {
    if (takeSnapshot) takeSnapshot();
    const currentNodes = nodesRef.current;
    const updated = DiagramGroupingService.proportionalResizeSectionChildren(currentNodes, sectionId, oldW, oldH, newW, newH);
    setNodes(updated);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, nodesRef, takeSnapshot]);

  // Масштабирование выделенной группы (секции и блоки)
  const handleScaleSelectedNodes = useCallback((selectedIds, factor, isAbsolute = false) => {
    if (takeSnapshot) takeSnapshot();
    const currentNodes = nodesRef.current;
    const updated = DiagramGroupingService.scaleSelectedNodes(currentNodes, selectedIds, factor, isAbsolute);
    setNodes(updated);
    triggerAutoSave();
  }, [setNodes, triggerAutoSave, nodesRef, takeSnapshot]);

  return {
    handleGroupSelectedNodes,
    handleUngroup,
    handleUpdateSection,
    handleDeleteSection,
    handleAddEmptySection,
    handleScaleSection,
    handleResizeSectionEnd,
    handleScaleSelectedNodes,
    nodesWithAccurateChildCounts
  };
}

export default useDiagramGrouping;
