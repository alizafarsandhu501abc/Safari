const path = require('path');
const dotenv = require('dotenv');

// Load .env — try backend root first, then parent (complete_backend/) for local dev
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  PYTHON_PATH: process.env.PYTHON_PATH || 'python',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

module.exports = config;
