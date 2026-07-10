import { colourSwatch } from '@/shared/lib/utils';

interface Props { colour?: string | null; }

/** Shows the AI-predicted vehicle colour with a matching swatch dot. Renders
 * a placeholder dash while classification is still pending/unavailable. */
export function ColourCell({ colour }: Props) {
  if (!colour) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full border border-slate-300 flex-shrink-0"
        style={{ backgroundColor: colourSwatch(colour) }}
      />
      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{colour}</span>
    </div>
  );
}
