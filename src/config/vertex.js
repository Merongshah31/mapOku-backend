const axios = require('axios');
require('dotenv').config();

const VERTEX_AI_BASE_URL = process.env.VERTEX_AI_BASE_URL || 'https://aiplatform.googleapis.com';
const VERTEX_AI_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'global';
const VERTEX_AI_MODEL = process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash-001';
const VERTEX_AI_TIMEOUT_MS = Number(process.env.VERTEX_AI_TIMEOUT_MS || 15000);

const vertexClient = axios.create({
  baseURL: VERTEX_AI_BASE_URL,
  timeout: VERTEX_AI_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const getGenerateContentPath = () => {
  if (!VERTEX_AI_PROJECT) {
    return null;
  }

  return `/v1/projects/${VERTEX_AI_PROJECT}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${VERTEX_AI_MODEL}:generateContent`;
};

module.exports = {
  vertexClient,
  getGenerateContentPath,
  VERTEX_AI_BASE_URL,
  VERTEX_AI_LOCATION,
  VERTEX_AI_MODEL,
};
