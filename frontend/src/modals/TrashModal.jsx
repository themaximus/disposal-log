import React, { useState, useEffect } from 'react';
import { getOfflineBoards, getOfflineBoardData, saveOfflineBoardData } from '../utils/offlineStorage';

export default function TrashModal({ boardId, currentUser, onClose, onRestoreTask, onTaskRestored }) {
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOfflineBoard = () => {
    if (!boardId) return false;
    const offlineBoards = getOfflineBoards();
    return offlineBoards.some(b => String(b.id) === String(boardId));
  };

  const fetchTrash = () => {
    setIsLoading(true);
    if (isOfflineBoard()) {
      const offlineData = getOfflineBoardData(boardId);
      const trashed = (offlineData.tasks || []).filter(t => t.deleted_at);
      setTrashedTasks(trashed);
      setIsLoading(false);
      return;
    }

    fetch(`/api/tasks/trash?board_id=${boardId || ''}`)
      .then(res => res.json())
      .then(data => {
        setTrashedTasks(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTrash();
  }, [boardId]);

  const deleteGoogleDriveFiles = async (imagesList) => {
    const googleToken = currentUser && currentUser.google_access_token;
    if (!googleToken || !Array.isArray(imagesList) || imagesList.length === 0) return;

    for (const url of imagesList) {
      if (typeof url === 'string') {
        const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          const fileId = driveMatch[1];
          try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${googleToken}` }
            });
          } catch (e) {
            console.error('Failed to delete Google Drive file:', fileId, e);
          }
        }
      }
    }
  };

  const handleRestore = (task) => {
    if (isOfflineBoard()) {
      const offlineData = getOfflineBoardData(boardId);
      const updatedTasks = (offlineData.tasks || []).map(t => t.id === task.id ? { ...t, deleted_at: null } : t);
      saveOfflineBoardData(boardId, { ...offlineData, tasks: updatedTasks });
      setTrashedTasks(prev => prev.filter(t => t.id !== task.id));
      if (onTaskRestored) onTaskRestored();
      return;
    }

    fetch(`/api/tasks/${task.id}/restore`, { method: 'PUT' })
      .then(res => res.json())
      .then(() => {
        setTrashedTasks(prev => prev.filter(t => t.id !== task.id));
        if (onTaskRestored) onTaskRestored();
      })
      .catch(console.error);
  };

  const handlePermanentDelete = async (task) => {
    setIsDeleting(true);
    try {
      if (task.images && task.images.length > 0) {
        await deleteGoogleDriveFiles(task.images);
      }

      if (isOfflineBoard()) {
        const offlineData = getOfflineBoardData(boardId);
        const updatedTasks = (offlineData.tasks || []).filter(t => t.id !== task.id);
        saveOfflineBoardData(boardId, { ...offlineData, tasks: updatedTasks });
        setTrashedTasks(prev => prev.filter(t => t.id !== task.id));
        return;
      }

      await fetch(`/api/tasks/${task.id}/permanent`, { method: 'DELETE' });
      setTrashedTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (trashedTasks.length === 0) return;
    setIsDeleting(true);
    try {
      for (const task of trashedTasks) {
        if (task.images && task.images.length > 0) {
          await deleteGoogleDriveFiles(task.images);
        }
      }

      if (isOfflineBoard()) {
        const offlineData = getOfflineBoardData(boardId);
        const activeTasksOnly = (offlineData.tasks || []).filter(t => !t.deleted_at);
        saveOfflineBoardData(boardId, { ...offlineData, tasks: activeTasksOnly });
        setTrashedTasks([]);
        return;
      }

      await fetch('/api/tasks/trash/empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: boardId })
      });

      setTrashedTasks([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now - deletedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="modal-overlay active">
      <div className="modal" style={{ maxWidth: '600px', width: '90vw' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-red-text)' }}>delete</span>
            Корзина Задач (30 дней)
          </h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '0.5rem 0' }}>
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Задачи удаляются насовсем через 30 дней. Файлы на Google Диске тоже стираются.
            </span>

            {trashedTasks.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={handleEmptyTrash}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem',
                  background: 'rgba(248, 81, 73, 0.15)',
                  color: '#f85149',
                  borderColor: 'rgba(248, 81, 73, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                🔥 Очистить корзину ({trashedTasks.length})
              </button>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Загрузка корзины...
            </div>
          ) : trashedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>
                delete_sweep
              </span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Корзина пуста</p>
            </div>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {trashedTasks.map(task => {
                const daysLeft = getRemainingDays(task.deleted_at);
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                        <span>Удалено: {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString() : 'Недавно'}</span>
                        <span style={{ color: daysLeft <= 5 ? '#f85149' : 'var(--github-blue-text)', fontWeight: 600 }}>
                          Осталось: {daysLeft} дней
                        </span>
                        {task.images && task.images.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-muted)' }}>
                            🖼️ {task.images.length} файл(ов)
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRestore(task)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title="Восстановить в доску"
                      >
                        ↩️ Восстановить
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={isDeleting}
                        onClick={() => handlePermanentDelete(task)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          background: 'rgba(248, 81, 73, 0.1)',
                          color: '#f85149',
                          borderColor: 'rgba(248, 81, 73, 0.25)'
                        }}
                        title="Удалить навсегда из базы и Google Диска"
                      >
                        🗑️ Насовсем
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
