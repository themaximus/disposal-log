import { useState, useCallback } from 'react';
import { boardsApi, columnsApi, tasksApi } from '../api';
import {
  getOfflineBoards,
  saveOfflineBoards,
  getOfflineBoardData,
  saveOfflineBoardData,
  deleteOfflineBoard,
  createOfflineBoard,
  isOfflineBoardId
} from '../utils/offlineStorage';

const LAST_BOARD_KEY = 'last_selected_board_id';

const DEFAULT_OFFLINE_BOARD = {
  id: 'off_board_default',
  name: 'Мой локальный проект 🚀',
  description: 'Демонстрационная офлайн-доска для работы без интернета.',
  icon: '📋',
  is_offline: true
};

const sameId = (a, b) => String(a) === String(b);

// Prefers the board from the URL, then the last opened one, then the first.
function pickInitialBoard(boards, urlBoardId) {
  const lastId = localStorage.getItem(LAST_BOARD_KEY);
  const candidate = [urlBoardId, lastId].find(id => id && boards.some(b => sameId(b.id, id)));
  return candidate || (boards[0] && boards[0].id) || null;
}

/**
 * Boards, columns and tasks of the active board, plus every mutation on them.
 * Each mutation is applied optimistically and then persisted either to
 * localStorage (offline boards) or to the API (server boards).
 */
export function useBoardWorkspace({ currentUser, sync, confirm, onShowBoard, onRequireAuth }) {
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);

  const activeBoard = boards.find(b => sameId(b.id, currentBoardId)) || null;
  const isOffline = (boardId = currentBoardId, board = activeBoard) =>
    isOfflineBoardId(boardId) || !!(board && board.is_offline);

  // --- Loading ---------------------------------------------------------------

  const reloadColumns = useCallback(async (boardId = currentBoardId) => {
    if (!boardId || isOfflineBoardId(boardId)) return;
    try {
      const cols = await boardsApi.columns(boardId);
      if (Array.isArray(cols)) setColumns(cols);
    } catch (e) {
      console.error(e);
    }
  }, [currentBoardId]);

  const reloadTasks = useCallback(async (boardId = currentBoardId) => {
    if (!boardId || isOfflineBoardId(boardId)) return;
    try {
      const list = await tasksApi.list(boardId);
      if (Array.isArray(list)) setTasks(list);
    } catch (e) {
      console.error(e);
    }
  }, [currentBoardId]);

  const selectBoard = (boardId, switchTab = true, boardList = boards) => {
    setCurrentBoardId(boardId);
    localStorage.setItem(LAST_BOARD_KEY, boardId);
    onShowBoard(boardId, switchTab);

    const board = boardList.find(b => sameId(b.id, boardId));
    if (isOffline(boardId, board)) {
      const data = getOfflineBoardData(boardId);
      setColumns(data.columns || []);
      setTasks(data.tasks || []);
    } else {
      reloadColumns(boardId);
      reloadTasks(boardId);
    }
  };

  const loadGuestBoards = (urlBoardId, forceSwitch = false) => {
    let offlineBoards = getOfflineBoards();
    if (offlineBoards.length === 0) {
      offlineBoards = [{ ...DEFAULT_OFFLINE_BOARD, created_at: new Date().toISOString() }];
      saveOfflineBoards(offlineBoards);
    }
    setBoards(offlineBoards);

    const targetId = pickInitialBoard(offlineBoards, urlBoardId);
    if (targetId) selectBoard(targetId, !!urlBoardId || forceSwitch, offlineBoards);
  };

  const loadUserBoards = async (urlBoardId) => {
    try {
      const onlineBoards = await boardsApi.list();
      const combined = [...(Array.isArray(onlineBoards) ? onlineBoards : []), ...getOfflineBoards()];
      setBoards(combined);
      const targetId = pickInitialBoard(combined, urlBoardId);
      if (targetId) selectBoard(targetId, !!urlBoardId, combined);
    } catch (e) {
      loadGuestBoards(urlBoardId);
    }
  };

  // Re-reads the active board from its source (e.g. after Trash changes).
  const refreshActiveBoard = () => {
    if (!currentBoardId) return;
    if (isOffline()) setTasks(getOfflineBoardData(currentBoardId).tasks || []);
    else reloadTasks();
  };

  const clearBoard = () => {
    setCurrentBoardId(null);
    setColumns([]);
    setTasks([]);
  };

  // --- Persistence -------------------------------------------------------------

  /**
   * Applies new tasks/columns locally and persists them.
   * `remote` is the API call for server boards; `messages` drive the toast.
   */
  const persist = async ({ nextTasks, nextColumns, remote, messages, reload = reloadTasks }) => {
    if (nextTasks) setTasks(nextTasks);
    if (nextColumns) setColumns(nextColumns);

    if (isOffline()) {
      saveOfflineBoardData(currentBoardId, { columns: nextColumns || columns, tasks: nextTasks || tasks });
      sync.report('synced', `💾 ${messages.offline || messages.success}`);
      return true;
    }

    sync.report('syncing', messages.pending || 'Синхронизация...');
    try {
      await remote();
      sync.report('synced', messages.success);
      return true;
    } catch (e) {
      console.error(e);
      sync.report('error', messages.error || 'Ошибка сохранения');
      reload(currentBoardId);
      return false;
    }
  };

  // --- Boards ------------------------------------------------------------------

  const createBoard = async (boardData) => {
    if (!currentUser) {
      const board = createOfflineBoard(boardData);
      const offlineBoards = getOfflineBoards();
      setBoards(offlineBoards);
      selectBoard(board.id, true, offlineBoards);
      return;
    }
    try {
      const created = await boardsApi.create(boardData);
      const onlineBoards = await boardsApi.list();
      const combined = [...onlineBoards, ...getOfflineBoards()];
      setBoards(combined);
      if (created && created.id) selectBoard(created.id, true, combined);
    } catch (e) {
      console.error(e);
      sync.report('error', 'Не удалось создать доску');
    }
  };

  const updateBoard = (updatedBoard) => {
    const nextBoards = boards.map(b => (b.id === updatedBoard.id ? updatedBoard : b));
    setBoards(nextBoards);
    if (updatedBoard.is_offline) {
      saveOfflineBoards(nextBoards.filter(b => b.is_offline));
    } else {
      boardsApi.update(updatedBoard.id, updatedBoard).catch(console.error);
    }
  };

  const deleteBoard = (board) => {
    if (!board) return;
    confirm({
      title: `Удалить доску "${board.name}"?`,
      message: 'Вы уверены, что хотите безвозвратно удалить эту доску? Все задачи и колонки этой доски будут удалены.',
      confirmText: 'Удалить доску',
      confirmStyle: 'danger',
      onConfirm: async () => {
        if (board.is_offline) deleteOfflineBoard(board.id);
        else {
          try {
            await boardsApi.remove(board.id);
          } catch (e) {
            console.error(e);
            sync.report('error', 'Не удалось удалить доску');
            return;
          }
        }
        const remaining = boards.filter(b => !sameId(b.id, board.id));
        setBoards(remaining);
        if (sameId(board.id, currentBoardId)) {
          if (remaining.length > 0) selectBoard(remaining[0].id, true, remaining);
          else clearBoard();
        }
      }
    });
  };

  // Moves a board between localStorage and the server.
  const toggleBoardMode = async (board) => {
    if (!board) return;

    if (board.is_offline) {
      if (!currentUser) {
        onRequireAuth();
        return;
      }
      try {
        const { boardId } = await boardsApi.import({ board, columns, tasks });
        deleteOfflineBoard(board.id);
        await loadUserBoards(boardId);
      } catch (e) {
        console.error(e);
        sync.report('error', 'Не удалось перенести доску на сервер');
      }
      return;
    }

    const offlineBoard = createOfflineBoard(board);
    saveOfflineBoardData(offlineBoard.id, { columns, tasks });
    await loadUserBoards(offlineBoard.id);
  };

  // --- Columns -----------------------------------------------------------------

  const addColumn = async (column) => {
    const key = `col_${Date.now()}`;
    const nextColumns = [...columns, { ...column, id: key, column_key: key }];
    const ok = await persist({
      nextColumns,
      remote: () => boardsApi.addColumn(currentBoardId, column),
      messages: { success: 'Колонка создана', error: 'Ошибка создания колонки' },
      reload: reloadColumns
    });
    // Server boards get real ids/keys for the new column.
    if (ok && !isOffline()) reloadColumns();
  };

  const updateColumn = (column) => persist({
    nextColumns: columns.map(c => (c.id === column.id ? { ...c, ...column } : c)),
    remote: () => columnsApi.update(column.id, column),
    messages: { success: 'Колонка обновлена', error: 'Ошибка обновления колонки' },
    reload: reloadColumns
  });

  const saveColumnOrder = (reordered) => persist({
    nextColumns: reordered,
    remote: () => columnsApi.savePositions(reordered),
    messages: { pending: 'Синхронизация порядка...', success: 'Порядок сохранён', error: 'Ошибка порядка' },
    reload: reloadColumns
  });

  const deleteColumn = (columnId) => {
    confirm({
      title: 'Удалить колонку?',
      message: 'Вы уверены, что хотите удалить эту колонку? Задачи из неё не будут удалены.',
      confirmText: 'Удалить колонку',
      confirmStyle: 'danger',
      onConfirm: () => persist({
        nextColumns: columns.filter(c => c.id !== columnId),
        remote: () => columnsApi.remove(columnId),
        messages: { success: 'Колонка удалена', error: 'Ошибка удаления колонки' },
        reload: reloadColumns
      })
    });
  };

  // --- Tasks -------------------------------------------------------------------

  const saveTask = async (taskData) => {
    if (isOffline()) {
      const nextTasks = taskData.id
        ? tasks.map(t => (t.id === taskData.id ? { ...t, ...taskData } : t))
        : [...tasks, { ...taskData, id: `off_task_${Date.now()}`, created_at: new Date().toISOString() }];
      await persist({ nextTasks, messages: { success: 'Задача сохранена' } });
      return true;
    }

    const payload = { ...taskData, board_id: currentBoardId };
    try {
      if (taskData.id) await tasksApi.update(taskData.id, payload);
      else await tasksApi.create(payload);
      await reloadTasks();
      return true;
    } catch (e) {
      console.error(e);
      sync.report('error', 'Ошибка сохранения задачи');
      return false;
    }
  };

  const deleteTask = (taskId) => {
    confirm({
      title: 'Переместить задачу в Корзину?',
      message: 'Задача сохранится в Корзине на 30 дней. Вы сможете восстановить её в любой момент.',
      confirmText: 'В Корзину',
      confirmStyle: 'danger',
      onConfirm: () => persist({
        // Offline boards keep trashed tasks (flagged) so the Trash can restore them.
        nextTasks: isOffline()
          ? tasks.map(t => (t.id === taskId ? { ...t, deleted_at: new Date().toISOString() } : t))
          : tasks.filter(t => t.id !== taskId),
        remote: () => tasksApi.remove(taskId),
        messages: { success: 'Задача перемещена в Корзину', error: 'Ошибка удаления задачи' }
      })
    });
  };

  const changeSubtasks = (taskId, subtasks) => persist({
    nextTasks: tasks.map(t => (t.id === taskId ? { ...t, subtasks, subtasks_json: JSON.stringify(subtasks) } : t)),
    remote: () => tasksApi.setSubtasks(taskId, subtasks),
    messages: { success: 'Изменения сохранены' }
  });

  const moveTask = (taskId, status) => persist({
    nextTasks: tasks.map(t => (t.id === taskId ? { ...t, status } : t)),
    remote: () => tasksApi.setStatus(taskId, status),
    messages: { success: 'Изменения сохранены', error: 'Ошибка перемещения' }
  });

  const stackTasks = (sourceId, targetTask) => {
    const groupId = targetTask.group_id || `group_${Date.now()}`;
    return persist({
      nextTasks: tasks.map(t => (
        t.id === sourceId || t.id === targetTask.id ? { ...t, status: targetTask.status, group_id: groupId } : t
      )),
      remote: () => tasksApi.groupWith(sourceId, targetTask.id),
      messages: { success: 'Стопка создана', error: 'Ошибка группировки' }
    });
  };

  const unlinkGroup = (groupId) => persist({
    nextTasks: tasks.map(t => (t.group_id === groupId ? { ...t, group_id: null } : t)),
    remote: () => tasksApi.unlinkGroup(groupId),
    messages: { success: 'Стопка разгруппирована', error: 'Ошибка разгруппировки' }
  });

  return {
    boards,
    activeBoard,
    currentBoardId,
    columns,
    tasks,
    loadGuestBoards,
    loadUserBoards,
    selectBoard,
    refreshActiveBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    toggleBoardMode,
    addColumn,
    updateColumn,
    saveColumnOrder,
    deleteColumn,
    saveTask,
    deleteTask,
    changeSubtasks,
    moveTask,
    stackTasks,
    unlinkGroup
  };
}
