import { useRef, useState, useEffect } from 'react';
import { Film, StopCircle } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props { filename: string; elapsed: number; onCancel: () => void; }

export function ProcessingCard({ filename, elapsed, onCancel }: Props) {
  const [progress, setProgress] = useState(0);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    const poll = async () => {
      if (!activeRef.current) return;
      try {
        const r = await fetch('/api/progress');
        if (r.ok && activeRef.current) {
          const d = await r.json();
          if (d.pct >= 0) setProgress(Math.min(100, d.pct));
        }
      } catch { /* ignore */ }
      if (activeRef.current) setTimeout(poll, 800);
    };
    poll();
    return () => { activeRef.current = false; };
  }, []);

  return (
    <Card className="p-8 flex flex-col items-center gap-5 text-center">
      {/* Spinner */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-6 h-6 text-sky-500" />
        </div>
      </div>

      <div>
        <p className="text-slate-800 font-bold text-base">Analysing Video</p>
        <p className="text-slate-400 text-sm mt-1 max-w-xs truncate">{filename}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500">
            {progress > 0 ? `${progress}% complete` : 'Initialising model…'}
          </span>
          <span className="text-slate-400 tabular-nums font-mono">{fmt(elapsed)}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(progress, 2))}%` }} />
        </div>
      </div>

      <p className="text-slate-400 text-[11px]">Plate Detection Analysis in progress…</p>

      <button onClick={onCancel}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 text-xs font-semibold transition-colors">
        <StopCircle className="w-3.5 h-3.5" />Cancel Analysis
      </button>
    </Card>
  );
}
