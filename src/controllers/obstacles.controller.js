const multer = require('multer');
const obstacleService = require('../services/obstacle.service');
const reputationService = require('../services/reputation.service');

// Multer: store file in memory buffer (not on disk)
// Max file size: 5MB. Accepted: images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'), false);
    }
    cb(null, true);
  },
});

/**
 * GET /api/v1/obstacles
 * Fetches all active obstacles within a bounding box (map viewport).
 */
const getObstacles = async (req, res, next) => {
  try {
    const { minLat, minLng, maxLat, maxLng } = req.query;

    const obstacles = await obstacleService.getObstaclesInBoundingBox(
      minLat, minLng, maxLat, maxLng
    );

    res.status(200).json({
      success: true,
      count: obstacles.length,
      data: obstacles,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/obstacles
 * Creates a new obstacle report. Requires authentication.
 * Accepts optional image upload (multipart/form-data).
 */
const createObstacle = async (req, res, next) => {
  try {
    const { latitude, longitude, type, description, affects } = req.body;

    const obstacleData = {
      latitude,
      longitude,
      type,
      description,
      affects: affects
        ? (Array.isArray(affects) ? affects : JSON.parse(affects))
        : [],
      userId: req.user?.id || null,
    };

    const obstacle = await obstacleService.createAndNotify(
      obstacleData,
      req.file || null
    );

    res.status(201).json({
      success: true,
      message: 'Obstacle reported successfully. Thank you for contributing to Mapoku!',
      data: obstacle,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/obstacles/:id/upvote
 * Confirms obstacle is still present ("Still there?")
 */
const upvoteObstacle = async (req, res, next) => {
  try {
    const updated = await reputationService.updateObstacleStatus(
      req.params.id,
      req.user.id,
      'upvote'
    );

    res.status(200).json({
      success: true,
      message: 'Thank you for confirming this obstacle is still there.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/obstacles/:id/downvote
 * Reports obstacle as cleared ("It's gone!")
 * Auto-archives obstacle if downvote threshold is reached.
 */
const downvoteObstacle = async (req, res, next) => {
  try {
    const updated = await reputationService.updateObstacleStatus(
      req.params.id,
      req.user.id,
      'downvote'
    );

    const wasArchived = updated?.status === 'archived';

    res.status(200).json({
      success: true,
      message: wasArchived
        ? 'Obstacle has been cleared and removed from the map.'
        : 'Thank you for reporting this obstacle as cleared.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  getObstacles,
  createObstacle,
  upvoteObstacle,
  downvoteObstacle,
};
