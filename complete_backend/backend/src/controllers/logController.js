const path = require('path');
const dbService = require('../services/dbService');
const { runMapReduce } = require('../services/mapreduceService');

/**
 * POST /api/logs/upload
 * Receives an uploaded log file, creates a job, and triggers MapReduce processing.
 */
async function uploadLog(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No log file uploaded.' });
    }

    const { id: userId, username } = req.user;
    const { filename, originalname, size } = req.file;
    const filePath = path.resolve(req.file.path);
    const workers = parseInt(req.body.workers, 10) || 4;

    // Create job record with status 'processing'
    const jobId = await dbService.createJob(userId, originalname, size);
    await dbService.updateJob(jobId, { status: 'processing', worker_count: workers });

    // Log audit entry
    const ipAddress = req.ip || req.connection.remoteAddress;
    await dbService.createAuditEntry(
      userId,
      'log_upload',
      `User "${username}" uploaded file "${originalname}" (${size} bytes). Job ID: ${jobId}`,
      ipAddress
    );

    // Return job id immediately, process in background
    res.status(202).json({
      message: 'File uploaded. Processing started.',
      jobId,
      filename: originalname,
    });

    // Trigger MapReduce in background (after response is sent)
    const startTime = Date.now();

    runMapReduce(filePath, workers)
      .then(async (report) => {
        const durationMs = Date.now() - startTime;

        const metadata = report.metadata || {};
        const results = report.results || {};

        // Flatten results into analytics_results rows
        const analyticsRows = [];

        // HTTP status codes (e.g. HTTP_200, HTTP_404, HTTP_500)
        if (results.http_codes) {
          for (const [key, count] of Object.entries(results.http_codes)) {
            analyticsRows.push({
              metric_type: 'http_code',
              key_name: key,
              count_value: count,
            });
          }
        }

        // Hourly traffic (e.g. Hour_00, Hour_14)
        if (results.hourly_traffic) {
          for (const [key, count] of Object.entries(results.hourly_traffic)) {
            analyticsRows.push({
              metric_type: 'hourly_traffic',
              key_name: key,
              count_value: count,
            });
          }
        }

        // Severity levels (e.g. Severity_ERROR, Severity_WARN)
        if (results.severity) {
          for (const [key, count] of Object.entries(results.severity)) {
            analyticsRows.push({
              metric_type: 'severity',
              key_name: key,
              count_value: count,
            });
          }
        }

        await dbService.saveAnalyticsResults(jobId, analyticsRows);
        await dbService.updateJob(jobId, {
          status: 'completed',
          duration_ms: durationMs,
          total_lines: metadata.total_lines || null,
          worker_count: metadata.worker_count || workers,
        });

        console.log(`Job ${jobId} completed in ${durationMs}ms.`);
      })
      .catch(async (err) => {
        console.error(`Job ${jobId} failed:`, err.message);
        await dbService.updateJob(jobId, { status: 'failed' });
      });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/logs/jobs
 * Returns all processing jobs for the authenticated user.
 */
async function getJobs(req, res) {
  try {
    const jobs = await dbService.getJobs(req.user.id);
    res.json({ jobs });
  } catch (err) {
    console.error('Get jobs error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/logs/jobs/:jobId
 * Returns analytics results for a specific job.
 */
async function getJobResults(req, res) {
  try {
    const { jobId } = req.params;
    const results = await dbService.getAnalyticsByJobId(jobId);
    res.json({ jobId: parseInt(jobId, 10), results });
  } catch (err) {
    console.error('Get job results error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { uploadLog, getJobs, getJobResults };
