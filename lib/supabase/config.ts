/**
 * Supabase is temporarily disabled — set to `true` once your database is ready.
 * When false, the app uses mock data for reads and skips all DB/auth writes.
 */
export const SUPABASE_ENABLED = false;

export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_ENABLED) return false;

  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export const SUPABASE_DISABLED_MESSAGE =
  "Supabase is disabled. Set SUPABASE_ENABLED = true in lib/supabase/config.ts and configure .env.local.";
