import { Bell, Search, Wifi } from 'lucide-react';
import { useDateTime } from '@/shared/hooks/useDateTime';
import type { Page } from '@/shared/types';

const PAGE_TITLES: Record<Page, { title: string; sub: string }> = {
  'dashboard':       { title: 'Dashboard Overview', sub: 'Real-time gate traffic metrics' },
  'live-detection':  { title: 'Live Detection',     sub: 'Camera-based AI plate monitoring' },
  'video-detection': { title: 'Video Detection',    sub: 'Upload and analyse recorded footage' },
};

interface Props { page: Page; }

export function Navbar({ page }: Props) {
  const { date, time } = useDateTime();
  const { title, sub } = PAGE_TITLES[page];

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
      <div>
        <h1 className="text-slate-900 font-bold text-lg leading-tight">{title}</h1>
        <p className="text-slate-400 text-xs">{sub}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <Wifi className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700 text-xs font-medium">All Systems Active</span>
        </div>

        {/* Date/time */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-slate-700 text-xs font-semibold tabular-nums">{time}</span>
          <span className="text-slate-400 text-[10px]">{date}</span>
        </div>

        {/* Search placeholder */}
        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        {/* Bell */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* Avatar + GWC logo */}
        <div className="flex items-center gap-3">
          <img src="/gwc_logo.png" alt="GWC" className="hidden sm:block h-8 w-auto object-contain" />
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-slate-700 text-xs font-semibold leading-none">Gate Admin</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Supervisor</p>
          </div>
        </div>
      </div>
    </header>
  );
}
