const express = require('express');
const { getMyReports } = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/reports/me
 * Fetch the authenticated user's obstacle reports.
 */
router.get('/me', authenticate, getMyReports);

module.exports = router;