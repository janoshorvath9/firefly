import { setRequestLocale } from "next-intl/server";
import { SavedPageClient } from "@/components/saved/saved-page";
import { getEvents, getSavedEvents } from "@/lib/queries/events";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Saved",
    "Your jar of nights to come.",
    locale,
    "/saved"
  );
}

export default async function SavedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [events, serverSaved] = await Promise.all([
    getEvents(locale),
    getSavedEvents(locale),
  ]);

  return (
    <SavedPageClient
      events={events}
      serverSavedIds={serverSaved.map((event) => event.id)}
    />
  );
}
