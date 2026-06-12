import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getBusinessAnalytics } from "@/lib/queries/analytics";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const analytics = session.businessAccountId
    ? await getBusinessAnalytics(session.businessAccountId)
    : null;

  void analytics;

  return (
    <main data-route="business-dashboard">
      {/* UI: implement business overview here */}
      {/* Server data: getBusinessAnalytics(businessAccountId) */}
    </main>
  );
}
