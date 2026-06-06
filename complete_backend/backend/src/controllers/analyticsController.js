const dbService = require('../services/dbService');
const { query } = require('../config/db');

/**
 * GET /api/analytics/dashboard
 * Returns aggregated dashboard data from the latest completed job.
 * Shapes data for the frontend metric cards, bar chart, and area chart.
 */
async function getDashboard(req, res) {
  try {
    const latest = await dbService.getLatestAnalytics();

    // Count total jobs for this user
    const jobCountResult = await query(
      'SELECT COUNT(*) as count FROM log_jobs WHERE user_id = $1',
      [req.user.id]
    );
    const totalJobs = parseInt(jobCountResult.rows[0]?.count || '0', 10);

    if (!latest) {
      return res.json({
        message: 'No completed analysis jobs found.',
        job: null,
        error_frequencies: [],
        hourly_traffic: [],
        total_requests: 0,
        total_errors: 0,
        latest_duration: '—',
        total_jobs: totalJobs,
      });
    }

    const { job, results } = latest;

    // Separate metrics by type
    const httpCodes = results.filter((r) => r.metric_type === 'http_code');
    const hourlyTraffic = results.filter((r) => r.metric_type === 'hourly_traffic');
    const severities = results.filter((r) => r.metric_type === 'severity');

    // Shape error_frequencies for BarChart: [{name: "404", count: N}, ...]
    const errorFrequencies = httpCodes
      .filter((r) => {
        const code = r.key_name.replace('HTTP_', '');
        return code.startsWith('4') || code.startsWith('5');
      })
      .map((r) => ({
        name: r.key_name.replace('HTTP_', ''),
        count: r.count_value,
      }))
      .sort((a, b) => b.count - a.count);

    // Shape hourly_traffic for AreaChart: [{hour: "00", count: N}, ...]
    const hourlyData = hourlyTraffic
      .map((r) => ({
        hour: r.key_name.replace('Hour_', ''),
        count: r.count_value,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Summary stats
    const totalRequests = httpCodes.reduce((sum, r) => sum + r.count_value, 0);
    const totalErrors = httpCodes
      .filter((r) => {
        const code = r.key_name.replace('HTTP_', '');
        return code.startsWith('4') || code.startsWith('5');
      })
      .reduce((sum, r) => sum + r.count_value, 0);

    const peakHour = hourlyData.length > 0
      ? hourlyData.reduce((max, r) => (r.count > max.count ? r : max))
      : null;

    res.json({
      job: {
        id: job.id,
        filename: job.filename,
        duration_ms: job.duration_ms,
        total_lines: job.total_lines,
        worker_count: job.worker_count,
        created_at: job.created_at,
      },
      error_frequencies: errorFrequencies,
      hourly_traffic: hourlyData,
      total_requests: totalRequests,
      total_errors: totalErrors,
      latest_duration: job.duration_ms ? Math.round(job.duration_ms / 1000) : '—',
      total_jobs: totalJobs,
      peak_hour: peakHour ? peakHour.hour : null,
      peak_hour_requests: peakHour ? peakHour.count : null,
      severities: severities.map((r) => ({
        name: r.key_name.replace('Severity_', ''),
        count: r.count_value,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getDashboard };
