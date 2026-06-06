import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import FileUploader from '../components/FileUploader';
import ErrorChart from '../components/ErrorChart';
import TrafficChart from '../components/TrafficChart';
import { getDashboard, getJobs } from '../services/api';

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

export default function DashboardPage() {
  const [dashData, setDashData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [dashRes, jobsRes] = await Promise.all([
        getDashboard().catch(() => ({ data: null })),
        getJobs().catch(() => ({ data: [] })),
      ]);

      setDashData(dashRes.data);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data?.jobs || []));
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadComplete = () => {
    // Re-fetch data after upload
    fetchData();
  };

  // Poll for status updates if any job is still processing or pending
  useEffect(() => {
    const hasActiveJob = jobs.some(
      (job) =>
        job.status === 'processing' ||
        job.status === 'running' ||
        job.status === 'pending'
    );

    if (!hasActiveJob) return;

    const intervalId = setInterval(async () => {
      try {
        const [dashRes, jobsRes] = await Promise.all([
          getDashboard().catch(() => ({ data: null })),
          getJobs().catch(() => ({ data: [] })),
        ]);

        setDashData(dashRes.data);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data?.jobs || []));
      } catch (err) {
        console.error('Background polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [jobs]);

  // Parse dashboard data
  const totalRequests = dashData?.total_requests ?? 0;
  const totalErrors = dashData?.total_errors ?? 0;
  const latestDuration = dashData?.latest_duration ?? '—';
  const totalJobs = dashData?.total_jobs ?? jobs.length ?? 0;

  // Chart data — already shaped by the backend
  const errorChartData = dashData?.error_frequencies ?? [];
  const trafficChartData = dashData?.hourly_traffic ?? [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-500 text-sm">Monitor your cloud log analysis at a glance</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fadeIn">
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="animate-slideUp stagger-1" style={{ animationFillMode: 'both' }}>
              <MetricCard
                title="Total Requests"
                value={totalRequests.toLocaleString()}
                icon="📊"
                color="cyan"
              />
            </div>
            <div className="animate-slideUp stagger-2" style={{ animationFillMode: 'both' }}>
              <MetricCard
                title="Total Errors"
                value={totalErrors.toLocaleString()}
                icon="⚠️"
                color="rose"
              />
            </div>
            <div className="animate-slideUp stagger-3" style={{ animationFillMode: 'both' }}>
              <MetricCard
                title="Latest Duration"
                value={typeof latestDuration === 'number' ? `${latestDuration}s` : latestDuration}
                icon="⏱️"
                color="amber"
              />
            </div>
            <div className="animate-slideUp stagger-4" style={{ animationFillMode: 'both' }}>
              <MetricCard
                title="Total Jobs"
                value={totalJobs.toLocaleString()}
                icon="📁"
                color="purple"
              />
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <FileUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* Charts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SkeletonBlock className="h-96" />
            <SkeletonBlock className="h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ErrorChart data={errorChartData} />
            <TrafficChart data={trafficChartData} />
          </div>
        )}

        {/* Recent Jobs Table */}
        <div className="glass p-6 animate-slideUp" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>🕐</span> Recent Jobs
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonBlock key={i} className="h-12" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">No jobs yet. Upload a log file to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Filename</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, idx) => (
                    <tr
                      key={job.id || job._id || idx}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="text-sm text-slate-300 font-medium">
                          {job.filename || job.file_name || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            job.status === 'completed' || job.status === 'done'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : job.status === 'failed' || job.status === 'error'
                              ? 'bg-rose-500/15 text-rose-400'
                              : job.status === 'processing' || job.status === 'running'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            job.status === 'completed' || job.status === 'done'
                              ? 'bg-emerald-400'
                              : job.status === 'failed' || job.status === 'error'
                              ? 'bg-rose-400'
                              : job.status === 'processing' || job.status === 'running'
                              ? 'bg-amber-400'
                              : 'bg-slate-400'
                          }`} />
                          {job.status || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-sm text-slate-400">
                        {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="py-3.5 text-sm text-slate-500">
                        {job.created_at || job.createdAt
                          ? new Date(job.created_at || job.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
