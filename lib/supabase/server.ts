/**
 * Supabase server client — disabled while SUPABASE_ENABLED = false.
 * Set SUPABASE_ENABLED = true in lib/supabase/config.ts to activate.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import {
  getSupabasePublishableKey,
  isSupabaseConfigured,
  SUPABASE_DISABLED_MESSAGE,
} from "./config";

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_DISABLED_MESSAGE);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
