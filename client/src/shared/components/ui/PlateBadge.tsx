import { cn } from '@/shared/lib/utils';

interface Props { plate: string; className?: string; size?: 'sm' | 'md'; }

/** Renders a plate number as plain text. */
export function PlateBadge({ plate, className, size = 'sm' }: Props) {
  return (
    <span className={cn(
      'font-mono font-semibold tracking-wide text-slate-800',
      size === 'sm' ? 'text-xs' : 'text-sm',
      className,
    )}>
      {plate}
    </span>
  );
}
