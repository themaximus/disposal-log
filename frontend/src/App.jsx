import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import SyncToast from './components/SyncToast';
import TaskModal from './modals/TaskModal';
import BoardModal from './modals/BoardModal';
import ShareModal from './modals/ShareModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    // Fetch Current User
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => setCurrentUser(user))
      .catch(() => setCurrentUser(null));

    // Fetch Boards
    fetchBoards();
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
    fetchTasksForBoard(boardId);
  };

  const fetchTasksForBoard = (boardId) => {
    // Default columns
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
        }
      })
      .catch(console.error);
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
    
    // Move dragged task to target's status
    moveTaskStatus(draggedTask.id, targetTask.status);
  };

  const handleDropColumn = (e, columnKey) => {
    e.preventDefault();
    if (!draggedTask) return;
    moveTaskStatus(draggedTask.id, columnKey);
  };

  const moveTaskStatus = (taskId, newStatus) => {
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    setSyncStatus('syncing');
    setSyncMessage('Сохранение изменений...');

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

  // Task Creation & Editing
  const handleSaveTask = (taskData) => {
    setSyncStatus('syncing');
    setSyncMessage('Сохранение...');

    if (taskData.id) {
      // Edit
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
      // Create
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

  // Board Creation
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

  return (
    <div className="app-container">
      <div className="animated-bg"></div>

      <Header
        currentUser={currentUser}
        onAddTask={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
        onOpenProfile={() => alert(`Профиль: ${currentUser?.name || currentUser?.email}`)}
      />

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

        <main className="board">
          {columns.map(col => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks.filter(t => (t.status || 'todo') === col.column_key)}
              onEditTask={(task) => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
              onDeleteTask={handleDeleteTask}
              onDragStartTask={handleDragStartTask}
              onDragOverTask={handleDragOverTask}
              onDropTask={handleDropTask}
              onDropColumn={handleDropColumn}
            />
          ))}
        </main>
      </div>

      <SyncToast status={syncStatus} message={syncMessage} />

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
