import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main data-route="admin-users">
      {/* UI: implement user/business management here */}
      {/* Actions: approveBusinessAccount, rejectBusinessAccount, suspendUser */}
    </main>
  );
}
