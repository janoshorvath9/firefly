import { setRequestLocale } from "next-intl/server";
import { getPendingEvents } from "@/lib/queries/events";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminEventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pendingEvents = await getPendingEvents(locale);
  void pendingEvents;

  return (
    <main data-route="admin-events">
      {/* UI: implement event moderation queue here */}
      {/* Actions: approveEvent, rejectEvent, deleteEvent, createAdminEvent */}
    </main>
  );
}
