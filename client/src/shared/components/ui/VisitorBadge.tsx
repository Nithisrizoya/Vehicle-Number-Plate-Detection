import { Repeat2, Sparkles } from 'lucide-react';
import { Badge } from './Badge';

interface Props { visitNumber: number; hasIn: boolean; }

/** New vs returning visitor badge for a grouped visit row. A row with no IN
 * event yet on record (an OUT-only orphan) has no visitor status to show. */
export function VisitorBadge({ visitNumber, hasIn }: Props) {
  if (!hasIn) return <span className="text-slate-300 text-xs">—</span>;
  return visitNumber > 1 ? (
    <Badge variant="purple" className="gap-1"><Repeat2 className="w-3 h-3" />Returning · Visit #{visitNumber}</Badge>
  ) : (
    <Badge variant="info" className="gap-1"><Sparkles className="w-3 h-3" />New Vehicle</Badge>
  );
}
