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
import TaskViewModal from '../modals/TaskViewModal';

/** Renders whichever modals are currently open in `modals` (see useModals). */
export default function ModalContainer({
  modals,
  workspace,
  currentUser,
  onLogout,
  onRefreshUser,
  onStartGuestMode,
  confirmDialog,
  onCancelConfirm
}) {
  const { isOpen, payload, open, close } = modals;
  const editColumn = (col) => open('column', col);

  return (
    <>
      {isOpen('auth') && (
        <AuthModal
          onClose={() => close('auth')}
          onOpenGuestMode={() => {
            close('auth');
            onStartGuestMode();
          }}
        />
      )}

      {isOpen('profile') && (
        <ProfileModal
          user={currentUser}
          onClose={() => close('profile')}
          onLogout={onLogout}
          onRefreshUser={onRefreshUser}
        />
      )}

      {isOpen('settings') && <SettingsModal onClose={() => close('settings')} />}

      {isOpen('trash') && (
        <TrashModal
          boardId={workspace.currentBoardId}
          currentUser={currentUser}
          onClose={() => close('trash')}
          onChanged={workspace.refreshActiveBoard}
        />
      )}

      {isOpen('boardSettings') && (
        <BoardSettingsModal
          board={payload('boardSettings')}
          columns={workspace.columns}
          currentUser={currentUser}
          onClose={() => close('boardSettings')}
          onUpdateBoard={workspace.updateBoard}
          onSaveColumns={workspace.saveColumnOrder}
          onAddColumn={workspace.addColumn}
          onEditColumn={editColumn}
          onDeleteColumn={workspace.deleteColumn}
          onToggleBoardMode={(board) => {
            close('boardSettings');
            workspace.toggleBoardMode(board);
          }}
          onDeleteBoard={(board) => {
            close('boardSettings');
            workspace.deleteBoard(board);
          }}
        />
      )}

      {isOpen('taskView') && (
        <TaskViewModal
          task={payload('taskView')}
          columns={workspace.columns}
          onClose={() => close('taskView')}
          onEdit={(task) => {
            close('taskView');
            open('task', task);
          }}
          onSubtasksChange={workspace.changeSubtasks}
        />
      )}

      {isOpen('task') && (
        <TaskModal
          task={payload('task')}
          currentUser={currentUser}
          onClose={() => close('task')}
          onSave={async (task) => {
            if (await workspace.saveTask(task)) close('task');
          }}
        />
      )}

      {isOpen('board') && (
        <BoardModal
          onClose={() => close('board')}
          onSave={async (board) => {
            close('board');
            await workspace.createBoard(board);
          }}
        />
      )}

      {isOpen('column') && (
        <ColumnModal
          columnToEdit={payload('column')}
          boardId={workspace.currentBoardId}
          onClose={() => close('column')}
          onSave={(column) => {
            close('column');
            if (column.id) workspace.updateColumn(column);
            else workspace.addColumn(column);
          }}
        />
      )}

      {isOpen('manageColumns') && (
        <ManageColumnsModal
          board={payload('manageColumns')}
          columns={workspace.columns}
          onClose={() => close('manageColumns')}
          onSaveColumns={workspace.saveColumnOrder}
          onAddColumn={workspace.addColumn}
          onEditColumn={editColumn}
          onDeleteColumn={workspace.deleteColumn}
        />
      )}

      {isOpen('share') && <ShareModal board={payload('share')} onClose={() => close('share')} />}

      {isOpen('boardSync') && (
        <BoardSyncModal
          board={payload('boardSync')}
          onClose={() => close('boardSync')}
          onToggleBoardMode={workspace.toggleBoardMode}
        />
      )}

      <ConfirmModal {...confirmDialog} onCancel={onCancelConfirm} />
    </>
  );
}
