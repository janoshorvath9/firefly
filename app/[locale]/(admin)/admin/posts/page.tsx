import { setRequestLocale } from "next-intl/server";
import { getPendingFeedPosts } from "@/lib/queries/feed";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function AdminPostsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const pendingPosts = await getPendingFeedPosts(locale);
  void pendingPosts;

  return (
    <main data-route="admin-posts">
      {/* UI: implement feed post moderation here */}
      {/* Actions: publishFeedPost, rejectFeedPost */}
    </main>
  );
}
