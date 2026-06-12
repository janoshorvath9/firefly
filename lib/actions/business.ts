"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireAuth } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, BusinessType } from "@/types";
import type { CreateFeedPostInput } from "@/types/events";

const registerBusinessSchema = z.object({
  type: z.enum(["venue", "organizer"]),
  name: z.string().min(2),
  venue: z
    .object({
      name: z.string(),
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export async function registerBusinessAccount(
  type: BusinessType,
  name: string,
  venue?: { name: string; address: string; lat: number; lng: number }
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const parsed = registerBusinessSchema.safeParse({ type, name, venue });
    if (!parsed.success) return failure(parsed.error.message);

    if (type === "venue" && !venue) {
      return failure("Venue details required for venue accounts");
    }

    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("business_accounts")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (existing) return failure("Business account already exists");

    const role = type === "venue" ? "business_venue" : "business_organizer";

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (profileError) return failure(profileError.message);

    const { data: business, error } = await supabase
      .from("business_accounts")
      .insert({
        profile_id: userId,
        type,
        name,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return failure(error.message);

    if (type === "venue" && venue) {
      const { error: venueError } = await supabase.from("venues").insert({
        business_account_id: business.id,
        name: venue.name,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
      });
      if (venueError) return failure(venueError.message);
    }

    return success({ id: business.id });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to register business account"
    );
  }
}

export async function submitFeedPost(
  data: CreateFeedPostInput
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from("feed_posts")
      .insert({
        business_account_id: session.businessAccountId,
        category: data.category,
        status: "pending",
        translations: data.translations,
        media_url: data.mediaUrl ?? null,
      })
      .select("id")
      .single();

    if (error) return failure(error.message);
    return success({ id: post.id });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to submit feed post");
  }
}

export async function getUploadUrl(
  bucket: "event-images" | "feed-media",
  fileName: string
): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const disabled = supabaseDisabled<{ signedUrl: string; path: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId && session.role !== "admin") {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const path = `${session.businessAccountId ?? "admin"}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) return failure(error.message);
    return success({ signedUrl: data.signedUrl, path });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to get upload URL");
  }
}

export async function getPublicImageUrl(
  bucket: "event-images" | "feed-media",
  path: string
): Promise<string> {
  const disabled = supabaseDisabled();
  if (disabled) return "";

  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
