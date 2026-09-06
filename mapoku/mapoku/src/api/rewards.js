import { apiFetch } from './client';

/**
 * Map backend reward item → UI card shape (keeps Rewards.jsx field names).
 */
export function mapRewardItem(item) {
  const partner = item.partner_label || '';
  const brand = partner
    .replace(/\s*[—–-]\s*simulated partner\s*$/i, '')
    .trim() || partner;

  return {
    id: item.id,
    label: item.title,
    brand,
    partnerLabel: partner,
    cost: item.cost_points,
  };
}

/**
 * GET /api/v1/rewards
 * FRONTEND: load Rewards page (balance + catalog).
 */
export async function fetchRewards() {
  const payload = await apiFetch('/api/v1/rewards');
  const data = payload?.data || {};

  return {
    points: data.points_balance ?? 0,
    reportsCount: data.reports_count ?? 0,
    confirmationsCount: data.confirmations_count ?? 0,
    items: (data.items || []).map(mapRewardItem),
  };
}

/**
 * POST /api/v1/rewards/:itemId/redeem
 * FRONTEND: Confirm redemption button.
 */
export async function redeemReward(itemId) {
  const payload = await apiFetch(`/api/v1/rewards/${itemId}/redeem`, {
    method: 'POST',
  });

  return {
    message: payload?.message || 'Reward redeemed successfully.',
    redemption: payload?.data || {},
    voucherCode: payload?.data?.voucher_code || null,
    pointsBalance: payload?.data?.points_balance,
  };
}
