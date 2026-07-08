import { cn } from '@/shared/lib/utils';

interface MetricRowProps { label: string; value: React.ReactNode; className?: string; subtle?: boolean; }

export function MetricRow({ label, value, className, subtle = false }: MetricRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0', className)}>
      <span className={cn('text-xs', subtle ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
      <span className="text-xs font-semibold text-slate-900">{value}</span>
    </div>
  );
}
