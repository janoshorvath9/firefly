import { setRequestLocale } from "next-intl/server";
import { FeedPageClient } from "@/components/feed/feed-page";
import { getEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Tonight",
    "Every party glowing this week.",
    locale,
    "/feed"
  );
}

export default async function FeedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = await getEvents(locale);

  return <FeedPageClient events={events} />;
}
