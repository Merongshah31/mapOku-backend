const express = require('express');
const { getAccessibleRoute } = require('../controllers/routes.controller');
const { getAccessibleRouteValidators } = require('../validators/route.validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/v1/routes/accessible
 * Returns an accessible pedestrian route avoiding active obstacles.
 *
 * Query params:
 *   startLat, startLng      - Origin coordinates
 *   endLat, endLng          - Destination coordinates
 *   accessibilityNeeds      - Comma-separated: wheelchair,elderly,stroller,visually_impaired,hearing_impaired
 *
 * @example
 *   GET /api/v1/routes/accessible?startLat=3.139&startLng=101.686&endLat=3.147&endLng=101.695&accessibilityNeeds=wheelchair
 */
router.get(
  '/accessible',
  getAccessibleRouteValidators,
  validate,
  getAccessibleRoute
);

module.exports = router;
