const weatherService = require('../services/weather.service');

const getCurrentWeather = async (req, res, next) => {
  try {
    const weather = await weatherService.getCurrentWeather({
      lat: Number(req.query.lat),
      lon: Number(req.query.lon),
    });

    res.status(200).json({
      success: true,
      data: weather,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCurrentWeather };
