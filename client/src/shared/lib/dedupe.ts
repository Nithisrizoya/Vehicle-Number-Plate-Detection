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
