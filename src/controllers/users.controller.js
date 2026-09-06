const supabase = require('../config/supabase');

const register = (req, res) => res.status(501).json({
  error: 'Not Implemented',
  message: 'Registration is not available yet.',
});

const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Invalid Request',
      message: 'Email and password are required.',
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error?.message || 'Invalid email or password.',
    });
  }

  return res.status(200).json({
    success: true,
    data: { user: data.user },
  });
};

const getMe = (req, res) => res.status(401).json({
  error: 'Unauthorized',
  message: 'A user session is required.',
});

module.exports = { register, login, getMe };
