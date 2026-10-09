import React, { useState, useEffect } from 'react';
import { tasksApi } from '../api';
import { deleteDriveFiles } from '../services/googleDrive';
import { getOfflineBoardData, saveOfflineBoardData, isOfflineBoardId } from '../utils/offlineStorage';
import { getTaskMedia } from '../utils/taskFields';

export default function TrashModal({ boardId, currentUser, onClose, onChanged }) {
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOffline = isOfflineBoardId(boardId);
  const googleToken = currentUser && currentUser.google_access_token;

  // Offline boards keep trashed tasks in the board snapshot, flagged with deleted_at.
  const updateOfflineTasks = (transform) => {
    const data = getOfflineBoardData(boardId);
    saveOfflineBoardData(boardId, { ...data, tasks: transform(data.tasks || []) });
  };

  useEffect(() => {
    setIsLoading(true);
    if (isOffline) {
      setTrashedTasks((getOfflineBoardData(boardId).tasks || []).filter(t => t.deleted_at));
      setIsLoading(false);
      return;
    }
    tasksApi.trash(boardId)
      .then(data => setTrashedTasks(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [boardId]);

  const removeFromList = (taskId) => setTrashedTasks(prev => prev.filter(t => t.id !== taskId));

  const notifyChanged = () => {
    if (typeof onChanged === 'function') onChanged();
  };

  const handleRestore = async (task) => {
    try {
      if (isOffline) updateOfflineTasks(list => list.map(t => (t.id === task.id ? { ...t, deleted_at: null } : t)));
      else await tasksApi.restore(task.id);
      removeFromList(task.id);
      notifyChanged();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermanentDelete = async (task) => {
    setIsDeleting(true);
    try {
      await deleteDriveFiles(getTaskMedia(task), googleToken);
      if (isOffline) updateOfflineTasks(list => list.filter(t => t.id !== task.id));
      else await tasksApi.removePermanently(task.id);
      removeFromList(task.id);
      notifyChanged();
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
        await deleteDriveFiles(getTaskMedia(task), googleToken);
      }
      if (isOffline) updateOfflineTasks(list => list.filter(t => !t.deleted_at));
      else await tasksApi.emptyTrash(boardId);
      setTrashedTasks([]);
      notifyChanged();
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
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
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
                Очистить корзину ({trashedTasks.length})
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
                        className="btn-dots-menu"
                        disabled={isDeleting}
                        onClick={() => handlePermanentDelete(task)}
                        title="Удалить навсегда из базы и Google Диска"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#f85149' }}>close</span>
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
