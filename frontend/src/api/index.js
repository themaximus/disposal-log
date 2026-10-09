import { api } from './client';

export { api, ApiError, getSessionToken, setSessionToken, clearSessionToken } from './client';

export const authApi = {
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  unlinkGoogleDrive: () => api.post('/api/auth/google-drive/unlink')
};

export const boardsApi = {
  list: () => api.get('/api/boards'),
  create: (board) => api.post('/api/boards', board),
  update: (id, board) => api.put(`/api/boards/${id}`, board),
  remove: (id) => api.delete(`/api/boards/${id}`),
  import: (snapshot) => api.post('/api/boards/import', snapshot),
  columns: (id) => api.get(`/api/boards/${id}/columns`),
  addColumn: (id, column) => api.post(`/api/boards/${id}/columns`, column),
  share: (id) => api.get(`/api/boards/${id}/share`),
  setShareMode: (id, shareMode) => api.put(`/api/boards/${id}/share/mode`, { shareMode }),
  invite: (id, email) => api.post(`/api/boards/${id}/share/invite`, { email }),
  revokeInvite: (id, email) => api.delete(`/api/boards/${id}/share/invite`, { email })
};

export const columnsApi = {
  update: (id, column) => api.put(`/api/columns/${id}`, column),
  remove: (id) => api.delete(`/api/columns/${id}`),
  savePositions: (columns) =>
    api.put('/api/columns/positions', { updates: columns.map(c => ({ id: c.id, position: c.position })) })
};

export const tasksApi = {
  list: (boardId) => api.get(`/api/tasks?board_id=${encodeURIComponent(boardId)}`),
  create: (task) => api.post('/api/tasks', task),
  update: (id, task) => api.put(`/api/tasks/${id}`, task),
  remove: (id) => api.delete(`/api/tasks/${id}`),
  setStatus: (id, status) => api.put(`/api/tasks/${id}/status`, { status }),
  setSubtasks: (id, subtasks) => api.put(`/api/tasks/${id}/subtasks`, { subtasks }),
  groupWith: (id, targetId) => api.put(`/api/tasks/${id}/group`, { target_id: targetId }),
  unlinkGroup: (groupId) => api.put(`/api/tasks/group/${encodeURIComponent(groupId)}/unlink`),
  trash: (boardId) => api.get(`/api/tasks/trash?board_id=${encodeURIComponent(boardId || '')}`),
  restore: (id) => api.put(`/api/tasks/${id}/restore`),
  removePermanently: (id) => api.delete(`/api/tasks/${id}/permanent`),
  emptyTrash: (boardId) => api.post('/api/tasks/trash/empty', { board_id: boardId })
};

export const settingsApi = {
  get: () => api.get('/api/settings'),
  save: (settings) => api.put('/api/settings', settings),
  testTelegram: () => api.post('/api/settings/test-telegram')
};

export const diagramsApi = {
  list: () => api.get('/api/diagrams'),
  create: (diagram) => api.post('/api/diagrams', diagram),
  update: (id, diagram) => api.put(`/api/diagrams/${id}`, diagram),
  remove: (id) => api.delete(`/api/diagrams/${id}`)
};

export const uploadsApi = {
  deleteDriveFile: (url) => api.post('/api/upload/google-drive/delete', { url })
};
