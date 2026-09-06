const supabase = require('../config/supabase');

/**
 * POST /api/v1/users/register
 * Registers a new user via Supabase Auth.
 * Triggers handle_new_user DB trigger to create a profile row.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'email, password, and username are required.',
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // Stored in raw_user_meta_data → used by DB trigger
      },
    });

    if (error) {
      return res.status(400).json({
        error: 'Registration Failed',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user_id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/users/login
 * Authenticates a user and returns a Supabase JWT session.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'email and password are required.',
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile from the profiles table.
 */
const getMe = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
