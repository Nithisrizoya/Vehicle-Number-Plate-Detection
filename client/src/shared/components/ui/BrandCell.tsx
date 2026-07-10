interface Props { brand?: string | null; }

/** Shows the AI-predicted vehicle brand. Renders a placeholder dash while
 * classification is still pending/unavailable. */
export function BrandCell({ brand }: Props) {
  if (!brand) return <span className="text-slate-300 text-xs">—</span>;
  return <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{brand}</span>;
}
