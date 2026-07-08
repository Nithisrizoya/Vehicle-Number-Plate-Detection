import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlateEvent, ProcState } from '@/shared/types';

const POLL_MS = 1500;

export function useLiveDetection() {
  const [isRunning, setIsRunning] = useState(false);
  const [events,    setEvents]    = useState<PlateEvent[]>([]);
  const [error,     setError]     = useState<string | null>(null);

  const seenIds    = useRef<Set<string>>(new Set());
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const activeRef  = useRef(false); // live mirror of isRunning for use inside callbacks

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Sequential poll — next fires only after this one finishes
  const poll = useCallback(async () => {
    if (!mountedRef.current || !activeRef.current) return;

    let shouldStop = false;
    try {
      // Both requests in parallel to halve round-trip latency
      const [procRes, eventsRes] = await Promise.all([
        fetch('/api/processing'),
        fetch('/api/events/run'),
      ]);

      if (!mountedRef.current || !activeRef.current) return;

      // Check if process ended — but always read events first so the last batch isn't lost
      if (procRes.ok) {
        const d = await procRes.json() as ProcState;
        if (!d.running) shouldStop = true;
      }

      // Always read events (even on the final poll before stopping)
      if (eventsRes.ok && mountedRef.current) {
        const ed = await eventsRes.json();
        const incoming: PlateEvent[] = ed.events || [];
        const fresh = incoming.filter(e => !seenIds.current.has(e.id));
        if (fresh.length > 0) {
          fresh.forEach(e => seenIds.current.add(e.id));
          setEvents(prev => [...fresh, ...prev].slice(0, 200));
        }
      }
    } catch { /* network error — keep retrying */ }

    if (shouldStop) {
      activeRef.current = false;
      if (mountedRef.current) setIsRunning(false);
      return; // don't schedule next poll
    }

    if (mountedRef.current && activeRef.current) {
      timerRef.current = setTimeout(poll, POLL_MS);
    }
  }, []); // stable — all mutable state via refs

  // Start / stop the poll loop whenever isRunning changes
  useEffect(() => {
    if (isRunning) {
      activeRef.current = true;
      poll();
    } else {
      activeRef.current = false;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }
  }, [isRunning, poll]);

  const start = async () => {
    setError(null);
    setEvents([]);
    seenIds.current.clear();
    try {
      const r = await fetch('/api/start-live', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to start live detection'); return; }
      if (mountedRef.current) setIsRunning(true);
    } catch {
      if (mountedRef.current) setError('Server not reachable — make sure the server is running on port 3001');
    }
  };

  const stop = async () => {
    activeRef.current = false;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (mountedRef.current) setIsRunning(false);
    try { await fetch('/api/stop', { method: 'POST' }); } catch { /* ignore */ }
  };

  return { events, isRunning, error, start, stop };
}
