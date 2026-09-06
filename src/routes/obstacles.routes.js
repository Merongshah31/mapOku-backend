const express = require('express');
const {
  upload,
  getObstacles,
  createObstacle,
  upvoteObstacle,
  downvoteObstacle,
} = require('../controllers/obstacles.controller');
const {
  createObstacleValidators,
  getBoundingBoxValidators,
  voteValidators,
} = require('../validators/obstacle.validator');
const { validate } = require('../middleware/validate');
const { requireAnonymousIdentity } = require('../middleware/anonymousIdentity');

const router = express.Router();

/**
 * GET /api/v1/obstacles
 * Fetch all active obstacles within a bounding box.
 * Public endpoint — no auth required.
 *
 * @example
 *   GET /api/v1/obstacles?minLat=3.13&minLng=101.68&maxLat=3.15&maxLng=101.70
 */
router.get(
  '/',
  getBoundingBoxValidators,
  validate,
  getObstacles
);

/**
 * POST /api/v1/obstacles
 * Report a new obstacle. Authentication is temporarily disabled.
 * Accepts multipart/form-data with a required image for AI validation.
 *
 * Body fields:
 *   latitude, longitude (required)
 *   type                (required, see obstacle_type enum)
 *   description         (optional, max 500 chars)
 *   affects             (optional JSON array of accessibility needs)
 *   image               (required image file, max 5MB)
 */
router.post(
  '/',
  upload.single('image'), // Multer handles multipart — must be before validators
  createObstacleValidators,
  validate,
  createObstacle
);

/**
 * PUT /api/v1/obstacles/:id/upvote
 * Confirm obstacle is still present ("Still there?"). Authentication is temporarily disabled.
 */
router.put(
  '/:id/upvote',
  requireAnonymousIdentity,
  voteValidators,
  validate,
  upvoteObstacle
);

/**
 * PUT /api/v1/obstacles/:id/downvote
 * Report obstacle as cleared ("It's gone!"). Authentication is temporarily disabled.
 * Auto-archives if downvote threshold is reached.
 */
router.put(
  '/:id/downvote',
  requireAnonymousIdentity,
  voteValidators,
  validate,
  downvoteObstacle
);

module.exports = router;
