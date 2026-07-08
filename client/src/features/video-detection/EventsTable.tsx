import { Activity, Eye, Repeat2, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import type { PlateEvent } from '@/shared/types';

interface Props { events: PlateEvent[]; onViewSnapshot: (src: string) => void; }

function VisitBadge({ event }: { event: PlateEvent }) {
  const visit = event.visit_number ?? 1;
  if (event.event !== 'IN') return <span className="text-slate-300 text-xs">—</span>;
  return visit > 1 ? (
    <Badge variant="purple" className="gap-1"><Repeat2 className="w-3 h-3" />Returning · Visit #{visit}</Badge>
  ) : (
    <Badge variant="info" className="gap-1"><Sparkles className="w-3 h-3" />New Vehicle</Badge>
  );
}

export function EventsTable({ events, onViewSnapshot }: Props) {
  return (
    <Card>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-500" />
          <h3 className="text-slate-700 font-semibold text-sm">Detected Events</h3>
        </div>
        <Badge variant="info">{events.length} events</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{['Time', 'Plate Number', 'Event', 'Visitor', 'Snapshot'].map(h =>
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-2.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">{e.time}</td>
                <td className="px-4 py-2.5"><PlateBadge plate={e.plate} /></td>
                <td className="px-4 py-2.5"><Badge variant={e.event === 'IN' ? 'success' : 'info'}>{e.event}</Badge></td>
                <td className="px-4 py-2.5 whitespace-nowrap"><VisitBadge event={e} /></td>
                <td className="px-4 py-2.5">
                  {e.snapshot ? (
                    <button onClick={() => onViewSnapshot(`/snapshots/${e.snapshot}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-semibold transition-colors">
                      <Eye className="w-3 h-3" />View
                    </button>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
