const axios = require('axios');
require('dotenv').config();

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

/**
 * Pre-configured axios instance for OSRM API calls.
 * Public OSRM demo server supports: foot, car, bike profiles.
 * For production: self-host OSRM with custom pedestrian profiles.
 */
const osrmClient = axios.create({
  baseURL: OSRM_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * OSRM profiles mapped from Mapoku accessibility needs.
 * All accessibility profiles use the 'foot' OSRM profile.
 * Obstacle avoidance is handled by adding intermediate waypoints.
 */
const ACCESSIBILITY_PROFILES = {
  wheelchair: 'foot',
  visually_impaired: 'foot',
  elderly: 'foot',
  stroller: 'foot',
  hearing_impaired: 'foot',
};

module.exports = { osrmClient, ACCESSIBILITY_PROFILES, OSRM_BASE_URL };
