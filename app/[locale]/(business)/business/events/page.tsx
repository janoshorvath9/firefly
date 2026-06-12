import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getBusinessEvents } from "@/lib/queries/events";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessEventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const events = session.businessAccountId
    ? await getBusinessEvents(session.businessAccountId, locale)
    : [];

  void events;

  return (
    <main data-route="business-events">
      {/* UI: implement business events list here */}
    </main>
  );
}
