import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getMockEventBySlug } from "@/lib/mocks/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  if (!isSupabaseConfigured()) {
    // Mock mode: redirect to example ticket URL
    const mock = getMockEventBySlug("techno-night-control-club", "en");
    const url = mock?.ticketUrl ?? "https://example.com/tickets";
    return NextResponse.redirect(url);
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("ticket_url")
    .eq("id", eventId)
    .single();

  if (!event?.ticket_url) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await admin.from("analytics_events").insert({
    type: "ticket_click",
    entity_type: "event",
    entity_id: eventId,
    metadata: { referer: request.headers.get("referer") },
  });

  return NextResponse.redirect(event.ticket_url);
}
