import type { Locale, Translations } from "@/types";

export function getLocalizedField(
  translations: Translations | null | undefined,
  locale: Locale,
  field: "title" | "description" | "venue_name"
): string {
  if (!translations) return "";

  const localized = translations[locale]?.[field];
  if (localized) return localized;

  const fallback = translations.en?.[field] ?? translations.ro?.[field];
  return fallback ?? "";
}
