const dbService = require('../services/dbService');

/**
 * GET /api/audit/logs
 * Returns paginated audit trail records (admin only).
 */
async function getAuditLogs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const trails = await dbService.getAuditTrails(limit);
    res.json({ audit_trails: trails, count: trails.length });
  } catch (err) {
    console.error('Audit logs error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getAuditLogs };
