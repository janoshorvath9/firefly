import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  void session;

  return (
    <main data-route="profile">
      {/* UI: implement profile page here */}
      {/* Server data: getSession() */}
      {/* Actions: updateProfile, signOut(locale) */}
    </main>
  );
}
