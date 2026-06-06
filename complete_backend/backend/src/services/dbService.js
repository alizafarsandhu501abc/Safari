const { query } = require('../config/db');

/**
 * Insert a new user into the users table.
 */
async function createUser(username, email, passwordHash) {
  const result = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
    [username, email, passwordHash]
  );
  return result.rows[0];
}

/**
 * Find a user by username.
 */
async function findUserByUsername(username) {
  const result = await query(
    'SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
}

/**
 * Create a new log processing job.
 */
async function createJob(userId, filename, fileSize) {
  const result = await query(
    'INSERT INTO log_jobs (user_id, filename, file_size, status) VALUES ($1, $2, $3, $4) RETURNING id',
    [userId, filename, fileSize, 'pending']
  );
  return result.rows[0].id;
}

/**
 * Update a job record with dynamic fields.
 * @param {number} jobId
 * @param {object} updates - Key-value pairs to update (e.g. { status, total_lines, duration_ms, worker_count })
 */
async function updateJob(jobId, updates) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
  const values = keys.map((key) => updates[key]);
  values.push(jobId);

  await query(
    `UPDATE log_jobs SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
    values
  );
}

/**
 * Get all jobs for a specific user, ordered by most recent first.
 */
async function getJobs(userId) {
  const result = await query(
    'SELECT id, filename, file_size, total_lines, duration_ms, worker_count, status, created_at FROM log_jobs WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

/**
 * Bulk insert analytics results for a given job.
 * @param {number} jobId
 * @param {Array<{metric_type: string, key_name: string, count_value: number}>} results
 */
async function saveAnalyticsResults(jobId, results) {
  if (!results || results.length === 0) return;

  const values = [];
  const placeholders = [];
  let paramIndex = 1;

  for (const r of results) {
    placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
    values.push(jobId, r.metric_type, r.key_name, r.count_value);
    paramIndex += 4;
  }

  await query(
    `INSERT INTO analytics_results (job_id, metric_type, key_name, count_value) VALUES ${placeholders.join(', ')}`,
    values
  );
}

/**
 * Get analytics results for a specific job.
 */
async function getAnalyticsByJobId(jobId) {
  const result = await query(
    'SELECT id, metric_type, key_name, count_value FROM analytics_results WHERE job_id = $1 ORDER BY metric_type, count_value DESC',
    [jobId]
  );
  return result.rows;
}

/**
 * Get aggregated analytics from the latest completed job.
 */
async function getLatestAnalytics() {
  const latestJob = await query(
    "SELECT id, filename, duration_ms, total_lines, worker_count, created_at FROM log_jobs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1"
  );

  if (latestJob.rows.length === 0) return null;

  const job = latestJob.rows[0];
  const analytics = await query(
    'SELECT metric_type, key_name, count_value FROM analytics_results WHERE job_id = $1 ORDER BY metric_type, count_value DESC',
    [job.id]
  );

  return {
    job,
    results: analytics.rows,
  };
}

/**
 * Create an audit trail entry.
 */
async function createAuditEntry(userId, action, details, ipAddress) {
  await query(
    'INSERT INTO audit_trails (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
    [userId, action, details, ipAddress]
  );
}

/**
 * Get recent audit trail entries with user info.
 * @param {number} limit - Max number of records to return (default: 50)
 */
async function getAuditTrails(limit = 50) {
  const result = await query(
    `SELECT a.id, a.action, a.details, a.ip_address, a.created_at,
            u.username
     FROM audit_trails a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  createUser,
  findUserByUsername,
  createJob,
  updateJob,
  getJobs,
  saveAnalyticsResults,
  getAnalyticsByJobId,
  getLatestAnalytics,
  createAuditEntry,
  getAuditTrails,
};
