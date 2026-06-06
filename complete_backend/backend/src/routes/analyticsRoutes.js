const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/analytics/dashboard (protected)
router.get('/dashboard', authenticateToken, analyticsController.getDashboard);

module.exports = router;
