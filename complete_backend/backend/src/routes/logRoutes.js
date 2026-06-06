const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/logs/upload (protected, file upload)
router.post('/upload', authenticateToken, upload.single('logfile'), logController.uploadLog);

// GET /api/logs/jobs (protected)
router.get('/jobs', authenticateToken, logController.getJobs);

// GET /api/logs/jobs/:jobId (protected)
router.get('/jobs/:jobId', authenticateToken, logController.getJobResults);

module.exports = router;
