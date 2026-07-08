import { useState } from 'react';
import { SnapshotModal } from '@/shared/components/SnapshotModal';
import { useDashboardStats } from './useDashboardStats';
import { KPICards } from './KPICards';
import { TrendChart } from './TrendChart';
import { RepeatVehicles } from './RepeatVehicles';
import { RecentActivity } from './RecentActivity';
import { OperationalMetrics } from './OperationalMetrics';
import { SystemHealth } from './SystemHealth';

export function DashboardPage() {
  const { stats } = useDashboardStats();
  const [snapshot, setSnapshot] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {snapshot && <SnapshotModal src={snapshot} onClose={() => setSnapshot(null)} />}

      {/* Row 1 — 4 KPI cards */}
      <KPICards stats={stats} />

      {/* Row 2 — Trend chart (wide) + Repeat vehicles (narrow) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TrendChart data={stats.hourly_trend} />
        </div>
        <RepeatVehicles data={stats.repeat_vehicles} />
      </div>

      {/* Row 3 — Operational metrics: 4 equal cards */}
      <OperationalMetrics />

      {/* Row 4 — Recent activity table */}
      <RecentActivity rows={stats.recent_activity} onViewSnapshot={setSnapshot} />

      {/* Row 5 — System health */}
      <SystemHealth />
    </div>
  );
}
