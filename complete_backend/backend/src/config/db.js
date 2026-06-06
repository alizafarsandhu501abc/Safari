const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

/**
 * Execute a parameterized SQL query.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Initialize database tables if they don't exist.
 */
async function initDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createLogJobsTable = `
    CREATE TABLE IF NOT EXISTS log_jobs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      filename VARCHAR(255),
      file_size BIGINT,
      total_lines INTEGER,
      duration_ms INTEGER,
      worker_count INTEGER,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createAnalyticsResultsTable = `
    CREATE TABLE IF NOT EXISTS analytics_results (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES log_jobs(id) ON DELETE CASCADE,
      metric_type VARCHAR(50),
      key_name VARCHAR(100),
      count_value INTEGER
    );
  `;

  const createAuditTrailsTable = `
    CREATE TABLE IF NOT EXISTS audit_trails (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await query(createUsersTable);
    await query(createLogJobsTable);
    await query(createAnalyticsResultsTable);
    await query(createAuditTrailsTable);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err.message);
    throw err;
  }
}

module.exports = { query, initDatabase, pool };
