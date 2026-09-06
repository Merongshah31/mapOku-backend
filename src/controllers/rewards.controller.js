const rewardsService = require('../services/rewards.service');

/**
 * GET /api/v1/rewards
 * FRONTEND (Rewards page): points_balance, reports_count,
 * confirmations_count, and active catalog items.
 * Requires: Authorization Bearer <access_token>
 */
const getRewards = async (req, res, next) => {
  try {
    const [summary, items] = await Promise.all([
      rewardsService.getSummary(req.user.id),
      rewardsService.listRewardItems(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        points_balance: summary.points_balance,
        reports_count: summary.reports_count,
        confirmations_count: summary.confirmations_count,
        items,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/rewards/:itemId/redeem
 * FRONTEND (Confirm redemption): deducts points, returns
 * voucher_code + points_balance for the success modal.
 */
const redeemReward = async (req, res, next) => {
  try {
    const redemption = await rewardsService.redeem(req.user.id, req.params.itemId);
    const summary = await rewardsService.getSummary(req.user.id);

    // Simulated partner voucher — frontend success modal displays this code.
    const shortId = String(redemption.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    const voucher_code = `MAPOKU-${shortId || 'REDEEM'}`;

    res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully.',
      data: {
        ...redemption,
        voucher_code,
        points_balance: summary.points_balance,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRewards, redeemReward };
