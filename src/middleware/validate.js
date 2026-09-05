const { validationResult } = require('express-validator');

/**
 * Runs express-validator chains and short-circuits with 400
 * if any validation errors exist.
 *
 * Usage:
 *   router.get('/route', [...validators], validate, controller);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }

  next();
};

module.exports = { validate };
