import { useState } from 'react';
import { Play, StopCircle, Radio, ShieldCheck, AlertCircle } from 'lucide-react';
import { CameraFeed } from './CameraFeed';
import { LiveStatistics } from './LiveStatistics';
import { DetectionLog } from './DetectionLog';
import { AlertPanel } from './AlertPanel';
import { useLiveDetection } from './useLiveDetection';
import { Card } from '@/shared/components/ui/Card';
import { SnapshotModal } from '@/shared/components/SnapshotModal';
import { bestPerSighting } from '@/shared/lib/dedupe';

export function LiveDetectionPage() {
  const [starting, setStarting] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const { events: rawEvents, isRunning, error, start, stop } = useLiveDetection();

  // Only show the best-confidence read per car, not every raw OCR attempt.
  const events = bestPerSighting(rawEvents);

  const handleStart = async () => {
    setStarting(true);
    await start();
    setStarting(false);
  };

  return (
    <div className="space-y-4">

      {snapshot && <SnapshotModal src={snapshot} onClose={() => setSnapshot(null)} />}

      {/* Control bar */}
      <Card className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className={`text-sm font-bold tracking-widest ${isRunning ? 'text-red-500' : 'text-slate-400'}`}>
              {isRunning ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />
          <span className="text-slate-500 text-sm font-medium">Shop Entrance Camera</span>

          <div className="flex-1" />

          {!isRunning ? (
            <button onClick={handleStart} disabled={starting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-md shadow-sky-200">
              {starting
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Starting…</>
                : <><Play className="w-3.5 h-3.5" />Start Detection</>}
            </button>
          ) : (
            <button onClick={stop}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-md shadow-red-200">
              <StopCircle className="w-3.5 h-3.5" />Stop Detection
            </button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <LiveStatistics events={events} isRunning={isRunning} />

      {/* Camera + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <CameraFeed detectionActive={isRunning} />
        </div>
        <AlertPanel events={events} onViewSnapshot={setSnapshot} />
      </div>

      {/* Detection log */}
      <DetectionLog events={events} onViewSnapshot={setSnapshot} />

      {/* Idle hint */}
      {!isRunning && !error && (
        <Card className="px-4 py-3 border border-sky-200 bg-sky-50/60 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-sky-100 flex-shrink-0 mt-0.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-sky-700 text-xs leading-relaxed">
            Click <strong>Start Detection</strong> to open the shop entrance camera and run real-time plate detection. Entries and exits appear instantly with snapshot evidence, and returning vehicles are flagged automatically.
          </p>
          <div className="p-1.5 rounded-lg bg-sky-100 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          </div>
        </Card>
      )}

    </div>
  );
}
