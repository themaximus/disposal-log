import { useState, useRef } from 'react';
import { saveOfflineBoardData } from '../utils/offlineStorage';

export function useDragAndDrop({ tasks, setTasks, boards, currentBoardId, columns, setSyncStatus, setSyncMessage, fetchBoardTasks }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dwellStackTargetId, setDwellStackTargetId] = useState(null);
  const hoverTimerRef = useRef(null);
  const hoverTargetRef = useRef(null);

  const clearDwellTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTargetRef.current = null;
    setDwellStackTargetId(null);
  };

  const handleDragStartTask = (e, task) => {
    clearDwellTimer();
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragOverTask = (e, targetTask) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const sourceTask = tasks.find(t => t.id === draggedTaskId);
    const isSameColumn = sourceTask && sourceTask.status === targetTask.status;

    if (isSameColumn) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTargetRef.current = targetTask.id;
      setDwellStackTargetId(targetTask.id);
    } else {
      if (hoverTargetRef.current !== targetTask.id) {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTargetRef.current = targetTask.id;
        setDwellStackTargetId(null);

        hoverTimerRef.current = setTimeout(() => {
          setDwellStackTargetId(targetTask.id);
        }, 1800);
      }
    }
  };

  const handleDropColumn = (e, columnKey) => {
    e.preventDefault();
    clearDwellTimer();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === columnKey) return;

    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
    const newTasks = tasks.map(t => t.id === draggedTaskId ? { ...t, status: columnKey } : t);
    setTasks(newTasks);
    setDraggedTaskId(null);

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Изменения сохранены');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация...');

    fetch(`/api/tasks/${draggedTaskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: columnKey })
    })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Изменения сохранены');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка перемещения');
        fetchBoardTasks(currentBoardId);
      });
  };

  const handleDropTask = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const sourceTask = tasks.find(t => t.id === draggedTaskId);
    const isSameColumn = sourceTask && sourceTask.status === targetTask.status;
    const isDwellStackReady = isSameColumn || (dwellStackTargetId === targetTask.id);

    clearDwellTimer();

    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

    if (isDwellStackReady) {
      const assignedGroupId = targetTask.group_id || `group_${Date.now()}`;
      const newTasks = tasks.map(t => {
        if (t.id === draggedTaskId || t.id === targetTask.id) {
          return { ...t, status: targetTask.status, group_id: assignedGroupId };
        }
        return t;
      });

      setTasks(newTasks);
      setDraggedTaskId(null);

      if (activeBoard && activeBoard.is_offline) {
        saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
        setSyncStatus('synced');
        setSyncMessage('💾 Стопка создана');
        return;
      }

      setSyncStatus('syncing');
      setSyncMessage('Синхронизация...');

      fetch(`/api/tasks/${draggedTaskId}/group`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetTask.id })
      })
        .then(() => {
          setSyncStatus('synced');
          setSyncMessage('Стопка создана');
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка группировки');
          fetchBoardTasks(currentBoardId);
        });
    } else {
      if (targetTask.status) {
        handleDropColumn(e, targetTask.status);
      }
    }
  };

  const handleUnlinkGroup = (groupId) => {
    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
    const newTasks = tasks.map(t => t.group_id === groupId ? { ...t, group_id: null } : t);
    setTasks(newTasks);

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Стопка разгруппирована');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация...');

    fetch(`/api/tasks/group/${groupId}/unlink`, { method: 'PUT' })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Стопка разгруппирована');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка разгруппировки');
        fetchBoardTasks(currentBoardId);
      });
  };

  return {
    draggedTaskId,
    dwellStackTargetId,
    handleDragStartTask,
    handleDragOverTask,
    handleDropTask,
    handleDropColumn,
    handleUnlinkGroup
  };
}
