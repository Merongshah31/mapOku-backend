const crypto = require('crypto');

const requireModerator = (req, res, next) => {
  const configuredKey = process.env.MODERATOR_API_KEY;
  const providedKey = req.get('x-moderator-key') || '';

  if (!configuredKey) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Moderation is not configured.',
    });
  }

  const expected = Buffer.from(configuredKey);
  const received = Buffer.from(providedKey);
  const valid = expected.length === received.length
    && crypto.timingSafeEqual(expected, received);

  if (!valid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid moderator key is required.',
    });
  }

  next();
};

module.exports = { requireModerator };
