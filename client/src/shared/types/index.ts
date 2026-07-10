export type Page = 'dashboard' | 'live-detection' | 'video-detection';

export type GateEvent = 'IN' | 'OUT';

export interface PlateEvent {
  id: string;
  plate: string;
  event: GateEvent;
  time: string;
  timestamp: string;
  confidence?: number;
  snapshot?: string;
  duration_seconds?: number | null;
  visit_number?: number;
  sighting_id?: string;
  brand?: string | null;
  colour?: string | null;
}

export interface ProcState {
  running: boolean; filename: string | null;
  outputVideo: string | null;
  startedAt: string | null; exitCode: number | null;
  error: string | null; plates_seen: number;
  mode: 'video' | 'live' | null;
}

export interface HourlyTrendPoint { hour: string; in: number; out: number; }
export interface RepeatVehicle { plate: string; visits: number; lastSeen: string; }
export interface RecentActivityRow {
  id: string; time: string; plate: string; event: GateEvent; visitNumber?: number;
  snapshot?: string; sightingId?: string; confidence?: number;
}

export interface VerificationResult {
  match: boolean;
  plateRegistered: boolean;
  driverIdMatch: boolean;
  driverNameMatch: boolean;
  extractedDriverId?: string | null;
  extractedDriverName?: string | null;
  driverName?: string | null;
  driverId?: string | null;
  goods?: string | null;
  reason?: string;
  emailSent?: boolean;
}

export interface DashboardStats {
  cars_today: number;
  currently_inside: number;
  avg_dwell_time_minutes: number;
  total_unique_vehicles: number;
  hourly_trend: HourlyTrendPoint[];
  repeat_vehicles: RepeatVehicle[];
  recent_activity: RecentActivityRow[];
}
