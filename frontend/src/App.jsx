import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import LandingHero from './components/LandingHero';
import SyncToast from './components/SyncToast';
import ModalContainer from './components/ModalContainer';
import { useDragAndDrop } from './hooks/useDragAndDrop';

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
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [shareBoardModal, setShareBoardModal] = useState(null);
  const [syncBoardModal, setSyncBoardModal] = useState(null);
  const [boardSettingsModal, setBoardSettingsModal] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [manageColumnsBoard, setManageColumnsBoard] = useState(null);

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    confirmStyle: 'primary',
    onConfirm: () => {}
  });

  const askConfirmation = ({ title, message, confirmText, cancelText, confirmStyle, onConfirm }) => {
    setConfirmModalState({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || 'Подтвердить',
      cancelText: cancelText || 'Отмена',
      confirmStyle: confirmStyle || 'primary',
      onConfirm: () => {
        setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        if (typeof onConfirm === 'function') onConfirm();
      }
    });
  };

  const checkAuthStatus = () => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          if (currentTab === 'landing') setCurrentTab('boards');
          fetchUserBoards();
        } else {
          initGuestMode();
        }
      })
      .catch(() => initGuestMode());
  };

  const initGuestMode = (forceGuest = false) => {
    const offlineBoards = getOfflineBoards();
    if (offlineBoards.length === 0) {
      const defaultOfflineBoard = {
        id: 'off_board_default',
        name: 'Мой локальный проект 🚀',
        description: 'Демонстрационная офлайн-доска для работы без интернета.',
        icon: '📋',
        is_offline: true,
        created_at: new Date().toISOString()
      };
      saveOfflineBoards([defaultOfflineBoard]);
      setBoards([defaultOfflineBoard]);
      selectBoard(defaultOfflineBoard.id);
    } else {
      setBoards(offlineBoards);
      const lastSelectedId = localStorage.getItem('last_selected_board_id');
      if (lastSelectedId && offlineBoards.some(b => String(b.id) === String(lastSelectedId))) {
        selectBoard(lastSelectedId);
      } else {
        selectBoard(offlineBoards[0].id);
      }
    }
    if (forceGuest) setCurrentTab('boards');
  };

  const fetchUserBoards = () => {
    fetch('/api/boards')
      .then(res => res.json())
      .then(onlineBoards => {
        const offlineBoards = getOfflineBoards();
        const combined = [...(Array.isArray(onlineBoards) ? onlineBoards : []), ...offlineBoards];
        setBoards(combined);

        const lastSelectedId = localStorage.getItem('last_selected_board_id');
        if (lastSelectedId && combined.some(b => String(b.id) === String(lastSelectedId))) {
          selectBoard(lastSelectedId);
        } else if (combined.length > 0) {
          selectBoard(combined[0].id);
        }
      })
      .catch(() => initGuestMode());
  };

  const selectBoard = (boardId) => {
    setCurrentBoardId(boardId);
    localStorage.setItem('last_selected_board_id', boardId);

    const isOfflineBoard = String(boardId).startsWith('off_');
    const activeBoard = boards.find(b => String(b.id) === String(boardId));

    if (isOfflineBoard || (activeBoard && activeBoard.is_offline)) {
      const offlineData = getOfflineBoardData(boardId);
      setColumns(offlineData.columns || []);
      setTasks(offlineData.tasks || []);
    } else {
      fetchBoardColumns(boardId);
      fetchBoardTasks(boardId);
    }
  };

  const fetchBoardColumns = (boardId) => {
    if (!boardId || String(boardId).startsWith('off_')) return;
    fetch(`/api/boards/${boardId}/columns`)
      .then(res => res.json())
      .then(cols => {
        if (Array.isArray(cols)) setColumns(cols);
      })
      .catch(console.error);
  };

  const fetchBoardTasks = (boardId) => {
    if (!boardId || String(boardId).startsWith('off_')) return;
    fetch(`/api/tasks?board_id=${boardId}`)
      .then(res => res.json())
      .then(tList => {
        if (Array.isArray(tList)) setTasks(tList);
      })
      .catch(console.error);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Hook for Drag & Drop functionality
  const {
    draggedTaskId,
    dwellStackTargetId,
    handleDragStartTask,
    handleDragOverTask,
    handleDropTask,
    handleDropColumn,
    handleUnlinkGroup
  } = useDragAndDrop({
    tasks,
    setTasks,
    boards,
    currentBoardId,
    columns,
    setSyncStatus,
    setSyncMessage,
    fetchBoardTasks
  });

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

  const handleCreateBoard = (boardData) => {
    if (!currentUser) {
      const newOffBoard = addOfflineBoard(boardData.name, boardData.description, boardData.icon);
      setBoards(getOfflineBoards());
      selectBoard(newOffBoard.id);
      setIsBoardModalOpen(false);
      return;
    }

    fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boardData)
    })
      .then(res => res.json())
      .then(newBoard => {
        setIsBoardModalOpen(false);
        fetchUserBoards();
        if (newBoard && newBoard.id) selectBoard(newBoard.id);
      })
      .catch(console.error);
  };

  const handleSaveReorderedColumns = (reorderedCols) => {
    setColumns(reorderedCols);
    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
    if (activeBoard && activeBoard.is_offline) {
      saveOfflineBoardData(currentBoardId, { columns: reorderedCols, tasks });
      setSyncStatus('synced');
      setSyncMessage('💾 Порядок сохранён');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Синхронизация порядка...');

    fetch('/api/columns/positions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: reorderedCols.map(c => ({ id: c.id, position: c.position })) })
    })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Порядок сохранён');
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка порядка');
        fetchBoardColumns(currentBoardId);
      });
  };

  const handleDeleteColumn = (columnId) => {
    askConfirmation({
      title: 'Удалить колонку?',
      message: 'Вы уверены, что хотите удалить эту колонку? Задачи из неё не будут удалены.',
      confirmText: 'Удалить колонку',
      confirmStyle: 'danger',
      onConfirm: () => {
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
      }
    });
  };

  const handleAddColumn = (newCol) => {
    const colObj = { ...newCol, id: `col_${Date.now()}`, column_key: `col_${Date.now()}` };
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
  };

  const handleDeleteBoard = (boardToDelete) => {
    if (!boardToDelete) return;

    askConfirmation({
      title: `Удалить доску "${boardToDelete.name}"?`,
      message: 'Вы уверены, что хотите безвозвратно удалить эту доску? Все задачи и колонки этой доски будут удалены.',
      confirmText: 'Удалить доску',
      confirmStyle: 'danger',
      onConfirm: () => {
        if (boardToDelete.is_offline) {
          deleteOfflineBoard(boardToDelete.id);
          const remaining = getOfflineBoards();
          setBoards(prev => prev.filter(b => b.id !== boardToDelete.id));
          if (remaining.length > 0) {
            selectBoard(remaining[0].id);
          } else {
            setCurrentBoardId(null);
            setColumns([]);
            setTasks([]);
          }
          return;
        }

        fetch(`/api/boards/${boardToDelete.id}`, { method: 'DELETE' })
          .then(() => {
            fetchUserBoards();
          })
          .catch(console.error);
      }
    });
  };

  const handleToggleBoardMode = (boardToToggle) => {
    if (!boardToToggle) return;
    const isCurrentlyOffline = !!boardToToggle.is_offline;

    if (isCurrentlyOffline) {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return;
      }

      fetch('/api/boards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: boardToToggle,
          columns,
          tasks
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.boardId) {
            deleteOfflineBoard(boardToToggle.id);
            fetchUserBoards();
            selectBoard(data.boardId);
          }
        })
        .catch(console.error);
    } else {
      const offlineBoard = addOfflineBoard(boardToToggle.name, boardToToggle.description, boardToToggle.icon);
      saveOfflineBoardData(offlineBoard.id, { columns, tasks });
      fetchUserBoards();
      selectBoard(offlineBoard.id);
    }
  };

  const handleDeleteTask = (taskId) => {
    askConfirmation({
      title: 'Переместить задачу в Корзину?',
      message: 'Задача сохранится в Корзине на 30 дней. Вы сможете восстановить её в любой момент.',
      confirmText: 'В Корзину',
      confirmStyle: 'danger',
      onConfirm: () => {
        const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

        if (activeBoard && activeBoard.is_offline) {
          const newTasks = tasks.filter(t => t.id !== taskId);
          setTasks(newTasks);
          saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
          return;
        }

        fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
          .then(() => {
            fetchBoardTasks(currentBoardId);
          })
          .catch(console.error);
      }
    });
  };

  const handleSaveTask = (taskData) => {
    const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

    if (activeBoard && activeBoard.is_offline) {
      let newTasks;
      if (taskData.id) {
        newTasks = tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        const newObj = {
          ...taskData,
          id: `off_task_${Date.now()}`,
          created_at: new Date().toISOString()
        };
        newTasks = [...tasks, newObj];
      }
      setTasks(newTasks);
      saveOfflineBoardData(currentBoardId, { columns, tasks: newTasks });
      setIsTaskModalOpen(false);
      setTaskToEdit(null);
      return;
    }

    const payload = {
      ...taskData,
      board_id: currentBoardId
    };

    const method = taskData.id ? 'PUT' : 'POST';
    const url = taskData.id ? `/api/tasks/${taskData.id}` : '/api/tasks';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then((savedTask) => {
        setIsTaskModalOpen(false);
        setTaskToEdit(null);
        if (savedTask && savedTask.id && !taskData.id) {
          setTasks(prev => [...prev, savedTask]);
        }
        fetchBoardTasks(currentBoardId);
      })
      .catch(console.error);
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        setCurrentUser(null);
        setCurrentTab('landing');
        initGuestMode();
      })
      .catch(console.error);
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
  };

  const getGroupedItemsForColumn = (columnKey) => {
    const colTasks = tasks.filter(t => t.status === columnKey);
    const result = [];
    const processedGroupIds = new Set();

    colTasks.forEach(task => {
      if (task.group_id) {
        if (!processedGroupIds.has(task.group_id)) {
          processedGroupIds.add(task.group_id);
          const stackMembers = colTasks.filter(t => t.group_id === task.group_id);
          result.push({
            isStack: true,
            groupId: task.group_id,
            tasks: stackMembers
          });
        }
      } else {
        result.push({
          isStack: false,
          task
        });
      }
    });

    return result;
  };

  const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));

  return (
    <div className="app-container">
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      <div className={`workspace-wrapper ${currentTab === 'landing' ? 'full-height' : ''}`}>
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onChangeViewMode={(mode) => setViewMode(mode)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenTrash={() => setIsTrashModalOpen(true)}
          onOpenBoardSettings={(b) => setBoardSettingsModal(b)}
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
          onDeleteBoard={handleDeleteBoard}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {currentTab === 'landing' ? (
          <LandingHero
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenBoard={() => setCurrentTab('boards')}
          />
        ) : (
          <main className="board" data-card-mode={viewMode}>
            {columns.map(col => (
              <Column
                key={col.id || col.column_key}
                column={col}
                groupedItems={getGroupedItemsForColumn(col.column_key)}
                onEditTask={(task) => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onEditColumn={(col) => { setColumnToEdit(col); setIsColumnModalOpen(true); }}
                onDeleteColumn={handleDeleteColumn}
                onSubtasksChange={handleSubtasksChange}
                onUnlinkGroup={handleUnlinkGroup}
                onQuickAddTask={(colKey) => {
                  setTaskToEdit({ status: colKey, difficulty: 1 });
                  setIsTaskModalOpen(true);
                }}
                draggedTaskId={draggedTaskId}
                dwellStackTargetId={dwellStackTargetId}
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

      <ModalContainer
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
        initGuestMode={initGuestMode}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        currentUser={currentUser}
        handleLogout={handleLogout}
        isSettingsModalOpen={isSettingsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        isTrashModalOpen={isTrashModalOpen}
        setIsTrashModalOpen={setIsTrashModalOpen}
        currentBoardId={currentBoardId}
        fetchBoardTasks={fetchBoardTasks}
        boardSettingsModal={boardSettingsModal}
        setBoardSettingsModal={setBoardSettingsModal}
        columns={columns}
        setColumns={setColumns}
        boards={boards}
        setBoards={setBoards}
        saveOfflineBoards={saveOfflineBoards}
        saveOfflineBoardData={saveOfflineBoardData}
        tasks={tasks}
        handleAddColumn={handleAddColumn}
        setColumnToEdit={setColumnToEdit}
        setIsColumnModalOpen={setIsColumnModalOpen}
        handleDeleteColumn={handleDeleteColumn}
        handleToggleBoardMode={handleToggleBoardMode}
        handleDeleteBoard={handleDeleteBoard}
        isTaskModalOpen={isTaskModalOpen}
        setIsTaskModalOpen={setIsTaskModalOpen}
        taskToEdit={taskToEdit}
        setTaskToEdit={setTaskToEdit}
        handleSaveTask={handleSaveTask}
        isBoardModalOpen={isBoardModalOpen}
        setIsBoardModalOpen={setIsBoardModalOpen}
        handleCreateBoard={handleCreateBoard}
        isColumnModalOpen={isColumnModalOpen}
        columnToEdit={columnToEdit}
        fetchBoardColumns={fetchBoardColumns}
        setSyncStatus={setSyncStatus}
        setSyncMessage={setSyncMessage}
        isManageColumnsModalOpen={isManageColumnsModalOpen}
        manageColumnsBoard={manageColumnsBoard}
        setIsManageColumnsModalOpen={setIsManageColumnsModalOpen}
        setManageColumnsBoard={setManageColumnsBoard}
        handleSaveReorderedColumns={handleSaveReorderedColumns}
        shareBoardModal={shareBoardModal}
        setShareBoardModal={setShareBoardModal}
        syncBoardModal={syncBoardModal}
        setSyncBoardModal={setSyncBoardModal}
        confirmModalState={confirmModalState}
        setConfirmModalState={setConfirmModalState}
      />
    </div>
  );
}
