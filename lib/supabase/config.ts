/**
 * When false, the app uses mock data for reads and skips all DB/auth writes.
 * Also requires NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key in .env.local.
 */
export const SUPABASE_ENABLED = true;

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_ENABLED) return false;

  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublishableKey()
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export const SUPABASE_DISABLED_MESSAGE =
  "Supabase is disabled. Set SUPABASE_ENABLED = true in lib/supabase/config.ts and configure .env.local.";
