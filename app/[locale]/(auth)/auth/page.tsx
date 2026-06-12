import { setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/auth/auth-page";
import { generatePageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
  searchParams: Promise<{ mode?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "Join the Night",
    "Sign in or create a Firefly account to start collecting nights.",
    locale,
    "/auth"
  );
}

export default async function AuthRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  const { mode } = await searchParams;
  setRequestLocale(locale);

  const initialMode = mode === "signup" ? "signup" : "signin";

  return (
    <main data-route="auth">
      <AuthPage locale={locale} initialMode={initialMode} />
    </main>
  );
}
