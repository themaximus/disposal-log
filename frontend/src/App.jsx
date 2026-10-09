import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import LandingHero from './components/LandingHero';
import DiagramWorkspace from './components/DiagramWorkspace';
import SyncToast from './components/SyncToast';
import ModalContainer from './components/ModalContainer';
import { useAuth, consumeAuthRedirectParams } from './hooks/useAuth';
import { useNavigation, getUrlParam, TABS } from './hooks/useNavigation';
import { useModals } from './hooks/useModals';
import { useConfirm } from './hooks/useConfirm';
import { useSyncStatus } from './hooks/useSyncStatus';
import { useBoardWorkspace } from './hooks/useBoardWorkspace';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { groupColumnTasks } from './utils/taskFields';

const DRIVE_RETURN_MODALS = { profile: 'profile', settings: 'settings' };

export default function App() {
  const [viewMode, setViewMode] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { currentUser, refreshUser, logout } = useAuth();
  const { currentTab, navigate, restoreFromUrl, syncUrl } = useNavigation();
  const modals = useModals();
  const { dialog, confirm, close: closeConfirm } = useConfirm();
  const sync = useSyncStatus();

  const workspace = useBoardWorkspace({
    currentUser,
    sync,
    confirm,
    onShowBoard: (boardId, switchTab) => {
      if (switchTab) navigate(TABS.BOARDS, boardId);
      else syncUrl(currentTab, boardId);
    },
    onRequireAuth: () => modals.open('auth')
  });

  const dnd = useDragAndDrop({
    tasks: workspace.tasks,
    moveTask: workspace.moveTask,
    stackTasks: workspace.stackTasks
  });

  const loadSession = async () => {
    const user = await refreshUser();
    const urlBoardId = getUrlParam('board');
    if (user) await workspace.loadUserBoards(urlBoardId);
    else workspace.loadGuestBoards(urlBoardId);
  };

  useEffect(() => {
    const { driveConnectedFrom } = consumeAuthRedirectParams();
    if (driveConnectedFrom) {
      if (DRIVE_RETURN_MODALS[driveConnectedFrom]) modals.open(DRIVE_RETURN_MODALS[driveConnectedFrom]);
      sync.report('success', 'Google Диск успешно подключён!');
    }
    restoreFromUrl();
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    navigate(TABS.LANDING);
    workspace.loadGuestBoards(null);
  };

  const handleSelectTab = (tab) => {
    navigate(tab, workspace.currentBoardId);
  };

  const openNewTask = (status = workspace.columns[0]?.column_key || 'todo') => {
    modals.open('task', { status, difficulty: 1 });
  };

  return (
    <div className="app-container">
      <div className="workspace-wrapper full-height">
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onChangeViewMode={setViewMode}
          onOpenAuth={() => modals.open('auth')}
          onOpenProfile={() => modals.open('profile')}
          onOpenSettings={() => modals.open('settings')}
          onOpenTrash={() => modals.open('trash')}
          onOpenBoardSettings={(b) => modals.open('boardSettings', b)}
          onAddTask={() => openNewTask()}
          onLogout={handleLogout}
          boards={workspace.boards}
          currentBoardId={workspace.currentBoardId}
          onSelectBoard={workspace.selectBoard}
          onCreateBoard={() => modals.open('board')}
          onOpenShare={(b) => modals.open('share', b)}
          onOpenManageColumns={(b) => modals.open('manageColumns', b)}
          onToggleBoardMode={workspace.toggleBoardMode}
          onOpenSyncModal={(b) => modals.open('boardSync', b)}
          onDeleteBoard={workspace.deleteBoard}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(collapsed => !collapsed)}
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        />

        {currentTab === TABS.LANDING ? (
          <LandingHero
            currentUser={currentUser}
            onOpenAuth={() => modals.open('auth')}
            onOpenBoard={() => handleSelectTab(TABS.BOARDS)}
          />
        ) : currentTab === TABS.DIAGRAMS ? (
          <DiagramWorkspace currentUser={currentUser} onOpenAuth={() => modals.open('auth')} />
        ) : (
          <main className="board" data-card-mode={viewMode}>
            {workspace.columns.map(col => (
              <Column
                key={col.id || col.column_key}
                column={col}
                groupedItems={groupColumnTasks(workspace.tasks, col.column_key)}
                onViewTask={(task) => modals.open('taskView', task)}
                onEditTask={(task) => modals.open('task', task)}
                onDeleteTask={workspace.deleteTask}
                onEditColumn={(c) => modals.open('column', c)}
                onDeleteColumn={workspace.deleteColumn}
                onSubtasksChange={workspace.changeSubtasks}
                onUnlinkGroup={workspace.unlinkGroup}
                onAddTask={openNewTask}
                onQuickAddTask={openNewTask}
                draggedTaskId={dnd.draggedTaskId}
                dwellStackTargetId={dnd.dwellStackTargetId}
                onDragStartTask={dnd.handleDragStartTask}
                onDragOverTask={dnd.handleDragOverTask}
                onDropTask={dnd.handleDropTask}
                onDropColumn={dnd.handleDropColumn}
              />
            ))}
          </main>
        )}
      </div>

      <SyncToast status={sync.status} message={sync.message} />

      <ModalContainer
        modals={modals}
        workspace={workspace}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefreshUser={refreshUser}
        onStartGuestMode={() => workspace.loadGuestBoards(null, true)}
        confirmDialog={dialog}
        onCancelConfirm={closeConfirm}
      />
    </div>
  );
}
