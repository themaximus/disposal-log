import { useState, useCallback, useMemo } from 'react';

/**
 * Keeps track of which modals are open and the payload each one was opened
 * with (e.g. the task being edited), so App doesn't need a flag per modal.
 */
export function useModals() {
  const [openModals, setOpenModals] = useState({});

  const open = useCallback((name, payload = true) => {
    setOpenModals(prev => ({ ...prev, [name]: payload }));
  }, []);

  const close = useCallback((name) => {
    setOpenModals(prev => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  return useMemo(() => ({
    open,
    close,
    isOpen: (name) => name in openModals,
    payload: (name) => openModals[name]
  }), [openModals, open, close]);
}
