import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro"; id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  void id;

  return (
    <main data-route="business-events-edit">
      {/* UI: implement edit event form here */}
      {/* Actions: updateEvent, submitEventForApproval */}
    </main>
  );
}
