import { useState, useRef } from 'react';

// Hovering over a card in another column for this long turns the drop into a stack.
const STACK_DWELL_MS = 1800;

/**
 * Drag & drop UI state for task cards. Data changes are delegated to the
 * workspace actions (moveTask / stackTasks).
 */
export function useDragAndDrop({ tasks, moveTask, stackTasks }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dwellStackTargetId, setDwellStackTargetId] = useState(null);
  const hoverTimerRef = useRef(null);
  const hoverTargetRef = useRef(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  const resetDwell = () => {
    clearHoverTimer();
    hoverTargetRef.current = null;
    setDwellStackTargetId(null);
  };

  const finishDrag = () => {
    resetDwell();
    setDraggedTaskId(null);
  };

  const handleDragStartTask = (e, task) => {
    if (window.getSelection) window.getSelection().removeAllRanges();
    resetDwell();
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragOverTask = (e, targetTask) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const source = tasks.find(t => t.id === draggedTaskId);
    if (source && source.status === targetTask.status) {
      // Same column: stacking is immediate.
      clearHoverTimer();
      hoverTargetRef.current = targetTask.id;
      setDwellStackTargetId(targetTask.id);
    } else if (hoverTargetRef.current !== targetTask.id) {
      clearHoverTimer();
      hoverTargetRef.current = targetTask.id;
      setDwellStackTargetId(null);
      hoverTimerRef.current = setTimeout(() => setDwellStackTargetId(targetTask.id), STACK_DWELL_MS);
    }
  };

  const handleDropColumn = (e, columnKey) => {
    e.preventDefault();
    const taskId = draggedTaskId;
    finishDrag();
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== columnKey) moveTask(taskId, columnKey);
  };

  const handleDropTask = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const source = tasks.find(t => t.id === draggedTaskId);
    const canStack = (source && source.status === targetTask.status) || dwellStackTargetId === targetTask.id;

    if (canStack) {
      const taskId = draggedTaskId;
      finishDrag();
      stackTasks(taskId, targetTask);
    } else if (targetTask.status) {
      handleDropColumn(e, targetTask.status);
    }
  };

  return {
    draggedTaskId,
    dwellStackTargetId,
    handleDragStartTask,
    handleDragOverTask,
    handleDropTask,
    handleDropColumn
  };
}
