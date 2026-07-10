import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a gate visit's dwell time as "1h 4m" / "4m 12s" / "38s". */
export function formatDuration(seconds?: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Best-effort CSS colour for a free-text colour word the vision model returns
// (e.g. "black", "silver") — an approximate swatch dot, not exact paint matching.
const COLOUR_SWATCHES: Record<string, string> = {
  black: '#1c1c1e', white: '#f4f4f5', silver: '#c7c9cc', gray: '#8b8d92', grey: '#8b8d92',
  red: '#dc2626', blue: '#2563eb', green: '#16a34a', yellow: '#eab308', orange: '#ea580c',
  brown: '#78350f', beige: '#e5d3b3', gold: '#ca8a04', maroon: '#7f1d1d', purple: '#7c3aed',
  pink: '#ec4899', navy: '#1e3a5f', teal: '#0d9488', cream: '#f5f0dc', bronze: '#8c6b3f',
};

export function colourSwatch(colour?: string | null): string {
  if (!colour) return '#cbd5e1';
  const key = colour.trim().toLowerCase();
  return COLOUR_SWATCHES[key] ?? '#cbd5e1';
}
