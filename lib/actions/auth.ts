"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";

export async function signInWithEmail(
  email: string,
  password: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return failure(error.message);
  return success(undefined);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  });
  if (error) return failure(error.message);
  return success(undefined);
}

export async function signInWithOAuth(
  provider: "google" | "apple",
  locale: string
): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/auth/callback?locale=${locale}`,
    },
  });

  if (error) return failure(error.message);
  if (!data.url) return failure("Failed to get OAuth URL");
  return success({ url: data.url });
}

export async function signOut(locale: string): Promise<void> {
  const disabled = supabaseDisabled();
  if (!disabled) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(`/${locale}/map`);
}

export async function updateProfile(data: {
  displayName?: string;
  preferredLocale?: "en" | "ro";
  newsletterOptIn?: boolean;
}): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return failure("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(data.displayName !== undefined && { display_name: data.displayName }),
      ...(data.preferredLocale !== undefined && {
        preferred_locale: data.preferredLocale,
      }),
      ...(data.newsletterOptIn !== undefined && {
        newsletter_opt_in: data.newsletterOptIn,
      }),
    })
    .eq("id", user.id);

  if (error) return failure(error.message);
  return success(undefined);
}
