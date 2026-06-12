import { isSupabaseConfigured, SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";
import { failure } from "@/lib/utils/action-result";
import type { ActionResult } from "@/types";

export function supabaseDisabled<T = void>(): ActionResult<T> | null {
  if (isSupabaseConfigured()) return null;
  return failure(SUPABASE_DISABLED_MESSAGE);
}
