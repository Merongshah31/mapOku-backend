const express = require('express');
const { getRewards, redeemReward } = require('../controllers/rewards.controller');
const { redeemValidators } = require('../validators/rewards.validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/rewards
 * Returns points_balance, reports_count, confirmations_count,
 * and the active reward catalog. Requires authentication.
 */
router.get('/', authenticate, getRewards);

/**
 * POST /api/v1/rewards/:itemId/redeem
 * Redeems a reward item for points. Requires authentication.
 * 404 if the reward item doesn't exist, 409 if points are insufficient.
 */
router.post(
  '/:itemId/redeem',
  authenticate,
  redeemValidators,
  validate,
  redeemReward
);

module.exports = router;
