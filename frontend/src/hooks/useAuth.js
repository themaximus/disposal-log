import { useState, useCallback } from 'react';
import { authApi, setSessionToken, clearSessionToken } from '../api';

/**
 * Consumes one-shot OAuth redirect params (?session=, ?drive_connected=) and
 * strips them from the address bar. Returns the origin of a fresh Drive link.
 */
export function consumeAuthRedirectParams() {
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session');
  if (session) setSessionToken(session);

  const driveConnectedFrom = params.get('drive_connected') === 'true' ? (params.get('origin') || 'default') : null;
  ['session', 'drive_connected', 'origin'].forEach(key => params.delete(key));

  const search = params.toString();
  window.history.replaceState({}, document.title, `${window.location.pathname}${search ? `?${search}` : ''}`);
  return { driveConnectedFrom };
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      const user = (data && data.user) || null;
      setCurrentUser(user);
      return user;
    } catch (e) {
      setCurrentUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSessionToken();
      setCurrentUser(null);
    }
  }, []);

  return { currentUser, refreshUser, logout };
}
