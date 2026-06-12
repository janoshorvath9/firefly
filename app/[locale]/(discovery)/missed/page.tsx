import { setRequestLocale } from "next-intl/server";
import { getMissedPosts } from "@/lib/queries/feed";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(
    "What did you miss?",
    "Nightlife updates and news",
    locale,
    "/missed"
  );
}

export default async function MissedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await getMissedPosts(locale);
  void posts;

  return (
    <main data-route="missed">
      {/* UI: implement missed feed here */}
      {/* Server data: getMissedPosts(locale) */}
    </main>
  );
}
