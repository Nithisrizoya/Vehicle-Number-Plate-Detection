import { cn } from '@/shared/lib/utils';

interface Props { plate: string; className?: string; size?: 'sm' | 'md'; }

/** Renders a plate number styled like a real license plate — white background,
 * bold black border, corner bolts, monospace uppercase letters. */
export function PlateBadge({ plate, className, size = 'sm' }: Props) {
  return (
    <span className={cn(
      'relative inline-flex items-center justify-center rounded-[3px] border-2 border-slate-900',
      'bg-gradient-to-b from-white to-slate-100 font-mono font-extrabold tracking-widest text-slate-900 shadow-sm',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm',
      className,
    )}>
      <span className="absolute left-0.5 top-0.5 w-[3px] h-[3px] rounded-full bg-slate-400" />
      <span className="absolute right-0.5 top-0.5 w-[3px] h-[3px] rounded-full bg-slate-400" />
      <span className="absolute left-0.5 bottom-0.5 w-[3px] h-[3px] rounded-full bg-slate-400" />
      <span className="absolute right-0.5 bottom-0.5 w-[3px] h-[3px] rounded-full bg-slate-400" />
      {plate}
    </span>
  );
}
