import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import { getDateRange } from "@/lib/filters/event-filters";
import { eventsToGeoJSON } from "@/lib/maps/geojson";
import type { Locale } from "@/types";
import type {
  CalendarDayEvents,
  EventDetail,
  EventFilters,
  EventListItem,
  EventsGeoJSON,
} from "@/types/events";
import type { Tables } from "@/types/database.types";
import { getSession } from "@/lib/auth/session";
import {
  getMockCalendarEvents,
  getMockEventBySlug,
  getMockEvents,
  getMockEventsGeoJSON,
} from "@/lib/mocks/data";

type EventRow = Tables<"events">;

function mapEventToListItem(event: EventRow, locale: Locale): EventListItem {
  return {
    id: event.id,
    slug: event.slug,
    title: getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    venueName: event.venue_name ?? "",
    price: event.price,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    coverImageUrl: event.cover_image_url,
    genre: event.genre as EventListItem["genre"],
    eventType: event.event_type as EventListItem["eventType"],
    isPromoted: event.is_promoted,
    promotionIntensity: event.promotion_intensity as 1 | 2 | 3,
    lat: event.lat,
    lng: event.lng,
  };
}

async function buildEventsQuery(
  filters: EventFilters,
  status: string = "published"
) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", status)
    .order("is_promoted", { ascending: false })
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.eq("genre", filters.genre);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.promotedOnly) query = query.eq("is_promoted", true);

  const dateRange = getDateRange(filters);
  if (dateRange) {
    query = query
      .gte("starts_at", dateRange.start.toISOString())
      .lte("starts_at", dateRange.end.toISOString());
  }

  if (filters.search) {
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "simple",
    });
  }

  return query;
}

export async function getEvents(
  locale: Locale,
  filters: EventFilters = {}
): Promise<EventListItem[]> {
  if (!isSupabaseConfigured()) return getMockEvents(locale, filters);

  const { data, error } = await buildEventsQuery(filters);
  if (error) throw error;

  let events = data ?? [];

  if (filters.distanceKm && filters.lat && filters.lng) {
    const { data: nearby, error: distError } = await (
      await createClient()
    ).rpc("events_within_distance", {
      p_lat: filters.lat,
      p_lng: filters.lng,
      p_distance_km: filters.distanceKm,
    });
    if (distError) throw distError;
    const nearbyIds = new Set((nearby ?? []).map((e: EventRow) => e.id));
    events = events.filter((e) => nearbyIds.has(e.id));
  }

  return events.map((e) => mapEventToListItem(e, locale));
}

export async function getEventsGeoJSON(
  locale: Locale,
  filters: EventFilters = {}
): Promise<EventsGeoJSON> {
  if (!isSupabaseConfigured()) return getMockEventsGeoJSON(locale, filters);

  const supabase = await createClient();
  const { data, error } = await buildEventsQuery(filters);
  if (error) throw error;
  return eventsToGeoJSON(data ?? [], locale);
}

export async function getEventBySlug(
  slug: string,
  locale: Locale
): Promise<EventDetail | null> {
  if (!isSupabaseConfigured()) return getMockEventBySlug(slug, locale);

  const supabase = await createClient();
  const session = await getSession();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !event) return null;

  let isSaved = false;
  if (session.userId) {
    const { data: save } = await supabase
      .from("event_saves")
      .select("id")
      .eq("user_id", session.userId)
      .eq("event_id", event.id)
      .maybeSingle();
    isSaved = !!save;
  }

  const listItem = mapEventToListItem(event, locale);

  return {
    ...listItem,
    description: getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    address: event.address ?? "",
    ticketUrl: event.ticket_url,
    images: event.images ?? [],
    organizerName: null,
    isSaved,
  };
}

export async function getCalendarEvents(
  locale: Locale,
  month: number,
  year: number,
  filters: EventFilters = {}
): Promise<CalendarDayEvents[]> {
  if (!isSupabaseConfigured()) {
    return getMockCalendarEvents(locale, month, year, filters);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.eq("genre", filters.genre);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);

  const { data, error } = await query;
  if (error) throw error;

  const byDate = new Map<string, EventListItem[]>();
  for (const event of data ?? []) {
    const dateKey = event.starts_at.split("T")[0];
    const items = byDate.get(dateKey) ?? [];
    items.push(mapEventToListItem(event, locale));
    byDate.set(dateKey, items);
  }

  return Array.from(byDate.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}

export async function getSavedEvents(
  locale: Locale
): Promise<EventListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const session = await getSession();
  if (!session.userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_saves")
    .select("event_id, events(*)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.events as unknown as EventRow)
    .filter(Boolean)
    .map((e) => mapEventToListItem(e, locale));
}

export async function getBusinessEvents(
  businessAccountId: string,
  locale: Locale
): Promise<(EventListItem & { status: string })[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("business_account_id", businessAccountId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...mapEventToListItem(e, locale),
    status: e.status,
  }));
}

export async function getPendingEvents(locale: Locale): Promise<
  (EventListItem & { status: string; rejectionReason: string | null })[]
> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...mapEventToListItem(e, locale),
    status: e.status,
    rejectionReason: e.rejection_reason,
  }));
}
