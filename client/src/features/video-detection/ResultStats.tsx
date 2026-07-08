import { Car, LogIn, LogOut, Repeat2 } from 'lucide-react';
import type { PlateEvent } from '@/shared/types';

interface Props { events: PlateEvent[]; platesSeen: number; }

export function ResultStats({ events, platesSeen }: Props) {
  const entries   = events.filter(e => e.event === 'IN').length;
  const exits     = events.filter(e => e.event === 'OUT').length;
  const returning = events.filter(e => e.event === 'IN' && (e.visit_number ?? 1) > 1).length;

  const tiles = [
    { label: 'Plates Detected',    value: platesSeen, icon: Car,     color: 'text-sky-600',    bg: 'bg-sky-50'    },
    { label: 'Entries',            value: entries,    icon: LogIn,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Exits',              value: exits,      icon: LogOut,  color: 'text-orange-600',  bg: 'bg-orange-50'  },
    { label: 'Returning Vehicles', value: returning,  icon: Repeat2, color: 'text-violet-600',  bg: 'bg-violet-50'  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-xl border border-sky-100 shadow-card p-4 flex items-center gap-3 hover:shadow-card-md hover:border-sky-200 transition-shadow">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
