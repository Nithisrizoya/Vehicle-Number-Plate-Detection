import { cn } from '@/shared/lib/utils';

type BarColor = 'blue' | 'green' | 'amber' | 'red' | 'violet';
type BarSize  = 'xs' | 'sm' | 'md';

interface ProgressBarProps { value: number; max?: number; color?: BarColor; size?: BarSize; showLabel?: boolean; className?: string; }

const colorMap: Record<BarColor, string> = {
  blue: 'bg-sky-600', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', violet: 'bg-violet-500',
};
const sizeMap: Record<BarSize, string> = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' };

export function ProgressBar({ value, max = 100, color = 'blue', size = 'sm', showLabel = false, className }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{value}%</span><span>{max}%</span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', sizeMap[size])}>
        <div className={cn(colorMap[color], sizeMap[size], 'rounded-full transition-all duration-700 ease-out')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
