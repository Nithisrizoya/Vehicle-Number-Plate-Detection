import { Eye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  time?: string;
  snapshot?: string;
  icon: LucideIcon;
  iconColor: string;
  onViewSnapshot?: (src: string) => void;
}

/** Renders a gate crossing's time plus its snapshot button, used for the
 * In Time / Out Time columns of visit tables. */
export function GateTimeCell({ time, snapshot, icon: Icon, iconColor, onViewSnapshot }: Props) {
  if (!time) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-slate-600 tabular-nums whitespace-nowrap">{time}</span>
        {snapshot && onViewSnapshot && (
          <button
            onClick={() => onViewSnapshot(`/snapshots/${snapshot}`)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-semibold transition-colors">
            <Eye className="w-2.5 h-2.5" />View
          </button>
        )}
      </div>
    </div>
  );
}
