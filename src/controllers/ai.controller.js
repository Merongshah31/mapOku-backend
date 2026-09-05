const { validateObstacleImage } = require('../services/image-validation.service');

const validateImage = async (req, res, next) => {
  try {
    const verdict = await validateObstacleImage(req.file);

    res.status(200).json({
      success: true,
      data: verdict,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { validateImage };
