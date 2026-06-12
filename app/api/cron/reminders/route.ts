import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sent: 0, skipped: "supabase_disabled" });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { sendEventReminderEmail } = await import("@/lib/notifications/email");
  const { getLocalizedField } = await import("@/lib/i18n/content");
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: reminders, error } = await admin
    .from("event_reminders")
    .select("id, user_id, event_id, remind_at")
    .lte("remind_at", now)
    .is("sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const reminder of reminders ?? []) {
    const { data: event } = await admin
      .from("events")
      .select("translations, starts_at")
      .eq("id", reminder.event_id)
      .single();

    if (!event) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(
      reminder.user_id
    );
    if (!authUser?.user?.email) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("preferred_locale")
      .eq("id", reminder.user_id)
      .single();

    const locale = (profile?.preferred_locale as "en" | "ro") ?? "en";
    const title = getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    );

    await sendEventReminderEmail(
      authUser.user.email,
      title,
      event.starts_at,
      locale
    );

    await admin
      .from("event_reminders")
      .update({ sent_at: now })
      .eq("id", reminder.id);

    sent++;
  }

  return NextResponse.json({ sent });
}
