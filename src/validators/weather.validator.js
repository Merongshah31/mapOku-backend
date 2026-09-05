const { query } = require('express-validator');

const getCurrentWeatherValidators = [
  query('lat')
    .notEmpty().withMessage('lat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  query('lon')
    .notEmpty().withMessage('lon is required')
    .isFloat({ min: -180, max: 180 }).withMessage('lon must be between -180 and 180'),
];

module.exports = { getCurrentWeatherValidators };
