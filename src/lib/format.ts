import type { Locale } from "@/lib/content";

export function formatDate(iso: string, locale: Locale = "fr"): string {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
