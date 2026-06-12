"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireAuth } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import { trackAnalytics } from "@/lib/actions/analytics";
import type { ActionResult } from "@/types";

export async function saveEvent(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase.from("event_saves").upsert(
      { user_id: userId, event_id: eventId },
      { onConflict: "user_id,event_id" }
    );

    if (error) return failure(error.message);

    await trackAnalytics("save", "event", eventId);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to save event");
  }
}

export async function unsaveEvent(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase
      .from("event_saves")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to unsave event");
  }
}

const reminderSchema = z.object({
  eventId: z.string().uuid(),
  remindAt: z.string().datetime(),
});

export async function setReminder(
  eventId: string,
  remindAt: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const parsed = reminderSchema.safeParse({ eventId, remindAt });
    if (!parsed.success) return failure(parsed.error.message);

    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase.from("event_reminders").upsert(
      { user_id: userId, event_id: eventId, remind_at: remindAt },
      { onConflict: "user_id,event_id" }
    );

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to set reminder");
  }
}

export async function removeReminder(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase
      .from("event_reminders")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to remove reminder");
  }
}
