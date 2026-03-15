import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client with service role key — bypasses RLS
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client with anon key — respects RLS
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Create a client scoped to a specific user's JWT for RLS
export const createUserClient = (accessToken: string) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
