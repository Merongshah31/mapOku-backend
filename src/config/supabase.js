const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[Supabase] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
      'All database calls will fail. Copy .env.example to .env and fill in your credentials.'
    );
  }
}

/**
 * Supabase admin client — uses service role key to bypass RLS.
 * Only used server-side. Never expose the service role key to clients.
 */
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;
