const axios = require('axios');
require('dotenv').config();

const ORS_BASE_URL = process.env.ORS_BASE_URL || 'https://api.openrouteservice.org';
const ORS_PROFILE = process.env.ORS_PROFILE || 'foot-walking';
const ORS_TIMEOUT_MS = Number(process.env.ORS_TIMEOUT_MS || 10000);

const orsClient = axios.create({
  baseURL: ORS_BASE_URL,
  timeout: ORS_TIMEOUT_MS,
  headers: {
    Authorization: process.env.ORS_API_KEY || '',
    'Content-Type': 'application/json',
    Accept: 'application/geo+json, application/json',
  },
});

const ACCESSIBILITY_PROFILES = {
  wheelchair: ORS_PROFILE,
  visually_impaired: ORS_PROFILE,
  elderly: ORS_PROFILE,
  stroller: ORS_PROFILE,
  hearing_impaired: ORS_PROFILE,
};

module.exports = {
  orsClient,
  ORS_BASE_URL,
  ORS_PROFILE,
  ACCESSIBILITY_PROFILES,
};
