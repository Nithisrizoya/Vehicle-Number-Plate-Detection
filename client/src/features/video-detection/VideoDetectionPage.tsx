import { useRef, useState, useEffect } from 'react';
import {
  Upload, Film, Play, CheckCircle, AlertTriangle,
  FileVideo, Download, RefreshCw, AlertCircle, Repeat2,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { SnapshotModal } from '@/shared/components/SnapshotModal';
import { bestPerSighting } from '@/shared/lib/dedupe';
import { useVideoDetection } from './useVideoDetection';
import { ProcessingCard } from './ProcessingCard';
import { ResultStats } from './ResultStats';
import { EventsTable } from './EventsTable';

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoDetectionPage() {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const [drag,     setDrag]     = useState(false);
  const [elapsed,  setElapsed]  = useState(0);
  const [starting, setStarting] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { proc, events, isProcessing, isDone, uploadError, onStart, reset } = useVideoDetection();
  const [videoError, setVideoError] = useState(false);

  const handleFile = (f: File) => {
    if (f.type.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(f.name)) setFile(f);
  };

  const startProcessing = async () => {
    if (!file || starting) return;
    setStarting(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    const ok = await onStart(file);
    setStarting(false);
    if (!ok && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleReset = () => {
    setFile(null);
    setElapsed(0);
    setStarting(false);
    setSnapshot(null);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    reset();
  };

  // Stop elapsed timer when done
  useEffect(() => {
    if (isDone && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [isDone]);

  // Reset video error state whenever output video changes
  useEffect(() => { setVideoError(false); }, [proc?.outputVideo]);

  // The engine can log more than one OCR read per car as its confidence refines —
  // only show the best read per car, not every raw attempt.
  const displayEvents = bestPerSighting(events);
  const returningCount = displayEvents.filter(e => e.event === 'IN' && (e.visit_number ?? 1) > 1).length;

  return (
    <div className="space-y-4">

      {snapshot && <SnapshotModal src={snapshot} onClose={() => setSnapshot(null)} />}

      {/* ── Upload ──────────────────────────────────────────────────────── */}
      {!isProcessing && !isDone && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-glow-sky">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-sm">Upload Video for Plate Detection</h2>
              <p className="text-slate-400 text-xs mt-0.5">MP4 · AVI · MOV · MKV · WEBM · Max 4 GB</p>
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-xs font-medium">{uploadError}</p>
            </div>
          )}

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
              ${drag ? 'border-sky-400 bg-sky-50 scale-[1.01]' : file ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/40'}`}>
            <input ref={inputRef} type="file" accept="video/*,.mp4,.avi,.mov,.mkv,.webm" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <>
                <div className="p-3 rounded-xl bg-emerald-100"><FileVideo className="w-7 h-7 text-emerald-600" /></div>
                <div className="text-center">
                  <p className="text-emerald-800 font-bold text-sm">{file.name}</p>
                  <p className="text-emerald-600 text-xs mt-0.5">{(file.size / 1_048_576).toFixed(1)} MB · Click to change</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-200"><Upload className="w-7 h-7 text-slate-500" /></div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold text-sm">Drop video here or click to browse</p>
                  <p className="text-slate-400 text-xs mt-0.5">MP4 · AVI · MOV · MKV · WEBM</p>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={startProcessing} disabled={!file || starting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-sky-200">
              {starting
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Uploading…</>
                : <><Play className="w-3.5 h-3.5" />Run Analysis</>}
            </button>
          </div>
        </Card>
      )}

      {/* ── Loading card ────────────────────────────────────────────────── */}
      {isProcessing && (
        <ProcessingCard
          filename={proc?.filename || file?.name || ''}
          elapsed={elapsed}
          onCancel={handleReset}
        />
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {isDone && (
        <>
          <div className={`rounded-xl border-l-4 px-4 py-3 flex flex-wrap items-center gap-3 ${displayEvents.length > 0 ? 'bg-sky-50 border-sky-500' : 'bg-emerald-50 border-emerald-500'}`}>
            <div className={`p-2 rounded-lg ${displayEvents.length > 0 ? 'bg-sky-100' : 'bg-emerald-100'}`}>
              {displayEvents.length > 0
                ? <AlertTriangle className="w-4 h-4 text-sky-600" />
                : <CheckCircle className="w-4 h-4 text-emerald-600" />}
            </div>
            <div>
              <p className={`font-bold text-sm ${displayEvents.length > 0 ? 'text-sky-800' : 'text-emerald-800'}`}>
                {displayEvents.length > 0
                  ? `${displayEvents.length} Event${displayEvents.length > 1 ? 's' : ''} Detected`
                  : 'No Plates Detected'}
              </p>
              <p className={`text-xs ${displayEvents.length > 0 ? 'text-sky-600' : 'text-emerald-600'}`}>
                {proc?.filename} · {fmt(elapsed)}
              </p>
            </div>
            {returningCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold">
                <Repeat2 className="w-3 h-3" />{returningCount} returning vehicle{returningCount > 1 ? 's' : ''}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors">
                <RefreshCw className="w-3 h-3" />New Analysis
              </button>
              {proc?.outputVideo && (
                <a href={`/api/video/${proc.outputVideo}`} download={proc.outputVideo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors">
                  <Download className="w-3 h-3" />Download Video
                </a>
              )}
            </div>
          </div>

          <ResultStats events={displayEvents} platesSeen={proc?.plates_seen ?? 0} />

          {proc?.outputVideo && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-slate-500" />
                  <h3 className="text-slate-700 font-semibold text-sm">Annotated Output</h3>
                </div>
                {videoError && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    Browser cannot decode this format — download to play
                  </span>
                )}
              </div>
              <div className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '480px' }}>
                {!videoError ? (
                  <video key={proc.outputVideo} controls
                    className="w-full h-full"
                    style={{ objectFit: 'contain', display: 'block' }}
                    onError={() => setVideoError(true)}>
                    <source src={`/api/video/${proc.outputVideo}`} type="video/mp4" />
                  </video>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-full bg-slate-800">
                      <Film className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm text-center max-w-xs">
                      This video format cannot play in the browser.<br />
                      Download it and open with VLC or Windows Media Player.
                    </p>
                    <a href={`/api/video/${proc.outputVideo}`} download={proc.outputVideo}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors">
                      <Download className="w-4 h-4" />Download Annotated Video
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          {displayEvents.length > 0 ? (
            <EventsTable events={displayEvents} onViewSnapshot={setSnapshot} />
          ) : (
            <Card className="p-8 flex flex-col items-center gap-3 text-center">
              <div className="p-4 rounded-full bg-emerald-100"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
              <p className="text-emerald-800 font-bold">No Plates Detected</p>
              <p className="text-slate-400 text-sm max-w-sm">No readable plates were found in this footage.</p>
            </Card>
          )}
        </>
      )}

      {!isProcessing && !isDone && !file && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-8 flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-100"><Film className="w-6 h-6 text-slate-400" /></div>
          <p className="text-slate-500 text-sm font-semibold">No video selected yet</p>
          <p className="text-slate-400 text-xs max-w-xs">Upload a recorded video to run automated plate detection.</p>
        </div>
      )}
    </div>
  );
}
