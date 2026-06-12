import { setRequestLocale } from "next-intl/server";
import { getAdminAnalytics } from "@/lib/queries/analytics";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const analytics = await getAdminAnalytics();
  void analytics;

  return (
    <main data-route="admin-dashboard">
      {/* UI: implement admin analytics dashboard here */}
      {/* Server data: getAdminAnalytics() */}
    </main>
  );
}
