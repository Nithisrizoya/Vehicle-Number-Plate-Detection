import { Gauge, Target, Camera, ClipboardCheck } from 'lucide-react';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';

const METRICS = [
  { label: 'Avg Detection Latency', value: '180ms', pct: 92,  icon: Gauge,          iconBg: 'bg-sky-50',    iconColor: 'text-sky-600',    barColor: 'blue'   as const, sub: 'Per-frame inference time' },
  { label: 'Avg OCR Confidence',    value: '91%',   pct: 91,  icon: Target,         iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', barColor: 'green'  as const, sub: 'Across all read plates' },
  { label: 'Detection Sources',     value: '2',     pct: 100, icon: Camera,         iconBg: 'bg-violet-50',  iconColor: 'text-violet-600',  barColor: 'violet' as const, sub: 'Webcam + video upload' },
  { label: 'Engine Uptime',         value: '99.8%', pct: 99,  icon: ClipboardCheck, iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   barColor: 'amber'  as const, sub: 'Above 99% target' },
];

export function OperationalMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {METRICS.map(m => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 hover:shadow-card-md hover:border-sky-200 transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${m.iconBg}`}><Icon className={`w-4 h-4 ${m.iconColor}`} /></div>
              <p className="text-slate-600 text-xs font-semibold leading-tight">{m.label}</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{m.value}</p>
            <div className="mt-3 space-y-1.5">
              <ProgressBar value={m.pct} color={m.barColor} size="xs" />
              <p className="text-slate-400 text-[10px]">{m.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
