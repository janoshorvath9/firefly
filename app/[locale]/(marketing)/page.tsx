import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/landing/home-page";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Discover Bucharest Nightlife",
    "Find live and upcoming parties in Bucharest",
    locale,
    "/"
  );
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = await getEvents(locale);
  const featured = events.slice(0, 5);

  return <HomePage featured={featured} />;
}
