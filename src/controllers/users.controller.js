/**
 * Supabase Auth is intentionally switched off for the temporary anonymous
 * release. Retaining these routes gives clients a clear response instead of
 * accidentally creating accounts or sessions.
 */
const authDisabled = (res) => res.status(503).json({
  error: 'Authentication Disabled',
  message: 'Login and registration are temporarily disabled. Use public obstacle endpoints without a token.',
});

const register = (req, res) => authDisabled(res);
const login = (req, res) => authDisabled(res);
const getMe = (req, res) => authDisabled(res);

module.exports = { register, login, getMe };
