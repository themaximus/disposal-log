import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import LandingHero from './components/LandingHero';
import SyncToast from './components/SyncToast';
import TaskModal from './modals/TaskModal';
import BoardModal from './modals/BoardModal';
import ShareModal from './modals/ShareModal';
import AuthModal from './modals/AuthModal';
import ProfileModal from './modals/ProfileModal';
import SettingsModal from './modals/SettingsModal';
import ColumnModal from './modals/ColumnModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('landing');
  const [viewMode, setViewMode] = useState(1); // Card Density Mode (1: Detailed, 2: Compact, 3: Minimalist)
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync Toast State
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  // Drag & Drop State
  const [draggedTask, setDraggedTask] = useState(null);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [shareBoardModal, setShareBoardModal] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);

  useEffect(() => {
    // Check URL parameters for session token
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');
    if (sessionToken) {
      document.cookie = `session_token=${sessionToken}; path=/; max-age=2592000; SameSite=Lax`;
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Fetch Current User
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && (data.id || data.user)) {
          const userObj = data.id ? data : data.user;
          setCurrentUser(userObj);
          setCurrentTab('workspace');
          fetchBoards();
        } else {
          setCurrentUser(null);
          setCurrentTab('landing');
        }
      })
      .catch(() => {
        setCurrentUser(null);
        setCurrentTab('landing');
      });
  }, []);

  const fetchBoards = () => {
    fetch('/api/boards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBoards(data);
          selectBoard(data[0].id);
        } else {
          setBoards([]);
          setTasks([]);
        }
      })
      .catch(console.error);
  };

  const selectBoard = (boardId) => {
    setCurrentBoardId(boardId);
    fetchTasksForBoard(boardId);
  };

  const fetchTasksForBoard = (boardId) => {
    setColumns([
      { id: 1, column_key: 'todo', title: 'Предстоящие', color: '#f85149' },
      { id: 2, column_key: 'in_progress', title: 'В работе', color: '#d29922' },
      { id: 3, column_key: 'done', title: 'Реализованные', color: '#2ea043' }
    ]);

    fetch(`/api/tasks?board_id=${boardId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setTasks([]);
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

  // Group tasks into Stacks
  const getGroupedItemsForColumn = (colKey) => {
    const colTasks = tasks.filter(t => (t.status || 'todo') === colKey);
    const grouped = [];
    const processedGroups = new Set();

    colTasks.forEach(t => {
      if (t.group_id) {
        if (!processedGroups.has(t.group_id)) {
          processedGroups.add(t.group_id);
          const stackTasks = colTasks.filter(st => st.group_id === t.group_id);
          if (stackTasks.length > 1) {
            grouped.push({ isStack: true, groupId: t.group_id, tasks: stackTasks });
          } else {
            grouped.push({ isStack: false, task: t });
          }
        }
      } else {
        grouped.push({ isStack: false, task: t });
      }
    });

    return grouped;
  };

  // Drag & Drop Handlers
  const handleDragStartTask = (e, task) => {
    setDraggedTask(task);
  };

  const handleDragOverTask = (e, task) => {
    e.preventDefault();
  };

  const handleDropTask = (e, targetTask) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    // Check if dragging ONTO target task to create/join stack
    const targetGroupId = targetTask.group_id || `group_${Date.now()}`;

    setTasks(prev => prev.map(t => {
      if (t.id === draggedTask.id || t.id === targetTask.id) {
        return { ...t, status: targetTask.status, group_id: targetGroupId };
      }
      return t;
    }));

    setSyncStatus('syncing');
    setSyncMessage('Создание стопки...');

    fetch(`/api/tasks/${draggedTask.id}/group`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id: targetTask.id })
    }).finally(() => {
      setSyncStatus('success');
      setSyncMessage('Стопка сформирована');
      setTimeout(() => setSyncStatus(null), 2000);
    });
  };

  const handleUnlinkGroup = (groupId) => {
    setTasks(prev => prev.map(t => t.group_id === groupId ? { ...t, group_id: null } : t));
    fetch(`/api/tasks/group/${groupId}/unlink`, { method: 'PUT' });
  };

  const handleDropColumn = (e, columnKey) => {
    e.preventDefault();
    if (!draggedTask) return;
    moveTaskStatus(draggedTask.id, columnKey);
  };

  const moveTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    setSyncStatus('syncing');
    setSyncMessage('Сохранение...');

    fetch(`/api/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (res.ok) {
          setSyncStatus('success');
          setSyncMessage('Сохранено');
          setTimeout(() => setSyncStatus(null), 2000);
        } else {
          setSyncStatus('error');
          setSyncMessage('Ошибка сохранения');
          setTimeout(() => setSyncStatus(null), 3000);
        }
      })
      .catch(() => {
        setSyncStatus('error');
        setSyncMessage('Ошибка сети');
        setTimeout(() => setSyncStatus(null), 3000);
      });
  };

  // Task Save & Delete
  const handleSaveTask = (taskData) => {
    setSyncStatus('syncing');
    setSyncMessage('Сохранение...');

    if (taskData.id) {
      fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      }).then(() => {
        fetchTasksForBoard(currentBoardId);
        setIsTaskModalOpen(false);
        setSyncStatus('success');
        setSyncMessage('Задача обновлена');
        setTimeout(() => setSyncStatus(null), 2000);
      });
    } else {
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      }).then(() => {
        fetchTasksForBoard(currentBoardId);
        setIsTaskModalOpen(false);
        setSyncStatus('success');
        setSyncMessage('Задача создана');
        setTimeout(() => setSyncStatus(null), 2000);
      });
    }
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  const handleSaveBoard = (boardData) => {
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
    setColumns(prev => prev.map(c => c.id === colData.id ? { ...c, ...colData } : c));
    setIsColumnModalOpen(false);
  };

  const handleDeleteColumn = (colId) => {
    if (!window.confirm('Удалить эту колонку?')) return;
    setColumns(prev => prev.filter(c => c.id !== colId));
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
        onAddTask={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
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

      {isColumnModalOpen && (
        <ColumnModal
          columnToEdit={columnToEdit}
          boardId={currentBoardId}
          onClose={() => setIsColumnModalOpen(false)}
          onSave={handleSaveColumn}
        />
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
          onSave={handleSaveBoard}
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
