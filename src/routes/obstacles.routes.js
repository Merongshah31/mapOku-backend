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
const { authenticate } = require('../middleware/auth');

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
 * Report a new obstacle. Requires authentication.
 * Accepts multipart/form-data for optional image upload.
 *
 * Body fields:
 *   latitude, longitude (required)
 *   type                (required, see obstacle_type enum)
 *   description         (optional, max 500 chars)
 *   affects             (optional JSON array of accessibility needs)
 *   image               (optional image file, max 5MB)
 */
router.post(
  '/',
  authenticate,
  upload.single('image'), // Multer handles multipart — must be before validators
  createObstacleValidators,
  validate,
  createObstacle
);

/**
 * PUT /api/v1/obstacles/:id/upvote
 * Confirm obstacle is still present ("Still there?"). Requires auth.
 */
router.put(
  '/:id/upvote',
  authenticate,
  voteValidators,
  validate,
  upvoteObstacle
);

/**
 * PUT /api/v1/obstacles/:id/downvote
 * Report obstacle as cleared ("It's gone!"). Requires auth.
 * Auto-archives if downvote threshold is reached.
 */
router.put(
  '/:id/downvote',
  authenticate,
  voteValidators,
  validate,
  downvoteObstacle
);

module.exports = router;
