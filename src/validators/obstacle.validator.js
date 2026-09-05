const { body, query, param } = require('express-validator');

const VALID_OBSTACLE_TYPES = [
  'broken_pavement',
  'steep_ramp',
  'missing_curb_cut',
  'construction',
  'flooded_path',
  'narrow_passage',
  'no_tactile_paving',
  'blocked_ramp',
  'uneven_surface',
  'other',
];

const VALID_ACCESSIBILITY_NEEDS = [
  'wheelchair',
  'visually_impaired',
  'elderly',
  'stroller',
  'hearing_impaired',
];

/**
 * Validators for POST /api/v1/obstacles
 */
const createObstacleValidators = [
  body('latitude')
    .notEmpty().withMessage('latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),

  body('longitude')
    .notEmpty().withMessage('longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),

  body('type')
    .notEmpty().withMessage('type is required')
    .isIn(VALID_OBSTACLE_TYPES).withMessage(`type must be one of: ${VALID_OBSTACLE_TYPES.join(', ')}`),

  body('description')
    .optional()
    .isString().withMessage('description must be a string')
    .isLength({ max: 500 }).withMessage('description must be at most 500 characters'),

  body('affects')
    .optional()
    .isArray().withMessage('affects must be an array')
    .custom((arr) => {
      const invalid = arr.filter((v) => !VALID_ACCESSIBILITY_NEEDS.includes(v));
      if (invalid.length > 0) {
        throw new Error(`Invalid accessibility needs: ${invalid.join(', ')}`);
      }
      return true;
    }),
];

/**
 * Validators for GET /api/v1/obstacles (bounding box)
 */
const getBoundingBoxValidators = [
  query('minLat')
    .notEmpty().withMessage('minLat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('minLat must be between -90 and 90'),

  query('minLng')
    .notEmpty().withMessage('minLng is required')
    .isFloat({ min: -180, max: 180 }).withMessage('minLng must be between -180 and 180'),

  query('maxLat')
    .notEmpty().withMessage('maxLat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('maxLat must be between -90 and 90'),

  query('maxLng')
    .notEmpty().withMessage('maxLng is required')
    .isFloat({ min: -180, max: 180 }).withMessage('maxLng must be between -180 and 180'),
];

/**
 * Validators for PUT /api/v1/obstacles/:id/upvote|downvote
 */
const voteValidators = [
  param('id')
    .isUUID().withMessage('Obstacle ID must be a valid UUID'),
];

module.exports = {
  createObstacleValidators,
  getBoundingBoxValidators,
  voteValidators,
  VALID_OBSTACLE_TYPES,
  VALID_ACCESSIBILITY_NEEDS,
};
