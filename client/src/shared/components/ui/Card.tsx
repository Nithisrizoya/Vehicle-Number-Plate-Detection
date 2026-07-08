import { cn } from '@/shared/lib/utils';

interface CardProps { children: React.ReactNode; className?: string; hover?: boolean; }

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-sky-100 shadow-card', hover && 'transition-all duration-200 hover:shadow-card-md hover:border-sky-200 hover:-translate-y-px', className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps { children?: React.ReactNode; className?: string; action?: React.ReactNode; title?: string; subtitle?: string; }

export function CardHeader({ children, className, action, title, subtitle }: CardHeaderProps) {
  if (title) {
    return (
      <div className={cn('px-5 py-4 border-b border-slate-100 flex items-start justify-between', className)}>
        <div>
          <h3 className="text-slate-900 font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    );
  }
  return <div className={cn('px-5 py-4 border-b border-slate-100', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
