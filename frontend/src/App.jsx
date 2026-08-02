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

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [manageColumnsBoard, setManageColumnsBoard] = useState(null);

  const [draggedTaskId, setDraggedTaskId] = useState(null);

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
    fetch('/api/boards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBoards(data);
          if (data.length > 0 && !currentBoardId) {
            selectBoard(data[0].id);
          }
        }
      })
      .catch(console.error);
  };

  const selectBoard = (boardId) => {
    setCurrentBoardId(boardId);
    fetchBoardColumns(boardId);
    fetchBoardTasks(boardId);
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
    setCurrentTab(tab);
    if (tab === 'workspace' && !currentUser) {
      setIsAuthModalOpen(true);
    }
  };

  const handleSaveTask = (taskData) => {
    setSyncStatus('syncing');
    setSyncMessage('Сохранение задачи...');

    if (taskData.id) {
      fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
        .then(res => res.json())
        .then(() => {
          setSyncStatus('synced');
          setSyncMessage('Задача обновлена');
          setIsTaskModalOpen(false);
          fetchBoardTasks(currentBoardId);
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка обновления');
        });
    } else {
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, board_id: currentBoardId })
      })
        .then(res => res.json())
        .then(() => {
          setSyncStatus('synced');
          setSyncMessage('Задача создана');
          setIsTaskModalOpen(false);
          fetchBoardTasks(currentBoardId);
        })
        .catch(() => {
          setSyncStatus('error');
          setSyncMessage('Ошибка создания');
        });
    }
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    setSyncStatus('syncing');
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Задача удалена');
        fetchBoardTasks(currentBoardId);
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка удаления');
      });
  };

  const handleDragStartTask = (e, task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragOverTask = (e) => {
    e.preventDefault();
  };

  const handleDropTask = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    setSyncStatus('syncing');
    setSyncMessage('Создание стопки задач...');

    fetch(`/api/tasks/${draggedTaskId}/group`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id: targetTask.id })
    })
      .then(res => res.json())
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Стопка создана');
        setDraggedTaskId(null);
        fetchBoardTasks(currentBoardId);
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка группировки');
      });
  };

  const handleUnlinkGroup = (groupId) => {
    setSyncStatus('syncing');
    setSyncMessage('Разгруппировка стопки...');

    fetch(`/api/tasks/group/${groupId}/unlink`, { method: 'PUT' })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Стопка разгруппирована');
        fetchBoardTasks(currentBoardId);
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка разгруппировки');
      });
  };

  const handleDropColumn = (e, columnKey) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === columnKey) return;

    setSyncStatus('syncing');
    setSyncMessage(`Перемещение в "${columnKey}"...`);

    fetch(`/api/tasks/${draggedTaskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: columnKey })
    })
      .then(() => {
        setSyncStatus('synced');
        setSyncMessage('Статус обновлен');
        setDraggedTaskId(null);
        fetchBoardTasks(currentBoardId);
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка перемещения');
      });
  };

  const getGroupedItemsForColumn = (columnKey) => {
    const colTasks = tasks.filter(t => (t.status || 'todo') === columnKey);
    const groups = {};
    const standalone = [];

    colTasks.forEach(task => {
      if (task.group_id) {
        if (!groups[task.group_id]) groups[task.group_id] = [];
        groups[task.group_id].push(task);
      } else {
        standalone.push(task);
      }
    });

    const items = [];
    Object.keys(groups).forEach(groupId => {
      items.push({ isStack: true, groupId, tasks: groups[groupId] });
    });
    standalone.forEach(task => {
      items.push({ isStack: false, task });
    });

    return items;
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
        if (newBoard.id) selectBoard(newBoard.id);
      });
  };

  const handleSaveColumn = (colData) => {
    if (colData.id) {
      fetch(`/api/columns/${colData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colData)
      });
      setColumns(prev => prev.map(c => c.id === colData.id ? { ...c, ...colData } : c));
    } else {
      fetch(`/api/boards/${currentBoardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colData)
      })
        .then(res => res.json())
        .then(newCol => {
          if (newCol && newCol.id) {
            setColumns(prev => [...prev, newCol]);
          }
        })
        .catch(console.error);
    }
    setIsColumnModalOpen(false);
  };

  const handleSaveReorderedColumns = (reorderedCols) => {
    setColumns(reorderedCols);
    reorderedCols.forEach((col, idx) => {
      fetch(`/api/columns/${col.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: idx })
      }).catch(console.error);
    });
  };

  const handleDeleteColumn = (colId) => {
    if (!window.confirm('Удалить эту колонку?')) return;
    fetch(`/api/columns/${colId}`, { method: 'DELETE' })
      .then(() => {
        setColumns(prev => prev.filter(c => c.id !== colId));
      })
      .catch(console.error);
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .finally(() => {
        document.cookie = 'session_token=; path=/; max-age=0';
        setCurrentUser(null);
        setBoards([]);
        setTasks([]);
        setCurrentBoardId(null);
        setIsProfileModalOpen(false);
        setCurrentTab('landing');
        setIsAuthModalOpen(true);
      });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        return;
      }
      if ((e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N') && currentTab === 'workspace') {
        e.preventDefault();
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab]);

  return (
    <div className="app-container">
      <div className="animated-bg"></div>

      <Header
        currentUser={currentUser}
        currentTab={currentTab}
        viewMode={viewMode}
        onSelectTab={handleSelectTab}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
      />

      {currentTab === 'landing' ? (
        <LandingHero
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenWorkspace={() => handleSelectTab('workspace')}
        />
      ) : (
        <div className="workspace-wrapper">
          <Sidebar
            boards={boards}
            currentBoardId={currentBoardId}
            onSelectBoard={selectBoard}
            onCreateBoard={() => setIsBoardModalOpen(true)}
            onOpenShare={(b) => setShareBoardModal(b)}
            onOpenManageColumns={(b) => {
              setManageColumnsBoard(b);
              setIsManageColumnsModalOpen(true);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <main className="board" data-card-mode={viewMode}>
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                viewMode={viewMode}
                groupedItems={getGroupedItemsForColumn(col.column_key)}
                onAddTask={(colKey) => { setTaskToEdit({ status: colKey }); setIsTaskModalOpen(true); }}
                onEditColumn={(col) => { setColumnToEdit(col); setIsColumnModalOpen(true); }}
                onDeleteColumn={handleDeleteColumn}
                onEditTask={(task) => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
                onDeleteTask={handleDeleteTask}
                onUnlinkGroup={handleUnlinkGroup}
                onDragStartTask={handleDragStartTask}
                onDragOverTask={handleDragOverTask}
                onDropTask={handleDropTask}
                onDropColumn={handleDropColumn}
              />
            ))}
          </main>
        </div>
      )}

      <SyncToast status={syncStatus} message={syncMessage} />

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isProfileModalOpen && (
        <ProfileModal user={currentUser} onClose={() => setIsProfileModalOpen(false)} onLogout={handleLogout} />
      )}

      {isSettingsModalOpen && (
        <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
      )}

      {isTaskModalOpen && (
        <TaskModal
          taskToEdit={taskToEdit}
          boardId={currentBoardId}
          onClose={() => setIsTaskModalOpen(false)}
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
          columnToEdit={columnToEdit}
          boardId={currentBoardId}
          onClose={() => setIsColumnModalOpen(false)}
          onSave={handleSaveColumn}
        />
      )}

      {isManageColumnsModalOpen && (
        <ManageColumnsModal
          board={manageColumnsBoard}
          columns={columns}
          onClose={() => setIsManageColumnsModalOpen(false)}
          onSaveColumns={handleSaveReorderedColumns}
          onAddColumn={(colData) => handleSaveColumn(colData)}
          onEditColumn={(col) => {
            setColumnToEdit(col);
            setIsColumnModalOpen(true);
          }}
          onDeleteColumn={handleDeleteColumn}
        />
      )}

      {shareBoardModal && (
        <ShareModal
          board={shareBoardModal}
          onClose={() => setShareBoardModal(null)}
        />
      )}
    </div>
  );
}
