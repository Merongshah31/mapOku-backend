const moderationService = require('../services/moderation.service');

const moderateObstacle = async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    const obstacle = await moderationService.moderateObstacle(
      req.params.id,
      decision,
      note
    );

    res.status(200).json({
      success: true,
      message: decision === 'approve'
        ? 'Obstacle approved and published.'
        : 'Obstacle rejected and archived.',
      data: obstacle,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { moderateObstacle };
