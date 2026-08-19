"use client";

import Link from "next/link";
import { useContent, useLocale } from "@/lib/locale-context";

export function Nav() {
  const nav = useContent().nav;
  const { locale, setLocale } = useLocale();

  return (
    <header className="w-full">
      <nav className="mx-auto flex max-w-5xl items-center gap-5 px-6 pt-10 text-sm text-zinc-500 dark:text-zinc-400 sm:px-0">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="transition-colors hover:text-[var(--accent)]"
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
          className="ml-auto rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-zinc-800 dark:text-zinc-500"
          aria-label="Switch language"
        >
          {locale === "fr" ? "EN" : "FR"}
        </button>
      </nav>
    </header>
  );
}
