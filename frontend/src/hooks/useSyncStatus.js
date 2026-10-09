import { useState, useCallback, useMemo } from 'react';

/** Global "saving / saved / failed" indicator shown by <SyncToast>. */
export function useSyncStatus() {
  const [state, setState] = useState({ status: 'synced', message: 'Всё синхронизировано' });

  const report = useCallback((status, message) => setState({ status, message }), []);

  return useMemo(() => ({ ...state, report }), [state, report]);
}
