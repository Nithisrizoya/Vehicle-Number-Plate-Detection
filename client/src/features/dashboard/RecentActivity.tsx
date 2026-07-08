import { Activity, Clock, LogIn, LogOut } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import { GateTimeCell } from '@/shared/components/ui/GateTimeCell';
import { VisitorBadge } from '@/shared/components/ui/VisitorBadge';
import { groupVisits } from '@/shared/lib/dedupe';
import type { RecentActivityRow } from '@/shared/types';

interface Props { rows: RecentActivityRow[]; onViewSnapshot?: (src: string) => void; }

export function RecentActivity({ rows, onViewSnapshot }: Props) {
  const visits = groupVisits(rows, r => r.visitNumber);

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
              {['#', 'Plate', 'In Time', 'Out Time', 'Visitor'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visits.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">No activity recorded yet</td></tr>
            ) : visits.map((row, i) => (
              <tr key={row.key} className="transition-colors duration-100 hover:bg-slate-50/80">
                <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">{i + 1}</td>
                <td className="px-5 py-3.5"><PlateBadge plate={row.plate} /></td>
                <td className="px-5 py-3.5">
                  <GateTimeCell time={row.inEvent?.time} snapshot={row.inEvent?.snapshot} icon={LogIn} iconColor="text-emerald-500" onViewSnapshot={onViewSnapshot} />
                </td>
                <td className="px-5 py-3.5">
                  <GateTimeCell time={row.outEvent?.time} snapshot={row.outEvent?.snapshot} icon={LogOut} iconColor="text-orange-500" onViewSnapshot={onViewSnapshot} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap"><VisitorBadge visitNumber={row.visitNumber} hasIn={!!row.inEvent} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
