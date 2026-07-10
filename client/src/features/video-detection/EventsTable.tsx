import { Activity, LogIn, LogOut } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import { GateTimeCell } from '@/shared/components/ui/GateTimeCell';
import { BrandCell } from '@/shared/components/ui/BrandCell';
import { ColourCell } from '@/shared/components/ui/ColourCell';
import { groupVisits } from '@/shared/lib/dedupe';
import { formatDuration } from '@/shared/lib/utils';
import type { PlateEvent } from '@/shared/types';

interface Props { events: PlateEvent[]; onViewSnapshot: (src: string) => void; }

const HEADERS = ['#', 'Plate Number', 'Brand', 'Colour', 'In Time', 'Out Time', 'Duration'];

export function EventsTable({ events, onViewSnapshot }: Props) {
  const rows = groupVisits(events, e => e.visit_number);

  return (
    <Card>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-500" />
          <h3 className="text-slate-700 font-semibold text-sm">Detected Events</h3>
        </div>
        <Badge variant="info">{rows.length} vehicle{rows.length !== 1 ? 's' : ''}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>{HEADERS.map(h =>
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => {
              const brand  = row.inEvent?.brand  ?? row.outEvent?.brand  ?? null;
              const colour = row.inEvent?.colour ?? row.outEvent?.colour ?? null;
              return (
                <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5"><PlateBadge plate={row.plate} /></td>
                  <td className="px-4 py-2.5"><BrandCell brand={brand} /></td>
                  <td className="px-4 py-2.5"><ColourCell colour={colour} /></td>
                  <td className="px-4 py-2.5">
                    <GateTimeCell time={row.inEvent?.time} snapshot={row.inEvent?.snapshot} icon={LogIn} iconColor="text-emerald-500" onViewSnapshot={onViewSnapshot} />
                  </td>
                  <td className="px-4 py-2.5">
                    <GateTimeCell time={row.outEvent?.time} snapshot={row.outEvent?.snapshot} icon={LogOut} iconColor="text-orange-500" onViewSnapshot={onViewSnapshot} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {formatDuration(row.outEvent?.duration_seconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
