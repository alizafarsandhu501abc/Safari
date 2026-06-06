import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const barColors = ['#f43f5e', '#f97316', '#f59e0b', '#a855f7', '#3b82f6', '#06b6d4', '#10b981'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="glass-strong px-4 py-3"
      style={{ background: 'rgba(15, 23, 42, 0.92)', borderRadius: '12px' }}
    >
      <p className="text-sm font-semibold text-white mb-1">HTTP {label}</p>
      <p className="text-xs text-cyan-400 font-medium">
        {payload[0].value.toLocaleString()} occurrences
      </p>
    </div>
  );
}

export default function ErrorChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔴</span> HTTP Error Frequencies
        </h3>
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          No error data available
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 animate-slideUp" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span>🔴</span> HTTP Error Frequencies
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <defs>
            {barColors.map((color, i) => (
              <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={`url(#barGrad-${idx % barColors.length})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
