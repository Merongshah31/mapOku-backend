const express = require('express');
const { register, login, getMe } = require('../controllers/users.controller');

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
 * Verify credentials without returning a session token.
 *
 * Body: { email, password }
 * Returns: { success, data: { user } }
 */
router.post('/login', login);

/**
 * GET /api/v1/users/me
 * Returns a user's public profile. Authentication is temporarily disabled,
 * so this endpoint currently requires a user identifier to be reintroduced.
 */
router.get('/me', getMe);

module.exports = router;
