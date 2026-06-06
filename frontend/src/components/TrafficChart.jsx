import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="glass-strong px-4 py-3"
      style={{ background: 'rgba(15, 23, 42, 0.92)', borderRadius: '12px' }}
    >
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      <p className="text-xs text-cyan-400 font-medium">
        {payload[0].value.toLocaleString()} requests
      </p>
    </div>
  );
}

export default function TrafficChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📈</span> Hourly Traffic Volume
        </h3>
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No traffic data available
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 animate-slideUp" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span>📈</span> Hourly Traffic Volume
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="50%" stopColor="#a855f7" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="trafficStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="url(#trafficStroke)"
            strokeWidth={2.5}
            fill="url(#trafficGradient)"
            dot={false}
            activeDot={{
              r: 5,
              stroke: '#06b6d4',
              strokeWidth: 2,
              fill: '#0f172a',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
