import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminNewslettersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main data-route="admin-newsletters">
      {/* UI: implement newsletter composer here */}
      {/* Actions: sendNewsletter */}
    </main>
  );
}
