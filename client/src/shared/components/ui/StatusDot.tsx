import { cn } from '@/shared/lib/utils';

type DotStatus = 'online' | 'offline' | 'warning' | 'running' | 'live';
interface StatusDotProps { status: DotStatus; pulse?: boolean; size?: 'sm' | 'md'; }

const colorMap: Record<DotStatus, string> = {
  online: 'bg-emerald-500', offline: 'bg-slate-400', warning: 'bg-amber-500', running: 'bg-sky-500', live: 'bg-red-500',
};

export function StatusDot({ status, pulse = false, size = 'sm' }: StatusDotProps) {
  const dim = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return (
    <span className="relative inline-flex items-center justify-center">
      {pulse && <span className={cn('absolute inline-flex rounded-full opacity-60 animate-ping', colorMap[status], dim)} />}
      <span className={cn('inline-flex rounded-full', colorMap[status], dim)} />
    </span>
  );
}
