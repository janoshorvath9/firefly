"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, AnalyticsEntityType, AnalyticsType } from "@/types";

export async function trackAnalytics(
  type: AnalyticsType,
  entityType: AnalyticsEntityType,
  entityId: string,
  metadata: Record<string, string | number | boolean | null> = {}
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return success(undefined);

  try {
    const session = await getSession();
    const admin = createAdminClient();

    const { error } = await admin.from("analytics_events").insert({
      type,
      entity_type: entityType,
      entity_id: entityId,
      user_id: session.userId,
      metadata,
    });

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to track analytics");
  }
}

export async function trackView(
  entityType: AnalyticsEntityType,
  entityId: string
): Promise<ActionResult> {
  return trackAnalytics("view", entityType, entityId);
}

export async function trackClick(
  entityType: AnalyticsEntityType,
  entityId: string
): Promise<ActionResult> {
  return trackAnalytics("click", entityType, entityId);
}

export async function trackShare(
  entityType: AnalyticsEntityType,
  entityId: string
): Promise<ActionResult> {
  return trackAnalytics("share", entityType, entityId);
}
