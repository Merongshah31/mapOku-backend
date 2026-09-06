const supabase = require('../config/supabase');

/**
 * RewardsService
 * Manages points balance, redemption catalog, and redemption flow.
 */
class RewardsService {
  /**
   * Returns the authenticated user's rewards summary.
   *
   * @param {string} userId
   */
  async getSummary(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('points_balance, reports_count, confirmations_count')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const err = new Error('User profile not found.');
      err.status = 404;
      throw err;
    }

    return data;
  }

  /**
   * Lists all active, redeemable reward items in catalog order.
   */
  async listRewardItems() {
    const { data, error } = await supabase
      .from('reward_items')
      .select('id, title, partner_label, cost_points')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      const err = new Error(`Failed to fetch reward items: ${error.message}`);
      err.status = 500;
      throw err;
    }

    return data || [];
  }

  /**
   * Redeems a reward item for the given user.
   *
   * @param {string} userId
   * @param {string} rewardItemId
   * @returns {Object} The created redemption record
   */
  async redeem(userId, rewardItemId) {
    const { data, error } = await supabase
      .rpc('redeem_reward', {
        p_user_id: userId,
        p_reward_item_id: rewardItemId,
      })
      .single();

    if (error) {
      if (error.message.includes('REWARD_NOT_FOUND')) {
        const err = new Error('Reward item not found or no longer available.');
        err.status = 404;
        throw err;
      }
      if (error.message.includes('INSUFFICIENT_POINTS')) {
        const err = new Error('Not enough points to redeem this reward.');
        err.status = 409;
        throw err;
      }
      if (error.message.includes('USER_NOT_FOUND')) {
        const err = new Error('User profile not found.');
        err.status = 404;
        throw err;
      }
      const err = new Error(`Failed to redeem reward: ${error.message}`);
      err.status = 500;
      throw err;
    }

    return data;
  }
}

module.exports = new RewardsService();
