import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale, FeedPostCategory } from "@/types";
import { getMockFeedPosts } from "@/lib/mocks/data";

export type FeedPostItem = {
  id: string;
  category: FeedPostCategory;
  title: string;
  description: string;
  mediaUrl: string | null;
  publishedAt: string;
  isPromoted: boolean;
};

export async function getFeedPosts(
  locale: Locale,
  limit = 20
): Promise<FeedPostItem[]> {
  if (!isSupabaseConfigured()) return getMockFeedPosts(locale).slice(0, limit);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((post) => ({
    id: post.id,
    category: post.category as FeedPostCategory,
    title: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    description: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    mediaUrl: post.media_url,
    publishedAt: post.published_at ?? post.created_at,
    isPromoted: false,
  }));
}

export async function getMissedPosts(
  locale: Locale,
  limit = 30
): Promise<FeedPostItem[]> {
  return getFeedPosts(locale, limit);
}

export async function getPendingFeedPosts(locale: Locale): Promise<
  (FeedPostItem & { status: string; rejectionReason: string | null })[]
> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((post) => ({
    id: post.id,
    category: post.category as FeedPostCategory,
    title: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    description: getLocalizedField(
      post.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    mediaUrl: post.media_url,
    publishedAt: post.created_at,
    isPromoted: false,
    status: post.status,
    rejectionReason: post.rejection_reason,
  }));
}
