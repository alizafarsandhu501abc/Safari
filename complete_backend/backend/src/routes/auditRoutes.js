const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, restrictToRole } = require('../middleware/auth');

// GET /api/audit/logs (protected, admin only)
router.get('/logs', authenticateToken, restrictToRole('admin'), auditController.getAuditLogs);

module.exports = router;
