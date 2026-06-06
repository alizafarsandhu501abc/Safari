export default function MetricCard({ title, value, icon, trend, color = 'cyan' }) {
  const colorMap = {
    cyan: {
      gradient: 'from-cyan-400 to-blue-500',
      glow: 'rgba(6, 182, 212, 0.12)',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    purple: {
      gradient: 'from-purple-400 to-pink-500',
      glow: 'rgba(168, 85, 247, 0.12)',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    emerald: {
      gradient: 'from-emerald-400 to-cyan-500',
      glow: 'rgba(16, 185, 129, 0.12)',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    rose: {
      gradient: 'from-rose-400 to-orange-500',
      glow: 'rgba(244, 63, 94, 0.12)',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    amber: {
      gradient: 'from-amber-400 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.12)',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <div
      className="glass p-5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 group cursor-default"
      style={{ boxShadow: `0 4px 20px ${c.glow}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <span className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </span>
      </div>

      <div className={`text-3xl font-bold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
        {value ?? '—'}
      </div>

      {trend !== undefined && trend !== null && (
        <p className="mt-2 text-xs font-medium text-slate-500">
          {trend > 0 ? (
            <span className="text-emerald-400">↑ {trend}%</span>
          ) : trend < 0 ? (
            <span className="text-rose-400">↓ {Math.abs(trend)}%</span>
          ) : (
            <span className="text-slate-500">→ No change</span>
          )}
          {' '}vs previous
        </p>
      )}
    </div>
  );
}
