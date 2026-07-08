/**
 * Static demo data for the Dashboard tab.
 *
 * Deliberately NOT wired to /api/stats/dashboard or any real detection output —
 * this tab is a fixed client-facing showcase, independent of whatever the Video
 * Detection / Live Detection tabs actually produce.
 */
import type { DashboardStats } from '@/shared/types';

export const DEMO_STATS: DashboardStats = {
  cars_today: 24,
  currently_inside: 5,
  avg_dwell_time_minutes: 34.5,
  total_unique_vehicles: 18,

  hourly_trend: [
    { hour: '09:00', in: 2, out: 0 },
    { hour: '10:00', in: 3, out: 1 },
    { hour: '11:00', in: 2, out: 2 },
    { hour: '12:00', in: 4, out: 2 },
    { hour: '13:00', in: 3, out: 3 },
    { hour: '14:00', in: 2, out: 3 },
    { hour: '15:00', in: 3, out: 2 },
    { hour: '16:00', in: 3, out: 2 },
    { hour: '17:00', in: 2, out: 4 },
  ],

  repeat_vehicles: [
    { plate: 'TN09BY9726', visits: 5, lastSeen: '04:42:10 PM' },
    { plate: 'KA05ND007',  visits: 4, lastSeen: '03:58:32 PM' },
    { plate: 'MH20DV2366', visits: 3, lastSeen: '02:15:47 PM' },
    { plate: '35JF449',    visits: 2, lastSeen: '01:20:05 PM' },
  ],

  recent_activity: [
    { id: 'demo-1', time: '05:12:40 PM', plate: 'T0322UP4229B',  event: 'IN',  visitNumber: 1, snapshot: undefined },
    { id: 'demo-2', time: '04:58:21 PM', plate: 'SFJ3162TEXAS',  event: 'OUT', visitNumber: 1, snapshot: undefined },
    { id: 'demo-3', time: '04:42:10 PM', plate: 'TN09BY9726',    event: 'IN',  visitNumber: 5, snapshot: undefined },
    { id: 'demo-4', time: '04:15:03 PM', plate: 'T1223GJ6607DZ', event: 'IN',  visitNumber: 1, snapshot: undefined },
    { id: 'demo-5', time: '03:58:32 PM', plate: 'KA05ND007',     event: 'IN',  visitNumber: 4, snapshot: undefined },
    { id: 'demo-6', time: '03:40:18 PM', plate: 'SFJ3162TEXAS',  event: 'IN',  visitNumber: 1, snapshot: undefined },
    { id: 'demo-7', time: '02:15:47 PM', plate: 'MH20DV2366',    event: 'IN',  visitNumber: 3, snapshot: undefined },
    { id: 'demo-8', time: '01:20:05 PM', plate: '35JF449',       event: 'IN',  visitNumber: 2, snapshot: undefined },
  ],
};
