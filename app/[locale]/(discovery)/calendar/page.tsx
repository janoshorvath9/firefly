import { setRequestLocale } from "next-intl/server";
import { CalendarPageClient } from "@/components/calendar/calendar-page";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Calendar",
    "Plan your nights, one glow at a time.",
    locale,
    "/calendar"
  );
}

export default async function CalendarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = await getEvents(locale);

  return <CalendarPageClient events={events} />;
}
