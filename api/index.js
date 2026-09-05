/**
 * Vercel Serverless Entry Point
 *
 * This file exports the Express app as a Vercel serverless function.
 * Vercel wraps each request in a serverless invocation — no persistent
 * process, so no Socket.io. Real-time is handled by Supabase Realtime
 * on the frontend side.
 *
 * All routes defined in src/app.js are served through this handler.
 */
require('dotenv').config();
const app = require('../src/app');

module.exports = app;
