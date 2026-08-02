import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import LandingHero from './components/LandingHero';
import SyncToast from './components/SyncToast';

import AuthModal from './modals/AuthModal';
import ProfileModal from './modals/ProfileModal';
import SettingsModal from './modals/SettingsModal';
import TaskModal from './modals/TaskModal';
import BoardModal from './modals/BoardModal';
import ColumnModal from './modals/ColumnModal';
import ManageColumnsModal from './modals/ManageColumnsModal';
import ShareModal from './modals/ShareModal';
import BoardSyncModal from './modals/BoardSyncModal';

import {
  getOfflineBoards,
  saveOfflineBoards,
  getOfflineBoardData,
  saveOfflineBoardData,
  deleteOfflineBoard,
  addOfflineBoard
} from './utils/offlineStorage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('landing');
  const [viewMode, setViewMode] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [syncStatus, setSyncStatus] = useState('synced');
  const [syncMessage, setSyncMessage] = useState('Всё синхронизировано');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [shareBoardModal, setShareBoardModal] = useState(null);
  const [syncBoardModal, setSyncBoardModal] = useState(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [manageColumnsBoard, setManageColumnsBoard] = useState(null);

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dwellStackTargetId, setDwellStackTargetId] = useState(null);
  const hoverTargetRef = React.useRef(null);
  const hoverTimerRef = React.useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(user => {
        if (user) {
          setCurrentUser(user);
          fetchBoards();
        }
      })
      .catch(console.error);
  }, []);

  const fetchBoards = () => {
    const offlineList = getOfflineBoards();
    fetch('/api/boards')
      .then(res => res.json())
      .then(data => {
        const serverBoards = Array.isArray(data) ? data.map(b => ({ ...b, is_offline: false })) : [];
        const combined = [...serverBoards, ...offlineList];
        setBoards(combined);
        if (combined.length > 0 && !currentBoardId) {
          selectBoard(combined[0].id, combined[0]);
        }
      })
      .catch(() => {
        setBoards(offlineList);
        if (offlineList.length > 0 && !currentBoardId) {
          selectBoard(offlineList[0].id, offlineList[0]);
        }
      });
  };

  const selectBoard = (boardId, boardObj) => {
    const targetBoard = boardObj || boards.find(b => String(b.id) === String(boardId));
    setCurrentBoardId(boardId);
    setCurrentTab('workspace');

    if (targetBoard && targetBoard.is_offline) {
      const offlineData = getOfflineBoardData(boardId);
      setColumns(offlineData.columns || []);
      setTasks(offlineData.tasks || []);
    } else {
      fetchBoardColumns(boardId);
      fetchBoardTasks(boardId);
    }
  };

  const fetchBoardColumns = (boardId) => {
    fetch(`/api/boards/${boardId}/columns`)
      .then(res => res.json())
      .then(cols => {
        if (Array.isArray(cols)) {
          setColumns(cols);
        }
      })
      .catch(console.error);
  };

  const fetchBoardTasks = (boardId) => {
    fetch(`/api/tasks?board_id=${boardId}`)
      .then(res => res.json())
      .then(taskData => {
        if (Array.isArray(taskData)) {
          setTasks(taskData);
        }
      })
      .catch(console.error);
  };

  const handleSelectTab = (tab) => {
    if (tab === 'workspace' && !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentTab(tab);
  };

  // Switch Board Mode ONLINE <-> OFFLINE
  const handleToggleBoardMode = (targetBoard) => {
    if (!targetBoard) return;

    if (!targetBoard.is_offline) {
      // ONLINE -> OFFLINE
      const confirmSwitch = window.confirm(
        `Переключить доску "${targetBoard.name}" в Офлайн-режим?\n\nВсе данные этой доски будут сохранены локально в вашем браузере (localStorage) и полностью удалены с сервера.`
      );
      if (!confirmSwitch) return;

      setSyncStatus('syncing');
      setSyncMessage('Перенос в Офлайн...');

      Promise.all([
        fetch(`/api/boards/${targetBoard.id}/columns`).then(r => r.json()),
        fetch(`/api/tasks?board_id=${targetBoard.id}`).then(r => r.json())
      ])
        .then(([cols, ts]) => {
          const offlineCols = Array.isArray(cols) ? cols : [];
          const offlineTasks = Array.isArray(ts) ? ts : [];

          saveOfflineBoardData(targetBoard.id, { columns: offlineCols, tasks: offlineTasks });
          addOfflineBoard({ ...targetBoard, is_offline: true });

          fetch(`/api/boards/${targetBoard.id}`, { method: 'DELETE' })
            .then(() => {
              setSyncStatus('synced');
              setSyncMessage('💾 Доска переведена в Офлайн');
              fetchBoards();
            })
            .catch(console.error);
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка перевода в офлайн');
        });

    } else {
      // OFFLINE -> ONLINE
      const confirmSwitch = window.confirm(
        `Переключить доску "${targetBoard.name}" в Онлайн-режим?\n\nДанные из вашего браузера будут загружены на сервер и синхронизированы с базой данных.`
      );
      if (!confirmSwitch) return;

      setSyncStatus('syncing');
      setSyncMessage('Синхронизация с сервером...');

      const offlineData = getOfflineBoardData(targetBoard.id);

      fetch('/api/boards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: targetBoard,
          columns: offlineData.columns,
          tasks: offlineData.tasks
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.success) {
            deleteOfflineBoard(targetBoard.id);
            setSyncStatus('synced');
            setSyncMessage('🌐 Доска переведена в Онлайн');
            fetch('/api/boards')
              .then(res => res.json())
              .then(serverBoards => {
                const offlineList = getOfflineBoards();
                const combined = [...(Array.isArray(serverBoards) ? serverBoards : []), ...offlineList];
                setBoards(combined);
                selectBoard(data.boardId, combined.find(b => String(b.id) === String(data.boardId)));
              });
          } else {
            throw new Error(data.error || 'Ошибка импорта');
          }
        })
        .catch(err => {
          setSyncStatus('error');
          setSyncMessage('Ошибка перевода в онлайн');
        });
    }
  };

  const handleSaveTask = (taskData) => {
    setSyncStatus('syncing');
    setSyncMessage('Сохранение...');

    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

    if (activeBoard && activeBoard.is_offline) {
      let updatedTasks;
      if (taskData.id) {
        updatedTasks = tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        const newTask = {
          ...taskData,
          id: `off_task_${Date.now()}`,
          board_id: currentBoardId,
          created_at: new Date().toISOString()
        };
        updatedTasks = [...tasks, newTask];
      }
      setTasks(updatedTasks);
      saveOfflineBoardData(currentBoardId, { columns, tasks: updatedTasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Сохранено локально');
      setIsTaskModalOpen(false);
      return;
    }

    if (taskData.id) {
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
      fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
        .then(() => {
          setSyncStatus('synced');
          setSyncMessage('Задача обновлена');
          setIsTaskModalOpen(false);
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка обновления');
          fetchBoardTasks(currentBoardId);
        });
    } else {
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, board_id: currentBoardId })
      })
        .then(res => res.json())
        .then(newTask => {
          setSyncStatus('synced');
          setSyncMessage('Задача создана');
          setIsTaskModalOpen(false);
          if (newTask && newTask.id) {
            setTasks(prev => [...prev, newTask]);
          } else {
            fetchBoardTasks(currentBoardId);
          }
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка создания');
        });
    }
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;

    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns, tasks: updatedTasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Задача удалена');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация...');

    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Задача удалена');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка удаления');
        fetchBoardTasks(currentBoardId);
      });
  };

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
      // Intra-column drag -> INSTANT STACK READY (0ms delay!)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTargetRef.current = targetTask.id;
      setDwellStackTargetId(targetTask.id);
    } else {
      // Inter-column drag -> Require 1.8s dwell timer!
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

  const handleSubtasksChange = (taskId, updatedSubtasks) => {
    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks, subtasks_json: JSON.stringify(updatedSubtasks) } : t);
    setTasks(newTasks);

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Изменения сохранены');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация...');

    fetch(`/api/tasks/${taskId}/subtasks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks: updatedSubtasks })
    })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Изменения сохранены');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка сохранения');
        fetchBoardTasks(currentBoardId);
      });
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

  const handleCreateBoard = (boardData) => {
    fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boardData)
    })
      .then(res => res.json())
      .then(newBoard => {
        setIsBoardModalOpen(false);
        fetchBoards();
        if (newBoard && newBoard.id) {
          selectBoard(newBoard.id);
        }
      })
      .catch(console.error);
  };

  const handleSaveReorderedColumns = (reorderedCols) => {
    setColumns(reorderedCols);
    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns: reorderedCols, tasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Порядок колонок сохранён');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация колонок...');

    const updates = reorderedCols.map((c, index) =>
      fetch(`/api/columns/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: index, title: c.title, color: c.color })
      })
    );

    Promise.all(updates)
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Порядок колонок сохранён');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка порядка колонок');
      });
  };

  const handleDeleteColumn = (columnId) => {
    if (!window.confirm('Удалить эту колонку? Все задачи в ней будут удалены!')) return;
    const updatedCols = columns.filter(c => c.id !== columnId);
    setColumns(updatedCols);

    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns: updatedCols, tasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Колонка удалена');
      return;
    }

    fetch(`/api/columns/${columnId}`, { method: 'DELETE' })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Колонка удалена');
      })
      .catch(console.error);
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        setCurrentUser(null);
        setBoards([]);
        setCurrentBoardId(null);
        setColumns([]);
        setTasks([]);
        setCurrentTab('landing');
        setSyncStatus('synced');
        setSyncMessage('Выполнен выход из аккаунта');
      })
      .catch(console.error);
  };

  const getGroupedItemsForColumn = (columnKey) => {
    const colTasks = tasks.filter(t => t.status === columnKey);
    const result = [];
    const processedGroups = new Set();

    colTasks.forEach(task => {
      if (task.group_id) {
        if (!processedGroups.has(task.group_id)) {
          processedGroups.add(task.group_id);
          const stackTasks = colTasks.filter(t => t.group_id === task.group_id);
          result.push({ isStack: true, groupId: task.group_id, tasks: stackTasks });
        }
      } else {
        result.push({ isStack: false, task });
      }
    });

    return result;
  };

  return (
    <div className="app-container">
      <div className="workspace-wrapper full-height">
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          viewMode={viewMode}
          onSelectTab={handleSelectTab}
          onChangeViewMode={(mode) => setViewMode(mode)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onLogout={handleLogout}
          boards={boards}
          currentBoardId={currentBoardId}
          onSelectBoard={selectBoard}
          onCreateBoard={() => setIsBoardModalOpen(true)}
          onOpenShare={(b) => setShareBoardModal(b)}
          onOpenManageColumns={(b) => {
            setManageColumnsBoard(b);
            setIsManageColumnsModalOpen(true);
          }}
          onToggleBoardMode={handleToggleBoardMode}
          onOpenSyncModal={(b) => setSyncBoardModal(b)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {currentTab === 'landing' && (
          <LandingHero
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenWorkspace={() => handleSelectTab('workspace')}
            onCreateBoard={() => setIsBoardModalOpen(true)}
          />
        )}

        {currentTab === 'workspace' && (
          <main className="board" data-card-mode={viewMode}>
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                viewMode={viewMode}
                dwellStackTargetId={dwellStackTargetId}
                groupedItems={getGroupedItemsForColumn(col.column_key)}
                onAddTask={(colKey) => { setTaskToEdit({ status: colKey }); setIsTaskModalOpen(true); }}
                onEditColumn={(col) => { setColumnToEdit(col); setIsColumnModalOpen(true); }}
                onDeleteColumn={handleDeleteColumn}
                onEditTask={(task) => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onSubtasksChange={handleSubtasksChange}
                onUnlinkGroup={handleUnlinkGroup}
                onDragStartTask={handleDragStartTask}
                onDragOverTask={handleDragOverTask}
                onDropTask={handleDropTask}
                onDropColumn={handleDropColumn}
              />
            ))}
          </main>
        )}
      </div>

      <SyncToast status={syncStatus} message={syncMessage} />

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
      )}

      {isTaskModalOpen && (
        <TaskModal
          task={taskToEdit}
          onClose={() => { setIsTaskModalOpen(false); setTaskToEdit(null); }}
          onSave={handleSaveTask}
        />
      )}

      {isBoardModalOpen && (
        <BoardModal
          onClose={() => setIsBoardModalOpen(false)}
          onSave={handleCreateBoard}
        />
      )}

      {isColumnModalOpen && (
        <ColumnModal
          column={columnToEdit}
          onClose={() => { setIsColumnModalOpen(false); setColumnToEdit(null); }}
          onSave={(colData) => {
            const updatedCols = columns.map(c => c.id === colData.id ? { ...c, ...colData } : c);
            setColumns(updatedCols);
            setIsColumnModalOpen(false);

            const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
            if (activeBoard && activeBoard.is_offline) {
              saveOfflineBoardData(currentBoardId, { columns: updatedCols, tasks });
              setSyncStatus('synced');
              setSyncMessage('💾 Колонка обновлена');
              return;
            }

            fetch(`/api/columns/${colData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(colData)
            }).then(() => fetchBoardColumns(currentBoardId));
          }}
        />
      )}

      {isManageColumnsModalOpen && manageColumnsBoard && (
        <ManageColumnsModal
          board={manageColumnsBoard}
          columns={columns}
          onClose={() => { setIsManageColumnsModalOpen(false); setManageColumnsBoard(null); }}
          onSaveReorder={handleSaveReorderedColumns}
          onAddColumn={(newCol) => {
            const colObj = { ...newCol, id: `off_col_${Date.now()}` };
            const updated = [...columns, colObj];
            setColumns(updated);

            const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
            if (activeBoard && activeBoard.is_offline) {
              saveOfflineBoardData(currentBoardId, { columns: updated, tasks });
              setSyncStatus('synced');
              setSyncMessage('💾 Колонка создана');
              return;
            }

            fetch(`/api/boards/${currentBoardId}/columns`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCol)
            }).then(() => fetchBoardColumns(currentBoardId));
          }}
        />
      )}

      {shareBoardModal && (
        <ShareModal
          board={shareBoardModal}
          onClose={() => setShareBoardModal(null)}
        />
      )}

      {syncBoardModal && (
        <BoardSyncModal
          board={syncBoardModal}
          onClose={() => setSyncBoardModal(null)}
          onToggleBoardMode={handleToggleBoardMode}
        />
      )}
    </div>
  );
}
