const { query } = require('express-validator');

const VALID_ACCESSIBILITY_NEEDS = [
  'wheelchair',
  'visually_impaired',
  'elderly',
  'stroller',
  'hearing_impaired',
];

/**
 * Validators for GET /api/v1/routes/accessible
 */
const getAccessibleRouteValidators = [
  query('startLat')
    .notEmpty().withMessage('startLat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('startLat must be between -90 and 90'),

  query('startLng')
    .notEmpty().withMessage('startLng is required')
    .isFloat({ min: -180, max: 180 }).withMessage('startLng must be between -180 and 180'),

  query('endLat')
    .notEmpty().withMessage('endLat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('endLat must be between -90 and 90'),

  query('endLng')
    .notEmpty().withMessage('endLng is required')
    .isFloat({ min: -180, max: 180 }).withMessage('endLng must be between -180 and 180'),

  query('accessibilityNeeds')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Accept comma-separated string or single value
      const needs = Array.isArray(value) ? value : value.split(',');
      const invalid = needs.filter((n) => !VALID_ACCESSIBILITY_NEEDS.includes(n.trim()));
      if (invalid.length > 0) {
        throw new Error(
          `Invalid accessibility needs: ${invalid.join(', ')}. Valid options: ${VALID_ACCESSIBILITY_NEEDS.join(', ')}`
        );
      }
      return true;
    }),
];

module.exports = { getAccessibleRouteValidators };
