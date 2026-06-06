import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getAuditLogs } from '../services/api';

function SkeletonRow() {
  return (
    <tr>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="py-3.5 pr-4">
          <div className="animate-shimmer h-4 rounded-md" />
        </td>
      ))}
    </tr>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const res = await getAuditLogs();
        setLogs(Array.isArray(res.data) ? res.data : (res.data?.audit_trails || []));
      } catch (err) {
        setError('Failed to load audit logs.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-2xl font-bold text-white mb-1">Audit Trail</h1>
          <p className="text-slate-500 text-sm">Track all system activity and user actions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fadeIn">
            {error}
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="glass p-6 animate-slideUp" style={{ animationFillMode: 'both' }}>
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const actionColor =
                      log.action?.toLowerCase().includes('login')
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : log.action?.toLowerCase().includes('upload')
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : log.action?.toLowerCase().includes('delete') || log.action?.toLowerCase().includes('fail')
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-slate-400 bg-slate-500/10';

                    return (
                      <tr
                        key={log.id || log._id || idx}
                        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3.5 pr-4 text-sm text-slate-400 whitespace-nowrap">
                          {log.timestamp || log.created_at || log.createdAt
                            ? new Date(log.timestamp || log.created_at || log.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="text-sm text-slate-300 font-medium">
                            {log.user || log.username || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${actionColor}`}>
                            {log.action || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-sm text-slate-500 max-w-xs truncate">
                          {log.details || log.description || '—'}
                        </td>
                        <td className="py-3.5 text-sm text-slate-500 font-mono">
                          {log.ip || log.ip_address || log.ipAddress || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
