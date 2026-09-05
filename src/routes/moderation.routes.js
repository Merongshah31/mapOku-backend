const express = require('express');
const { moderateObstacle } = require('../controllers/moderation.controller');
const { requireModerator } = require('../middleware/moderator');
const { moderateObstacleValidators } = require('../validators/moderation.validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.patch(
	'/obstacles/:id',
	requireModerator,
	moderateObstacleValidators,
	validate,
	moderateObstacle
);

module.exports = router;
