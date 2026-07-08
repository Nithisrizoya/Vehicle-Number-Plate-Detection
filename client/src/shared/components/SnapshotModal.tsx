import { X } from 'lucide-react';

interface Props { src: string; onClose: () => void; }

export function SnapshotModal({ src, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <img src={src} alt="Plate snapshot" className="w-full rounded-xl shadow-2xl border border-slate-200" />
      </div>
    </div>
  );
}
