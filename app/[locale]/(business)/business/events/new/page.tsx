import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function NewEventPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main data-route="business-events-new">
      {/* UI: implement create event form here */}
      {/* Actions: createEvent, submitEventForApproval */}
    </main>
  );
}
