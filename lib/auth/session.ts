import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SessionInfo } from "@/types/events";
import type { UserRole } from "@/types";

export async function getSession(): Promise<SessionInfo> {
  if (!isSupabaseConfigured()) {
    return {
      userId: null,
      role: "guest",
      email: null,
      displayName: null,
      preferredLocale: "en",
      businessAccountId: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      role: "guest",
      email: null,
      displayName: null,
      preferredLocale: "en",
      businessAccountId: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, preferred_locale")
    .eq("id", user.id)
    .single();

  let businessAccountId: string | null = null;
  if (
    profile?.role === "business_venue" ||
    profile?.role === "business_organizer"
  ) {
    const { data: business } = await supabase
      .from("business_accounts")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    businessAccountId = business?.id ?? null;
  }

  return {
    userId: user.id,
    role: (profile?.role as UserRole) ?? "user",
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    preferredLocale:
      (profile?.preferred_locale as "en" | "ro") ?? "en",
    businessAccountId,
  };
}

export function isBusinessRole(role: string): boolean {
  return role === "business_venue" || role === "business_organizer";
}

export function requireAuth(session: SessionInfo): string {
  if (!session.userId) throw new Error("Authentication required");
  return session.userId;
}

export function requireRole(session: SessionInfo, roles: UserRole[]): void {
  if (!session.userId || !roles.includes(session.role as UserRole)) {
    throw new Error("Insufficient permissions");
  }
}
