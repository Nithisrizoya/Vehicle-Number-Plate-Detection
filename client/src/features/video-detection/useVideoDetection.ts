import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProcState, PlateEvent } from '@/shared/types';

const POLL_FAST = 1000;   // while processing
const POLL_IDLE = 8000;   // waiting for user action

export function useVideoDetection() {
  const [proc,        setProc]        = useState<ProcState | null>(null);
  const [events,      setEvents]      = useState<PlateEvent[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Only true when the user explicitly started analysis in this browser session.
  // Prevents old completed runs from showing on page load or after "New Analysis".
  const sessionRef = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const procRef    = useRef<ProcState | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keep procRef in sync so poll can read latest state without stale closure
  useEffect(() => { procRef.current = proc; }, [proc]);

  // Sequential poll — next fires only after this one completes
  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const r = await fetch('/api/processing');
      if (!r.ok || !mountedRef.current) return;
      const d = await r.json() as ProcState;
      if (!mountedRef.current) return;

      setProc(d);
      procRef.current = d;

      // Auto-resume if a video run is actively processing (handles page refresh mid-run)
      if (d.running && d.mode === 'video' && !sessionRef.current) {
        sessionRef.current = true;
      }

      // Fetch plate events only for this session's completed run
      if (sessionRef.current && d.mode === 'video' && !d.running && d.exitCode === 0) {
        const er = await fetch('/api/events/run');
        if (er.ok && mountedRef.current) {
          const ed = await er.json();
          if (mountedRef.current) setEvents(ed.events || []);
        }
      }
    } catch { /* network error — keep polling */ }

    if (mountedRef.current) {
      const delay = procRef.current?.running ? POLL_FAST : POLL_IDLE;
      timerRef.current = setTimeout(poll, delay);
    }
  }, []); // stable — all mutable state via refs

  // Boot poll loop on mount
  useEffect(() => {
    poll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // isProcessing / isDone are gated by sessionRef — old server state never bleeds in
  const isProcessing = sessionRef.current && proc?.running === true && proc?.mode === 'video';
  const isDone       = sessionRef.current
    && proc !== null
    && proc.mode === 'video'
    && !proc.running
    && proc.exitCode !== null;

  const onStart = async (file: File): Promise<boolean> => {
    sessionRef.current = true;   // mark this browser session as started
    setEvents([]);
    setUploadError(null);

    const form = new FormData();
    form.append('video', file);
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) { setUploadError(d.error || 'Upload failed'); return false; }

      // Optimistic state so UI switches to processing card immediately
      const optimistic: ProcState = {
        running: true, filename: d.filename, outputVideo: d.outputVideo,
        startedAt: new Date().toISOString(),
        exitCode: null, error: null, plates_seen: 0, mode: 'video',
      };
      setProc(optimistic);
      procRef.current = optimistic;

      // Kick poll into fast mode immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(poll, POLL_FAST);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? e.message
        : 'Network error — is the server running on port 3001?';
      setUploadError(msg);
      return false;
    }
  };

  const reset = () => {
    // Tell the server to kill the engine subprocess if one is still running (e.g. the
    // user hit "Cancel Analysis" mid-run) — clearing local state alone left it running.
    fetch('/api/stop', { method: 'POST' }).catch(() => { /* ignore — best effort */ });

    // Clear session flag — isDone stays false even when idle poll finds old server state
    sessionRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setProc(null);
    setEvents([]);
    setUploadError(null);
    procRef.current = null;
    // Resume idle polling — sessionRef=false guarantees old results won't reappear
    timerRef.current = setTimeout(poll, POLL_IDLE);
  };

  return { proc, events, isProcessing, isDone, uploadError, onStart, reset };
}
