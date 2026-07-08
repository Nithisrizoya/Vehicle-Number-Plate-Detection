import { Activity, Clock, Car, Eye, Repeat2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import type { PlateEvent } from '@/shared/types';

interface Props {
  events: PlateEvent[];
  onViewSnapshot?: (src: string) => void;
}

export function DetectionLog({ events, onViewSnapshot }: Props) {
  const sorted = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <Card className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50">
            <Activity className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-slate-700 font-semibold text-sm">Live Detection Log</h3>
            <p className="text-slate-400 text-[10px]">Real-time entry &amp; exit events</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 text-[10px] font-semibold">Live</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto max-h-72 divide-y divide-slate-100">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="p-3 rounded-full bg-slate-100">
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No events yet</p>
            <p className="text-slate-400 text-xs">Start detection to see live events</p>
          </div>
        ) : (
          sorted.map((e, i) => {
            const isReturning = e.event === 'IN' && (e.visit_number ?? 1) > 1;
            return (
              <div key={`${e.id}-${i}`} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                {/* Plate icon */}
                <div className={`flex-shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-full ${isReturning ? 'bg-violet-100' : 'bg-slate-100'}`}>
                  <Car className={`w-3.5 h-3.5 ${isReturning ? 'text-violet-600' : 'text-slate-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: plate + time */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <PlateBadge plate={e.plate} />
                    <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[10px] tabular-nums">{e.time}</span>
                    </div>
                  </div>
                  {/* Row 2: event + visit badges */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    <Badge variant={e.event === 'IN' ? 'success' : 'info'} className="text-[10px] px-1.5 py-0.5">
                      {e.event}
                    </Badge>
                    {isReturning && (
                      <Badge variant="purple" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                        <Repeat2 className="w-2.5 h-2.5" />Visit #{e.visit_number}
                      </Badge>
                    )}
                  </div>
                  {/* Row 3: view snapshot */}
                  {e.snapshot && onViewSnapshot && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onViewSnapshot(`/snapshots/${e.snapshot}`)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-semibold transition-colors">
                        <Eye className="w-2.5 h-2.5" />View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-slate-400 text-[10px]">{sorted.length} event{sorted.length !== 1 ? 's' : ''} shown</span>
        <span className="text-slate-400 text-[10px]">{events.length} total detected</span>
      </div>
    </Card>
  );
}
