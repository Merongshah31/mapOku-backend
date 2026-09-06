const express = require('express');
const { getRewards, redeemReward } = require('../controllers/rewards.controller');
const { redeemValidators } = require('../validators/rewards.validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

/**
 * Attach a fixed demo profile so rewards work without login.
 * Set DEMO_USER_ID in .env to a profiles.id UUID.
 */
const useDemoUser = (req, res, next) => {
  const demoUserId = process.env.DEMO_USER_ID;
  if (!demoUserId) {
    return res.status(500).json({
      error: 'Server Misconfigured',
      message: 'DEMO_USER_ID is not set. Add a profiles.id UUID to .env.',
    });
  }
  req.user = { id: demoUserId };
  next();
};

/**
 * GET /api/v1/rewards
 * Returns points_balance and the active reward catalog. No login required.
 */
router.get('/', useDemoUser, getRewards);

/**
 * POST /api/v1/rewards/:itemId/redeem
 * Redeems a reward item for points. No login required.
 */
router.post(
  '/:itemId/redeem',
  useDemoUser,
  redeemValidators,
  validate,
  redeemReward
);

module.exports = router;
