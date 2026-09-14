// useBlockCornerScale.js - Хук интерактивного масштабирования отдельного блока за угол
import { useState, useCallback, useContext } from 'react';
import { useReactFlow } from '@xyflow/react';
import { DiagramActionsContext } from '../components/DiagramActionsContext';

export function useBlockCornerScale({ id, data, cardRef }) {
  const rf = useReactFlow();
  const actions = useContext(DiagramActionsContext);
  const [isScaling, setIsScaling] = useState(false);
  const [liveScalePercent, setLiveScalePercent] = useState(null);

  const handleCornerPointerDown = useCallback((corner, e) => {
    e.stopPropagation();
    e.preventDefault();

    // Снимок для Undo (Ctrl+Z) перед началом масштабирования
    if (actions?.takeSnapshot) {
      actions.takeSnapshot();
    }

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    const zoom = rf.getViewport ? (rf.getViewport().zoom || 1) : 1;
    const startPointer = { x: e.clientX, y: e.clientY };
    const startScale = data.scale || 1.0;

    const cardEl = cardRef?.current;
    const rect = cardEl ? cardEl.getBoundingClientRect() : null;
    const startWidth = rect ? (rect.width / zoom / startScale) : 480;

    setIsScaling(true);
    setLiveScalePercent(Math.round(startScale * 100));

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

      const factor = (startWidth + delta) / startWidth;
      const newScale = Math.min(3.0, Math.max(0.3, Math.round(startScale * factor * 100) / 100));

      setLiveScalePercent(Math.round(newScale * 100));

      if (actions?.setNodes) {
        actions.setNodes(prev => prev.map(n => {
          if (n.id !== id) return n;
          return {
            ...n,
            data: {
              ...n.data,
              scale: newScale
            }
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

      setIsScaling(false);
      setLiveScalePercent(null);

      if (actions?.triggerAutoSave) {
        actions.triggerAutoSave();
      }
    };

    handleEl.addEventListener('pointermove', onPointerMove);
    handleEl.addEventListener('pointerup', onPointerUp);
    handleEl.addEventListener('pointercancel', onPointerUp);
  }, [id, data.scale, cardRef, rf, actions]);

  // Ступенчатое масштабирование (+/- 10%)
  const handleStepScale = useCallback((factor) => {
    if (actions?.takeSnapshot) actions.takeSnapshot();
    const curScale = data.scale || 1.0;
    const newScale = Math.min(3.0, Math.max(0.3, Math.round(curScale * factor * 100) / 100));
    if (actions?.setNodes) {
      actions.setNodes(prev => prev.map(n => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            scale: newScale
          }
        };
      }));
    }
    if (actions?.triggerAutoSave) actions.triggerAutoSave();
  }, [id, data.scale, actions]);

  // Сброс масштаба на 100%
  const handleResetScale = useCallback(() => {
    if ((data.scale || 1.0) === 1.0) return;
    if (actions?.takeSnapshot) actions.takeSnapshot();
    if (actions?.setNodes) {
      actions.setNodes(prev => prev.map(n => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            scale: 1.0
          }
        };
      }));
    }
    if (actions?.triggerAutoSave) actions.triggerAutoSave();
  }, [id, data.scale, actions]);

  return {
    handleCornerPointerDown,
    handleStepScale,
    handleResetScale,
    isScaling,
    liveScalePercent
  };
}

export default useBlockCornerScale;
