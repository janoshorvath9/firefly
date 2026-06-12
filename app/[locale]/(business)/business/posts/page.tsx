import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function BusinessPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main data-route="business-posts">
      {/* UI: implement feed post submission form here */}
      {/* Actions: submitFeedPost, getUploadUrl */}
    </main>
  );
}
