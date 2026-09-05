const express = require('express');
const { getCurrentWeather } = require('../controllers/weather.controller');
const { getCurrentWeatherValidators } = require('../validators/weather.validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/current', getCurrentWeatherValidators, validate, getCurrentWeather);

module.exports = router;
