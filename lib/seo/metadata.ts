import type { Metadata } from "next";
import type { Locale } from "@/types";

type EventMetadataInput = {
  title: string;
  description: string;
  slug: string;
  coverImageUrl?: string | null;
  locale: Locale;
};

export function generateEventMetadata({
  title,
  description,
  slug,
  coverImageUrl,
  locale,
}: EventMetadataInput): Metadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/${locale}/events/${slug}`;

  return {
    title: `${title} | Firefly`,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${appUrl}/en/events/${slug}`,
        ro: `${appUrl}/ro/events/${slug}`,
        "x-default": `${appUrl}/en/events/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Firefly",
      locale: locale === "ro" ? "ro_RO" : "en_US",
      type: "website",
      images: coverImageUrl ? [{ url: coverImageUrl }] : [],
    },
  };
}

export function generatePageMetadata(
  title: string,
  description: string,
  locale: Locale,
  path: string
): Metadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    title: `${title} | Firefly`,
    description,
    alternates: {
      canonical: `${appUrl}/${locale}${path}`,
      languages: {
        en: `${appUrl}/en${path}`,
        ro: `${appUrl}/ro${path}`,
        "x-default": `${appUrl}/en${path}`,
      },
    },
  };
}
