const { param } = require('express-validator');

/**
 * Validators for POST /api/v1/rewards/:itemId/redeem
 */
const redeemValidators = [
  param('itemId')
    .isUUID().withMessage('Reward item ID must be a valid UUID'),
];

module.exports = { redeemValidators };
