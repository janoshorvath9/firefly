import { setRequestLocale } from "next-intl/server";
import { MapPageClient } from "@/components/map/map-page";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Live Map",
    "A living map of tonight's parties across Bucharest.",
    locale,
    "/map"
  );
}

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = await getEvents(locale);

  return <MapPageClient events={events} />;
}
