// useSectionCornerScale.js - Хук интерактивного масштабирования секции и всех вложенных блоков за угол
import { useState, useCallback, useContext } from 'react';
import { useReactFlow } from '@xyflow/react';
import { DiagramActionsContext } from '../components/DiagramActionsContext';

export function useSectionCornerScale({ id, data }) {
  const rf = useReactFlow();
  const actions = useContext(DiagramActionsContext);
  const [isScaling, setIsScaling] = useState(false);
  const [liveScalePercent, setLiveScalePercent] = useState(null);
  const [activeCorner, setActiveCorner] = useState(null);

  // Масштабирование за углы (секция + все вложенные блоки)
  const handleCornerPointerDown = useCallback((corner, e) => {
    e.stopPropagation();
    e.preventDefault();

    // Снимок для Undo (Ctrl+Z) перед началом изменения
    if (actions?.takeSnapshot) {
      actions.takeSnapshot();
    }

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    const zoom = rf.getViewport ? (rf.getViewport().zoom || 1) : 1;
    const startPointer = { x: e.clientX, y: e.clientY };

    const allNodes = rf.getNodes ? rf.getNodes() : [];
    const secNode = allNodes.find(n => n.id === id);
    if (!secNode) return;

    const startSecPos = { ...secNode.position };
    const startSecW = secNode.style?.width || secNode.measured?.width || 620;
    const startSecH = secNode.style?.height || secNode.measured?.height || 420;
    const startSecScale = secNode.data?.scale || 1.0;

    // Сохраняем начальные координаты и масштабы всех детей секции
    const children = allNodes
      .filter(n => n.parentId === id)
      .map(c => ({
        id: c.id,
        startX: c.position.x,
        startY: c.position.y,
        startScale: c.data?.scale || 1.0,
        startW: c.style?.width,
        startH: c.style?.height
      }));

    setIsScaling(true);
    setActiveCorner(corner);
    setLiveScalePercent(Math.round(startSecScale * 100));

    const onPointerMove = (moveEvt) => {
      const rawDx = (moveEvt.clientX - startPointer.x) / zoom;
      const rawDy = (moveEvt.clientY - startPointer.y) / zoom;

      let delta = 0;
      if (corner === 'bottom-right') {
        delta = (rawDx + rawDy) / 2;
      } else if (corner === 'bottom-left') {
        delta = (-rawDx + rawDy) / 2;
      } else if (corner === 'top-right') {
        delta = (rawDx - rawDy) / 2;
      } else if (corner === 'top-left') {
        delta = (-rawDx - rawDy) / 2;
      }

      const factor = Math.max(0.2, (startSecW + delta) / startSecW);
      const newSecW = Math.max(260, Math.round(startSecW * factor));
      const newSecH = Math.max(160, Math.round(startSecH * factor));
      const actualFactor = newSecW / startSecW;

      let newSecX = startSecPos.x;
      let newSecY = startSecPos.y;

      if (corner === 'bottom-left' || corner === 'top-left') {
        newSecX = Math.round(startSecPos.x - (newSecW - startSecW));
      }
      if (corner === 'top-right' || corner === 'top-left') {
        newSecY = Math.round(startSecPos.y - (newSecH - startSecH));
      }

      const newSecScale = Math.min(3.0, Math.max(0.3, Math.round(startSecScale * actualFactor * 100) / 100));
      setLiveScalePercent(Math.round(newSecScale * 100));

      const childMap = new Map(children.map(c => [c.id, c]));

      if (actions?.setNodes) {
        actions.setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === id) {
            return {
              ...n,
              position: { x: newSecX, y: newSecY },
              style: { ...(n.style || {}), width: newSecW, height: newSecH },
              data: { ...n.data, scale: newSecScale }
            };
          }
          const childData = childMap.get(n.id);
          if (childData) {
            const newChildScale = Math.min(3.0, Math.max(0.3, Math.round(childData.startScale * actualFactor * 100) / 100));
            const updatedStyle = { ...(n.style || {}) };
            if (childData.startW) updatedStyle.width = Math.round(childData.startW * actualFactor);
            if (childData.startH) updatedStyle.height = Math.round(childData.startH * actualFactor);

            return {
              ...n,
              position: {
                x: Math.round(childData.startX * actualFactor),
                y: Math.round(childData.startY * actualFactor)
              },
              style: updatedStyle,
              data: { ...n.data, scale: newChildScale }
            };
          }
          return n;
        }));
      }
    };

    const onPointerUp = (upEvt) => {
      try {
        handleEl.releasePointerCapture(upEvt.pointerId);
      } catch {}
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerUp);

      setIsScaling(false);
      setActiveCorner(null);
      setLiveScalePercent(null);

      if (actions?.triggerAutoSave) {
        actions.triggerAutoSave();
      }
    };

    handleEl.addEventListener('pointermove', onPointerMove);
    handleEl.addEventListener('pointerup', onPointerUp);
    handleEl.addEventListener('pointercancel', onPointerUp);
  }, [id, rf, actions]);

  // Изменение размера границ секции за стороны (без масштабирования блоков)
  const handleEdgePointerDown = useCallback((edge, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (actions?.takeSnapshot) actions.takeSnapshot();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    const zoom = rf.getViewport ? (rf.getViewport().zoom || 1) : 1;
    const startPointer = { x: e.clientX, y: e.clientY };

    const allNodes = rf.getNodes ? rf.getNodes() : [];
    const secNode = allNodes.find(n => n.id === id);
    if (!secNode) return;

    const startSecPos = { ...secNode.position };
    const startSecW = secNode.style?.width || secNode.measured?.width || 620;
    const startSecH = secNode.style?.height || secNode.measured?.height || 420;

    const onPointerMove = (moveEvt) => {
      const rawDx = (moveEvt.clientX - startPointer.x) / zoom;
      const rawDy = (moveEvt.clientY - startPointer.y) / zoom;

      let newW = startSecW;
      let newH = startSecH;
      let newX = startSecPos.x;
      let newY = startSecPos.y;

      if (edge === 'right') {
        newW = Math.max(260, Math.round(startSecW + rawDx));
      } else if (edge === 'bottom') {
        newH = Math.max(160, Math.round(startSecH + rawDy));
      } else if (edge === 'left') {
        newW = Math.max(260, Math.round(startSecW - rawDx));
        newX = Math.round(startSecPos.x + (startSecW - newW));
      } else if (edge === 'top') {
        newH = Math.max(160, Math.round(startSecH - rawDy));
        newY = Math.round(startSecPos.y + (startSecH - newH));
      }

      if (actions?.setNodes) {
        actions.setNodes(prevNodes => prevNodes.map(n => {
          if (n.id !== id) return n;
          return {
            ...n,
            position: { x: newX, y: newY },
            style: { ...(n.style || {}), width: newW, height: newH }
          };
        }));
      }
    };

    const onPointerUp = (upEvt) => {
      try {
        handleEl.releasePointerCapture(upEvt.pointerId);
      } catch {}
      handleEl.removeEventListener('pointermove', onPointerMove);
      handleEl.removeEventListener('pointerup', onPointerUp);
      handleEl.removeEventListener('pointercancel', onPointerUp);

      if (actions?.triggerAutoSave) {
        actions.triggerAutoSave();
      }
    };

    handleEl.addEventListener('pointermove', onPointerMove);
    handleEl.addEventListener('pointerup', onPointerUp);
    handleEl.addEventListener('pointercancel', onPointerUp);
  }, [id, rf, actions]);

  return {
    handleCornerPointerDown,
    handleEdgePointerDown,
    isScaling,
    liveScalePercent,
    activeCorner
  };
}

export default useSectionCornerScale;
