import { Server, Clock, CheckCircle } from 'lucide-react';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';

const gc = (p: number): 'green' | 'amber' | 'red' => p < 65 ? 'green' : p < 85 ? 'amber' : 'red';

const METRICS = [
  { label: 'Detection Source',  val: 'Online',    sub: 'Webcam / video upload ready', pct: 100 },
  { label: 'Inference Engine',  val: 'Running',   sub: 'AI detection active',          pct: 100 },
  { label: 'Storage Usage',     val: '62%',       sub: '6.2 TB / 10 TB used',          pct: 62  },
  { label: 'Memory Usage',      val: '51%',       sub: '52 GB / 128 GB used',          pct: 51  },
  { label: 'Last Health Check', val: 'Just now',  sub: 'All checks passed',            pct: 100 },
];

export function SystemHealth() {
  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100"><Server className="w-4 h-4 text-slate-600" /></div>
          <div>
            <h3 className="text-slate-900 font-semibold text-sm">System Health</h3>
            <p className="text-slate-400 text-xs">Infrastructure overview</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700 text-[11px] font-semibold">All Systems Go</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {METRICS.map(item => (
          <div key={item.label} className="space-y-1.5">
            <p className="text-slate-500 text-[10px] font-semibold truncate">{item.label}</p>
            <p className="text-base font-bold text-slate-900 tabular-nums">{item.val}</p>
            <ProgressBar value={item.pct} color={gc(item.pct)} size="xs" />
            <p className="text-slate-400 text-[10px]">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-slate-400">
        <Clock className="w-3 h-3" /><span className="text-[10px]">Auto-refreshes every 30 s</span>
      </div>
    </div>
  );
}
