import { Car, DoorOpen, Timer, Users } from 'lucide-react';
import type { DashboardStats } from '@/shared/types';

interface KPIProps {
  label: string; value: string | number; sub: string; subColor?: string;
  icon: React.ElementType; gradient: string; glow: string;
}

function KPI({ label, value, sub, subColor = 'text-slate-400', icon: Icon, gradient, glow }: KPIProps) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-card p-4 flex flex-col gap-3 hover:shadow-card-md hover:border-sky-200 hover:-translate-y-0.5 transition-all">
      <div className={`p-2.5 rounded-xl w-fit bg-gradient-to-br ${gradient} shadow-lg ${glow}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-slate-600 text-xs font-medium mt-1">{label}</p>
        <p className={`text-[10px] mt-0.5 ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

export function KPICards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Cars Today" value={stats.cars_today} sub="Entries recorded today"
        icon={Car} gradient="from-sky-500 to-sky-600" glow="shadow-sky-200" />
      <KPI label="Currently Inside" value={stats.currently_inside} sub="Vehicles yet to exit" subColor="text-amber-600"
        icon={DoorOpen} gradient="from-amber-400 to-amber-500" glow="shadow-amber-200" />
      <KPI label="Avg Dwell Time" value={`${stats.avg_dwell_time_minutes}m`} sub="Average time parked today" subColor="text-emerald-600"
        icon={Timer} gradient="from-emerald-400 to-emerald-500" glow="shadow-emerald-200" />
      <KPI label="Total Unique Vehicles" value={stats.total_unique_vehicles} sub="All-time distinct plates seen" subColor="text-violet-600"
        icon={Users} gradient="from-violet-400 to-violet-500" glow="shadow-violet-200" />
    </div>
  );
}
