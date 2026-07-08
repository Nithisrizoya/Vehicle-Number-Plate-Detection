import type { GateEvent } from '@/shared/types';

/**
 * The engine can log more than one OCR read for the same physical car (its
 * reading can vary slightly between refreshes). Each read is tagged with a
 * sighting_id shared across all reads of that one car. For display, keep only
 * the highest-confidence read per sighting so the UI shows one clean entry per
 * car instead of every raw attempt — the backend still keeps all of them.
 */
export function bestPerSighting<T extends { sighting_id?: string; confidence?: number }>(items: T[]): T[] {
  const bySighting = new Map<string, T>();
  const ungrouped: T[] = [];

  for (const item of items) {
    if (!item.sighting_id) {
      ungrouped.push(item);
      continue;
    }
    const existing = bySighting.get(item.sighting_id);
    if (!existing || (item.confidence ?? 0) > (existing.confidence ?? 0)) {
      bySighting.set(item.sighting_id, item);
    }
  }

  return [...bySighting.values(), ...ungrouped];
}

export interface VisitRow<T> {
  key: string;
  plate: string;
  visitNumber: number;
  inEvent?: T;
  outEvent?: T;
}

/**
 * Pairs each IN event with the OUT event that closed it so the UI can show
 * one row per visit instead of one row per gate crossing. Pairing key is
 * plate + visit number (the engine assigns the same visit number to an IN
 * and the OUT that later closes it). Input order is preserved — both event
 * feeds already come back most-recent-first, so that ordering carries
 * straight through to the grouped rows.
 */
export function groupVisits<T extends { plate: string; event: GateEvent }>(
  items: T[],
  getVisitNumber: (item: T) => number | undefined,
): VisitRow<T>[] {
  const rows = new Map<string, VisitRow<T>>();
  let fallback = 0;

  for (const item of items) {
    const visitNumber = getVisitNumber(item) ?? ++fallback;
    const key = `${item.plate}::${visitNumber}`;
    let row = rows.get(key);
    if (!row) {
      row = { key, plate: item.plate, visitNumber };
      rows.set(key, row);
    }
    if (item.event === 'IN') row.inEvent = item;
    else row.outEvent = item;
  }

  return [...rows.values()];
}
