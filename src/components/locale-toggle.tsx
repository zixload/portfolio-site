"use client";

import { useLocale } from "@/lib/locale-context";

/** Bascule FR/EN réduite à un globe : pas de libellé, juste l'icône. */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={`text-zinc-400 transition-colors hover:text-[var(--accent)] dark:text-zinc-500 ${
        className ?? ""
      }`}
      aria-label={next === "en" ? "Switch to English" : "Passer en français"}
      title={next === "en" ? "English" : "Français"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3Z" />
      </svg>
    </button>
  );
}
