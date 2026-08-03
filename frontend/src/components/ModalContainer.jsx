import React from 'react';
import AuthModal from '../modals/AuthModal';
import ProfileModal from '../modals/ProfileModal';
import SettingsModal from '../modals/SettingsModal';
import TaskModal from '../modals/TaskModal';
import BoardModal from '../modals/BoardModal';
import ColumnModal from '../modals/ColumnModal';
import ManageColumnsModal from '../modals/ManageColumnsModal';
import ShareModal from '../modals/ShareModal';
import BoardSyncModal from '../modals/BoardSyncModal';
import ConfirmModal from '../modals/ConfirmModal';
import TrashModal from '../modals/TrashModal';
import BoardSettingsModal from '../modals/BoardSettingsModal';

export default function ModalContainer({
  isAuthModalOpen,
  setIsAuthModalOpen,
  initGuestMode,
  isProfileModalOpen,
  setIsProfileModalOpen,
  currentUser,
  handleLogout,
  checkAuthStatus,
  isSettingsModalOpen,
  setIsSettingsModalOpen,
  isTrashModalOpen,
  setIsTrashModalOpen,
  currentBoardId,
  fetchBoardTasks,
  boardSettingsModal,
  setBoardSettingsModal,
  columns,
  setColumns,
  boards,
  setBoards,
  saveOfflineBoards,
  saveOfflineBoardData,
  tasks,
  handleAddColumn,
  setColumnToEdit,
  setIsColumnModalOpen,
  handleDeleteColumn,
  handleToggleBoardMode,
  handleDeleteBoard,
  isTaskModalOpen,
  setIsTaskModalOpen,
  taskToEdit,
  setTaskToEdit,
  handleSaveTask,
  isBoardModalOpen,
  setIsBoardModalOpen,
  handleCreateBoard,
  isColumnModalOpen,
  columnToEdit,
  fetchBoardColumns,
  setSyncStatus,
  setSyncMessage,
  isManageColumnsModalOpen,
  manageColumnsBoard,
  setIsManageColumnsModalOpen,
  setManageColumnsBoard,
  handleSaveReorderedColumns,
  shareBoardModal,
  setShareBoardModal,
  syncBoardModal,
  setSyncBoardModal,
  confirmModalState,
  setConfirmModalState
}) {
  return (
    <>
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onOpenGuestMode={() => {
            setIsAuthModalOpen(false);
            initGuestMode(true);
          }}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={handleLogout}
          onRefreshUser={checkAuthStatus}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
      )}

      {isTrashModalOpen && (
        <TrashModal
          boardId={currentBoardId}
          currentUser={currentUser}
          onClose={() => setIsTrashModalOpen(false)}
          onTaskRestored={() => fetchBoardTasks(currentBoardId)}
        />
      )}

      {boardSettingsModal && (
        <BoardSettingsModal
          board={boardSettingsModal}
          columns={columns}
          currentUser={currentUser}
          onClose={() => setBoardSettingsModal(null)}
          onUpdateBoard={(updatedBoard) => {
            setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
            if (updatedBoard.is_offline) {
              saveOfflineBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
            } else {
              fetch(`/api/boards/${updatedBoard.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBoard)
              }).catch(console.error);
            }
          }}
          onSaveColumns={(reordered) => {
            setColumns(reordered);
            const activeBoard = boards.find(b => String(b.id) === String(currentBoardId));
            if (activeBoard && activeBoard.is_offline) {
              saveOfflineBoardData(currentBoardId, { columns: reordered, tasks });
            } else {
              fetch('/api/columns/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: reordered.map(c => ({ id: c.id, position: c.position })) })
              }).catch(console.error);
            }
          }}
          onAddColumn={handleAddColumn}
          onEditColumn={(col) => {
            setColumnToEdit(col);
            setIsColumnModalOpen(true);
          }}
          onDeleteColumn={handleDeleteColumn}
          onToggleBoardMode={handleToggleBoardMode}
          onDeleteBoard={handleDeleteBoard}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          task={taskToEdit}
          currentUser={currentUser}
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
          onAddColumn={handleAddColumn}
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

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        confirmStyle={confirmModalState.confirmStyle}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
