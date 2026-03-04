import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL. ' +
      'Add it to .env.local (see .env.local.example).',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add it to .env.local (see .env.local.example).',
  );
}

/**
 * Shared Supabase browser client.
 *
 * Safe to import in both Client and Server Components (uses the anon key).
 * For mutations requiring elevated privileges (e.g. admin webhooks), use a
 * separate `createClient(url, serviceRoleKey)` in API route handlers only —
 * never expose the service-role key to the browser.
 *
 * RLS policies on Supabase tables enforce per-user data isolation; the anon
 * key is always safe to ship to the client.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
