const express = require('express');
const { register, login, getMe } = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/v1/users/register
 * Create a new Mapoku user account.
 *
 * Body: { email, password, username }
 */
router.post('/register', register);

/**
 * POST /api/v1/users/login
 * Authenticate and receive a JWT session.
 *
 * Body: { email, password }
 * Returns: { access_token, refresh_token, expires_in, user }
 */
router.post('/login', login);

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's public profile.
 * Requires: Authorization: Bearer <access_token>
 */
router.get('/me', authenticate, getMe);

module.exports = router;
