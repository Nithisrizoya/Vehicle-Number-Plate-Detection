import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import type { HourlyTrendPoint } from '@/shared/types';

interface TTP { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; }

function ChartTooltip({ active, payload, label }: TTP) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card-md p-3 text-xs">
      <p className="text-slate-600 font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 w-20">{p.name}</span>
          <span className="font-bold text-slate-900 ml-auto tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data }: { data: HourlyTrendPoint[] }) {
  return (
    <Card className="p-5 xl:col-span-2">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-semibold text-sm">Gate Traffic Trend</h3>
          <p className="text-slate-400 text-xs mt-0.5">Today · Hourly entries &amp; exits</p>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Live</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
            <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.12} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} iconType="circle" iconSize={7} />
          <Area type="monotone" dataKey="in"  name="Entries" stroke="#3b82f6" strokeWidth={2} fill="url(#gIn)"  dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          <Area type="monotone" dataKey="out" name="Exits"   stroke="#f97316" strokeWidth={2} fill="url(#gOut)" dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
