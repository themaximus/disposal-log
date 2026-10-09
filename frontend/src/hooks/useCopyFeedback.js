import { useState, useCallback } from 'react';

/** Copies text to the clipboard and exposes a short-lived `copied` flag. */
export function useCopyFeedback(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    }).catch(() => {});
  }, [resetMs]);

  return { copied, copy };
}
