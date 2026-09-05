const axios = require('axios');
require('dotenv').config();

const OPENWEATHER_BASE_URL = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_TIMEOUT_MS = Number(process.env.OPENWEATHER_TIMEOUT_MS || 10000);

const weatherClient = axios.create({
  baseURL: OPENWEATHER_BASE_URL,
  timeout: OPENWEATHER_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

module.exports = {
  weatherClient,
  OPENWEATHER_BASE_URL,
};
