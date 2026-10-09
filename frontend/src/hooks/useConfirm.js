import { useState, useCallback } from 'react';

const CLOSED = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  confirmStyle: 'primary',
  onConfirm: () => {}
};

/** State for the shared <ConfirmModal>. */
export function useConfirm() {
  const [dialog, setDialog] = useState(CLOSED);

  const close = useCallback(() => setDialog(prev => ({ ...prev, isOpen: false })), []);

  const confirm = useCallback(({ title, message, confirmText, cancelText, confirmStyle, onConfirm }) => {
    setDialog({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || CLOSED.confirmText,
      cancelText: cancelText || CLOSED.cancelText,
      confirmStyle: confirmStyle || CLOSED.confirmStyle,
      onConfirm: () => {
        close();
        if (typeof onConfirm === 'function') onConfirm();
      }
    });
  }, [close]);

  return { dialog, confirm, close };
}
