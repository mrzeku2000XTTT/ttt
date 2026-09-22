import { useEffect } from 'react';

export default function useNicheBuildCleanup(busy, buildRef, enabled = true) {
  useEffect(() => () => {
    if (!enabled) return;
    const token = buildRef?.current;
    if (token) {
      token.cancelled = true;
      if (token.audioContext?.state !== 'closed') token.audioContext?.close().catch(() => {});
    }
  }, [buildRef, enabled]);
  useEffect(() => {
    if (!enabled || !busy || !navigator.wakeLock) return;
    let disposed = false, lock = null;
    const acquire = async () => {
      if (document.hidden || disposed || lock) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (disposed) { await next.release(); return; }
        lock = next;
        next.addEventListener('release', () => { if (lock === next) lock = null; });
      } catch { /* Screen wake lock is optional; rendering still checks audio/visibility. */ }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [busy, enabled]);
}