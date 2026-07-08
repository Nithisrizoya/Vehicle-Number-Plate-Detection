import { Repeat2, Car } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import type { RepeatVehicle } from '@/shared/types';

const RANK_COLORS = ['bg-violet-600', 'bg-violet-500', 'bg-violet-400', 'bg-slate-400', 'bg-slate-300', 'bg-slate-300'];

export function RepeatVehicles({ data }: { data: RepeatVehicle[] }) {
  const maxVisits = Math.max(1, ...data.map(d => d.visits));

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-slate-900 font-semibold text-sm">Top Repeat Vehicles</h3>
          <p className="text-slate-400 text-xs mt-0.5">Customers who've visited more than once</p>
        </div>
        <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg">
          <Repeat2 className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-xs font-semibold text-violet-700">{data.length}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="p-3 rounded-full bg-slate-100"><Car className="w-5 h-5 text-slate-400" /></div>
          <p className="text-slate-400 text-xs">No repeat visitors recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((v, i) => (
            <div key={v.plate} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${RANK_COLORS[i] ?? 'bg-slate-300'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <PlateBadge plate={v.plate} />
                  <span className="text-violet-600 text-xs font-bold tabular-nums flex-shrink-0">{v.visits}×</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${(v.visits / maxVisits) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
