const { weatherClient } = require('../config/weather');

const getCurrentWeather = async ({ lat, lon }) => {
  if (!process.env.OPENWEATHER_API_KEY) {
    const error = new Error('OpenWeatherMap API key is not configured.');
    error.status = 503;
    throw error;
  }

  try {
    const response = await weatherClient.get('/weather', {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: process.env.OPENWEATHER_UNITS || 'metric',
        lang: process.env.OPENWEATHER_LANG || 'ms',
      },
    });

    const data = response.data;
    return {
      location: {
        name: data.name,
        country: data.sys?.country,
        latitude: data.coord?.lat,
        longitude: data.coord?.lon,
      },
      weather: data.weather?.[0]
        ? {
            id: data.weather[0].id,
            main: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
          }
        : null,
      temperature: {
        current: data.main?.temp,
        feels_like: data.main?.feels_like,
        minimum: data.main?.temp_min,
        maximum: data.main?.temp_max,
        humidity: data.main?.humidity,
      },
      wind: {
        speed: data.wind?.speed,
        direction: data.wind?.deg,
      },
      visibility_meters: data.visibility,
      observed_at: data.dt ? new Date(data.dt * 1000).toISOString() : null,
    };
  } catch (err) {
    const providerStatus = err.response?.status;
    const error = new Error(
      providerStatus === 401
        ? 'OpenWeatherMap API key is invalid or not activated.'
        : providerStatus === 429
          ? 'OpenWeatherMap API quota has been exceeded.'
          : 'OpenWeatherMap is unavailable or rejected the weather request.'
    );
    error.status = providerStatus === 429 ? 429 : 502;
    throw error;
  }
};

module.exports = { getCurrentWeather };
