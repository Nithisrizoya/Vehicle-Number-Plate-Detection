import { Bell, LogIn, LogOut, CheckCircle, Clock, X, Eye } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { PlateBadge } from '@/shared/components/ui/PlateBadge';
import type { PlateEvent } from '@/shared/types';

interface Props {
  events: PlateEvent[];
  onViewSnapshot?: (src: string) => void;
}

export function AlertPanel({ events, onViewSnapshot }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const recent = events
    .filter(e => !dismissed.has(e.id))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const dismiss    = (id: string) => setDismissed(prev => new Set([...prev, id]));
  const dismissAll = () => setDismissed(new Set(events.map(e => e.id)));

  const entryCount = events.filter(e => e.event === 'IN').length;

  return (
    <Card className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative p-1.5 rounded-lg bg-sky-50">
            <Bell className="w-3.5 h-3.5 text-sky-500" />
            {recent.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                {recent.length > 9 ? '9+' : recent.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-slate-700 font-semibold text-sm">Alert Panel</h3>
            <p className="text-slate-400 text-[10px]">{entryCount} entr{entryCount !== 1 ? 'ies' : 'y'} recorded</p>
          </div>
        </div>
        {recent.length > 0 && (
          <button onClick={dismissAll} className="text-slate-400 hover:text-slate-600 text-[10px] underline transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Alerts */}
      <div className="flex-1 overflow-y-auto max-h-64 divide-y divide-slate-100">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="p-3 rounded-full bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-emerald-700 text-sm font-semibold">No Active Alerts</p>
            <p className="text-slate-400 text-xs">No gate activity yet</p>
          </div>
        ) : (
          recent.map(e => {
            const isIn = e.event === 'IN';
            return (
              <div key={e.id}
                className={`relative flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${isIn ? 'border-l-2 border-emerald-500' : 'border-l-2 border-orange-400'}`}>
                <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${isIn ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                  {isIn ? <LogIn className="w-3 h-3 text-emerald-500" /> : <LogOut className="w-3 h-3 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2">
                      <PlateBadge plate={e.plate} />
                      <span className={`text-xs font-semibold ${isIn ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {isIn ? 'Entry' : 'Exit'}
                      </span>
                    </div>
                    <button onClick={() => dismiss(e.id)} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {isIn && (e.visit_number ?? 1) > 1 && (
                    <p className="text-violet-600 text-[10px] font-medium">Returning vehicle · Visit #{e.visit_number}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[10px] tabular-nums">{e.time}</span>
                    </div>
                    {e.snapshot && onViewSnapshot && (
                      <button
                        onClick={() => onViewSnapshot(`/snapshots/${e.snapshot}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-semibold transition-colors">
                        <Eye className="w-2.5 h-2.5" />View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {events.length > 5 && (
        <div className="px-4 py-2 border-t border-slate-100">
          <span className="text-slate-400 text-[10px]">+{events.length - 5} more in detection log</span>
        </div>
      )}
    </Card>
  );
}
