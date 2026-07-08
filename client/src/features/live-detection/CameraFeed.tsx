import { useState, useEffect, useRef } from 'react';
import { Camera, Wifi, AlertCircle } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';

interface Props {
  detectionActive?: boolean;
  onStop?: () => void;
}

// ── Live frame preview — sequential polling, no concurrent requests ───────────
function LiveFrameStream() {
  const [imgSrc,   setImgSrc]   = useState('');
  const [hasFrame, setHasFrame] = useState(false);
  const activeRef  = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    const loadNext = () => {
      if (!activeRef.current) return;
      const ts  = Date.now();
      const url = `/api/preview?t=${ts}`;
      const img = new Image();
      img.onload = () => {
        if (!activeRef.current) return;
        setImgSrc(url);
        setHasFrame(true);
        setTimeout(loadNext, 280);        // ~3 fps — smooth without hammering server
      };
      img.onerror = () => {
        if (!activeRef.current) return;
        setTimeout(loadNext, 600);        // back off on error
      };
      img.src = url;
    };

    loadNext();
    return () => { activeRef.current = false; };
  }, []);

  return (
    <div className="relative w-full bg-slate-950" style={{ aspectRatio: '16/9' }}>
      {hasFrame ? (
        <img src={imgSrc} alt="Live detection" className="w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500/40 border-t-sky-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Starting detection…</p>
          <p className="text-slate-600 text-xs">Waiting for first frame</p>
        </div>
      )}
      {hasFrame && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-red-400/80 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-red-400/80 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-red-400/80 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-red-400/80 rounded-br" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-red-500/50">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-[11px] font-bold tracking-widest">LIVE DETECTION</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Browser webcam preview ─────────────────────────────────────────────────
function BrowserCam() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'requesting' | 'active' | 'denied'>('requesting');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('active');
        }
      })
      .catch(() => { if (!cancelled) setStatus('denied'); });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;   // release immediately
    };
  }, []);

  return (
    <div className="relative bg-slate-900" style={{ aspectRatio: '16/9' }}>
      <video ref={videoRef} autoPlay playsInline muted
        className={`w-full h-full object-cover ${status !== 'active' ? 'hidden' : ''}`} />

      {status === 'requesting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Wifi className="w-8 h-8 text-slate-500 animate-pulse" />
          <p className="text-slate-400 text-sm">Requesting camera access…</p>
        </div>
      )}
      {status === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-full bg-slate-800 border border-slate-700">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 text-sm font-semibold">Start the Live Camera</p>
            <p className="text-slate-500 text-xs mt-1">Allow camera permissions to preview</p>
          </div>
        </div>
      )}
      {status === 'active' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-sky-400/50 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-sky-400/50 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-sky-400/50 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-sky-400/50 rounded-br" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-slate-300 text-[10px]">
            Preview — click Start Detection to begin
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CameraFeed({ detectionActive = false }: Props) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-200 text-xs font-semibold">Shop Entrance — CAM-01</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {detectionActive ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold tracking-widest">AI ACTIVE</span>
            </div>
          ) : (
            <span className="text-slate-500">PREVIEW</span>
          )}
        </div>
      </div>

      {/* Use key to force full remount when switching mode — no stale stream */}
      {detectionActive
        ? <LiveFrameStream key="live" />
        : <BrowserCam key="preview" />}

      <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/90 border-t border-slate-700/40 text-xs">
        {detectionActive ? (
          <>
            <span className="text-slate-500">Status: <span className="text-emerald-400">Detection Active</span></span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-500">Live preview ~3 fps</span>
          </>
        ) : (
          <span className="text-slate-500">Idle — click Start Detection to begin</span>
        )}
      </div>
    </Card>
  );
}
