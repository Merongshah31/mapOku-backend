const { body, param } = require('express-validator');

const moderateObstacleValidators = [
  param('id').isUUID().withMessage('Obstacle ID must be a valid UUID'),
  body('decision').isIn(['approve', 'reject']).withMessage('decision must be approve or reject'),
  body('note').optional().isString().isLength({ max: 500 }).withMessage('note must be at most 500 characters'),
];

module.exports = { moderateObstacleValidators };
