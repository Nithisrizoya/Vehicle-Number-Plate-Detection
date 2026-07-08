import { Activity, Clock, Eye, Repeat2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import type { RecentActivityRow } from '@/shared/types';

interface Props { rows: RecentActivityRow[]; onViewSnapshot?: (src: string) => void; }

export function RecentActivity({ rows, onViewSnapshot }: Props) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50"><Activity className="w-4 h-4 text-sky-600" /></div>
          <div><h3 className="text-slate-900 font-semibold text-sm">Recent Activity</h3><p className="text-slate-400 text-xs">Latest entries &amp; exits</p></div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" /><span className="text-xs">Last updated just now</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Time', 'Plate', 'Event', 'Visitor', 'Snapshot'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">No activity recorded yet</td></tr>
            ) : rows.map(row => {
              const isReturning = row.event === 'IN' && (row.visitNumber ?? 1) > 1;
              return (
                <tr key={row.id} className="transition-colors duration-100 hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium tabular-nums whitespace-nowrap">{row.time}</td>
                  <td className="px-5 py-3.5"><PlateBadge plate={row.plate} /></td>
                  <td className="px-5 py-3.5"><Badge variant={row.event === 'IN' ? 'success' : 'info'}>{row.event}</Badge></td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {row.event === 'IN' ? (
                      isReturning ? (
                        <Badge variant="purple" className="gap-1"><Repeat2 className="w-3 h-3" />Returning</Badge>
                      ) : (
                        <Badge variant="neutral">New</Badge>
                      )
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {row.snapshot && onViewSnapshot ? (
                      <button onClick={() => onViewSnapshot(`/snapshots/${row.snapshot}`)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-semibold transition-colors">
                        <Eye className="w-3 h-3" />View
                      </button>
                    ) : <span className="text-slate-300 text-xs">—</span>}
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
