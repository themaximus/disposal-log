import { useState, useCallback } from 'react';

export const TABS = { LANDING: 'landing', BOARDS: 'boards', DIAGRAMS: 'diagrams' };

export const getUrlParam = (name) => new URLSearchParams(window.location.search).get(name);

function writeUrl(tab, boardId) {
  const url = new URL(window.location.href);
  url.searchParams.delete('board');
  url.searchParams.delete('tab');
  if (tab === TABS.DIAGRAMS) {
    url.searchParams.set('tab', TABS.DIAGRAMS);
  } else if (tab !== TABS.LANDING && boardId) {
    url.searchParams.set('board', boardId);
  }
  window.history.replaceState({ tab, boardId }, '', url.toString());
}

/** Current top-level tab, mirrored into the URL (?tab=diagrams / ?board=id). */
export function useNavigation() {
  const [currentTab, setCurrentTab] = useState(TABS.LANDING);

  const navigate = useCallback((tab, boardId = null) => {
    setCurrentTab(tab);
    writeUrl(tab, boardId);
  }, []);

  // Restores the tab requested by the initial URL.
  const restoreFromUrl = useCallback(() => {
    if (getUrlParam('tab') === TABS.DIAGRAMS) setCurrentTab(TABS.DIAGRAMS);
    else if (getUrlParam('board')) setCurrentTab(TABS.BOARDS);
  }, []);

  return { currentTab, navigate, restoreFromUrl, syncUrl: writeUrl };
}
