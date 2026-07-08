import { CarFront } from 'lucide-react';

export function Footer() {
  return (
    <footer className="flex items-center justify-between px-6 py-2 bg-white border-t border-slate-200 flex-shrink-0">
      <div className="flex items-center gap-2 text-slate-400">
        <CarFront className="w-3 h-3" />
        <span className="text-[10px]">Vehicle Plate Gate Platform v1.0</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-slate-400">AI-Powered Plate Detection</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-600 text-[10px] font-medium">Live</span>
        </div>
      </div>
    </footer>
  );
}
