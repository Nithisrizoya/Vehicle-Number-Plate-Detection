import { cn } from '@/shared/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
interface BadgeProps { variant?: BadgeVariant; children: React.ReactNode; className?: string; }

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  info:    'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  purple:  'bg-violet-50 text-violet-700 border-violet-200',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}
