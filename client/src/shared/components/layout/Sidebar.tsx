import { LayoutDashboard, Radio, Film, ChevronLeft, ChevronRight, CarFront } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Page } from '@/shared/types';

interface Props {
  current: Page;
  onChange: (p: Page) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { page: 'dashboard',       label: 'Dashboard',       icon: LayoutDashboard, desc: 'Overview & analytics' },
  { page: 'live-detection',  label: 'Live Detection',  icon: Radio,           desc: 'Real-time camera monitoring' },
  { page: 'video-detection', label: 'Video Detection', icon: Film,            desc: 'Upload & analyse footage' },
];

export function Sidebar({ current, onChange, collapsed = false, onToggle }: Props) {
  return (
    <aside className={cn('flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out flex-shrink-0', collapsed ? 'w-16' : 'w-60')}>
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-slate-700/50', collapsed && 'justify-center px-2')}>
        <img
          src="/gwc_logo.png"
          alt="GWC"
          className={cn('flex-shrink-0 object-contain', collapsed ? 'w-8 h-8' : 'h-9 w-auto max-w-[110px]')}
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Plate Gate Monitor</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Vehicle Gate Intelligence</p>
          </div>
        )}
      </div>

      {/* Status pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-700/40">
          <CarFront className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-400 text-[10px] font-medium">System Operational</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}

      {/* Nav section label */}
      {!collapsed && (
        <p className="px-4 pt-4 pb-1 text-slate-600 text-[9px] font-semibold uppercase tracking-widest">Navigation</p>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 pt-1 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = current === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onChange(item.page)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group',
                active
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-glow-sky'
                  : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-100',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-150', !active && 'group-hover:scale-110')} />
              {!collapsed && (
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', active ? 'text-white' : 'text-slate-200')}>{item.label}</p>
                  <p className={cn('text-[9px] truncate', active ? 'text-sky-200' : 'text-slate-500')}>{item.desc}</p>
                </div>
              )}
              {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-slate-700/50">
        <button
          onClick={onToggle}
          className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-700/60 hover:text-slate-300 transition-all text-xs', collapsed && 'justify-center')}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
