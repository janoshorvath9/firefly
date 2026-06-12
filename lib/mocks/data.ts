import type { Locale } from "@/types";
import type {
  CalendarDayEvents,
  EventDetail,
  EventFilters,
  EventListItem,
  EventsGeoJSON,
} from "@/types/events";
import { eventImages } from "@/lib/landing/images";
import type { FeedPostItem } from "@/lib/queries/feed";
import { getDateRange } from "@/lib/filters/event-filters";
import { eventsToGeoJSON } from "@/lib/maps/geojson";
import type { Tables } from "@/types/database.types";

type EventRow = Tables<"events">;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 0, 0, 0);

const dayAfter = new Date(tomorrow);
dayAfter.setDate(dayAfter.getDate() + 1);
dayAfter.setHours(6, 0, 0, 0);

const weekend = new Date();
weekend.setDate(weekend.getDate() + 3);
weekend.setHours(22, 0, 0, 0);

function row(
  partial: Partial<EventRow> & Pick<EventRow, "id" | "slug" | "translations">
): EventRow {
  return {
    business_account_id: null,
    venue_id: null,
    status: "published",
    source: "admin",
    ends_at: dayAfter.toISOString(),
    genre: "techno",
    event_type: "club_night",
    price: 50,
    ticket_url: "https://example.com/tickets",
    cover_image_url: null,
    images: [],
    is_promoted: false,
    promotion_intensity: 1,
    rejection_reason: null,
    lat: 44.4378,
    lng: 26.0966,
    address: "Strada Academiei 19, Bucharest",
    venue_name: "Control Club",
    search_vector: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    starts_at: tomorrow.toISOString(),
    ...partial,
  };
}

const MOCK_EVENT_ROWS: EventRow[] = [
  row({
    id: "mock-1",
    slug: "techno-night-control-club",
    genre: "techno",
    event_type: "club_night",
    is_promoted: true,
    promotion_intensity: 3,
    cover_image_url: eventImages.event1,
    translations: {
      en: {
        title: "Techno Night at Control Club",
        description: "Underground techno all night long.",
      },
      ro: {
        title: "Noapte Techno la Control Club",
        description: "Techno underground toată noaptea.",
      },
    },
  }),
  row({
    id: "mock-2",
    slug: "house-garden-kulturhaus",
    genre: "house",
    event_type: "party",
    lat: 44.4268,
    lng: 26.1025,
    address: "Strada Blănari 21, Bucharest",
    venue_name: "Kulturhaus",
    starts_at: weekend.toISOString(),
    ends_at: new Date(weekend.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    price: 40,
    cover_image_url: eventImages.event4,
    translations: {
      en: {
        title: "House Garden Party",
        description: "Open air house music experience.",
      },
      ro: {
        title: "Petrecere House în Grădină",
        description: "Experiență house music în aer liber.",
      },
    },
  }),
  row({
    id: "mock-3",
    slug: "afro-house-rooftop",
    genre: "afro_house",
    event_type: "rooftop",
    is_promoted: true,
    promotion_intensity: 2,
    lat: 44.4412,
    lng: 26.0898,
    address: "Calea Victoriei 155, Bucharest",
    venue_name: "Sky Lounge",
    price: 60,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Afro House Rooftop Sunset",
        description: "Sunset session with afro house vibes.",
      },
      ro: {
        title: "Afro House Rooftop Apus",
        description: "Sesiune la apus cu vibe-uri afro house.",
      },
    },
  }),
  row({
    id: "mock-4",
    slug: "subterra-all-night-long",
    genre: "techno",
    event_type: "club_night",
    is_promoted: true,
    promotion_intensity: 3,
    lat: 44.4355,
    lng: 26.0988,
    address: "Strada Gabroveni 50, Bucharest",
    venue_name: "Subterra",
    price: 35,
    cover_image_url: eventImages.event2,
    starts_at: tomorrow.toISOString(),
    translations: {
      en: {
        title: "Subterra: All Night Long",
        description: "Warehouse techno until sunrise.",
      },
      ro: {
        title: "Subterra: Toată Noaptea",
        description: "Techno warehouse până la răsărit.",
      },
    },
  }),
  row({
    id: "mock-5",
    slug: "jazz-cellar-friday",
    genre: "jazz",
    event_type: "live_performance",
    lat: 44.4298,
    lng: 26.1042,
    address: "Strada Franceză 62, Bucharest",
    venue_name: "Green Hours",
    price: 45,
    cover_image_url: eventImages.event3,
    starts_at: new Date(weekend.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Jazz Cellar Sessions",
        description: "Intimate live jazz in the Old Town.",
      },
      ro: {
        title: "Sesiuni Jazz Cellar",
        description: "Jazz live intim în Centrul Vechi.",
      },
    },
  }),
];

function mapRowToListItem(event: EventRow, locale: Locale): EventListItem {
  const t = event.translations as Record<string, { title?: string }>;
  return {
    id: event.id,
    slug: event.slug,
    title: t[locale]?.title ?? t.en?.title ?? "",
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

function filterMockEvents(
  events: EventRow[],
  filters: EventFilters
): EventRow[] {
  let result = [...events];

  if (filters.genre) {
    result = result.filter((e) => e.genre === filters.genre);
  }
  if (filters.eventType) {
    result = result.filter((e) => e.event_type === filters.eventType);
  }
  if (filters.promotedOnly) {
    result = result.filter((e) => e.is_promoted);
  }

  const dateRange = getDateRange(filters);
  if (dateRange) {
    result = result.filter((e) => {
      const start = new Date(e.starts_at);
      return start >= dateRange.start && start <= dateRange.end;
    });
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((e) => {
      const t = e.translations as Record<string, { title?: string }>;
      const title = `${t.en?.title ?? ""} ${t.ro?.title ?? ""}`.toLowerCase();
      return title.includes(q) || (e.venue_name ?? "").toLowerCase().includes(q);
    });
  }

  return result.sort((a, b) => {
    if (a.is_promoted !== b.is_promoted) return a.is_promoted ? -1 : 1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });
}

export function getMockEvents(
  locale: Locale,
  filters: EventFilters = {}
): EventListItem[] {
  return filterMockEvents(MOCK_EVENT_ROWS, filters).map((e) =>
    mapRowToListItem(e, locale)
  );
}

export function getMockEventsGeoJSON(
  locale: Locale,
  filters: EventFilters = {}
): EventsGeoJSON {
  const filtered = filterMockEvents(MOCK_EVENT_ROWS, filters);
  return eventsToGeoJSON(filtered, locale);
}

export function getMockEventBySlug(
  slug: string,
  locale: Locale
): EventDetail | null {
  const event = MOCK_EVENT_ROWS.find((e) => e.slug === slug);
  if (!event) return null;

  const t = event.translations as Record<
    string,
    { title?: string; description?: string }
  >;

  return {
    ...mapRowToListItem(event, locale),
    description: t[locale]?.description ?? t.en?.description ?? "",
    address: event.address ?? "",
    ticketUrl: event.ticket_url,
    images: event.images ?? [],
    organizerName: null,
    isSaved: false,
  };
}

export function getMockCalendarEvents(
  locale: Locale,
  month: number,
  year: number,
  filters: EventFilters = {}
): CalendarDayEvents[] {
  const filtered = filterMockEvents(MOCK_EVENT_ROWS, filters).filter((e) => {
    const d = new Date(e.starts_at);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const byDate = new Map<string, EventListItem[]>();
  for (const event of filtered) {
    const dateKey = event.starts_at.split("T")[0];
    const items = byDate.get(dateKey) ?? [];
    items.push(mapRowToListItem(event, locale));
    byDate.set(dateKey, items);
  }

  return Array.from(byDate.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}

export function getMockFeedPosts(locale: Locale): FeedPostItem[] {
  return [
    {
      id: "mock-post-1",
      category: "party_updates",
      title: locale === "ro" ? "Sold out: Techno Night" : "Sold out: Techno Night",
      description:
        locale === "ro"
          ? "Ultimele bilete epuizate la Control Club."
          : "Last tickets sold out at Control Club.",
      mediaUrl: null,
      publishedAt: new Date().toISOString(),
      isPromoted: false,
    },
    {
      id: "mock-post-2",
      category: "nightlife_news",
      title: locale === "ro" ? "Deschidere rooftop nou" : "New rooftop opening",
      description:
        locale === "ro"
          ? "Sky Lounge deschide sezonul de vară."
          : "Sky Lounge kicks off the summer season.",
      mediaUrl: null,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      isPromoted: false,
    },
  ];
}
