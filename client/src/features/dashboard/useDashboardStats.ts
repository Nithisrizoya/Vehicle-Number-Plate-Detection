import { DEMO_STATS } from './demoData';

/**
 * Returns fixed demo data for the Dashboard tab. Intentionally not connected
 * to /api/stats/dashboard — this tab is a static client-facing showcase, kept
 * separate from whatever Video Detection / Live Detection actually produce.
 */
export function useDashboardStats() {
  return { stats: DEMO_STATS, loading: false };
}
