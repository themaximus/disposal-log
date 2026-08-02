// Utility functions to manage Offline Boards, Columns, and Tasks stored in localStorage

const OFFLINE_BOARDS_KEY = 'pulse_offline_boards_list';
const getBoardDataKey = (boardId) => `pulse_offline_board_data_${boardId}`;

export const getOfflineBoards = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_BOARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveOfflineBoards = (boards) => {
  try {
    localStorage.setItem(OFFLINE_BOARDS_KEY, JSON.stringify(boards));
  } catch (e) {}
};

export const getOfflineBoardData = (boardId) => {
  try {
    const raw = localStorage.getItem(getBoardDataKey(boardId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    columns: [
      { id: 'off_col_1', column_key: 'todo', title: 'Предстоящие', position: 0, color: '#f85149' },
      { id: 'off_col_2', column_key: 'in_progress', title: 'В работе', position: 1, color: '#d29922' },
      { id: 'off_col_3', column_key: 'done', title: 'Реализованные', position: 2, color: '#3fb950' }
    ],
    tasks: []
  };
};

export const saveOfflineBoardData = (boardId, data) => {
  try {
    localStorage.setItem(getBoardDataKey(boardId), JSON.stringify(data));
  } catch (e) {}
};

export const deleteOfflineBoard = (boardId) => {
  try {
    localStorage.removeItem(getBoardDataKey(boardId));
    const list = getOfflineBoards().filter(b => String(b.id) !== String(boardId));
    saveOfflineBoards(list);
  } catch (e) {}
};

export const addOfflineBoard = (board) => {
  const list = getOfflineBoards();
  const exists = list.find(b => String(b.id) === String(board.id));
  let updated;
  if (exists) {
    updated = list.map(b => String(b.id) === String(board.id) ? { ...b, ...board, is_offline: true } : b);
  } else {
    updated = [...list, { ...board, is_offline: true }];
  }
  saveOfflineBoards(updated);
};
