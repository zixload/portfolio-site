"use client";

import Link from "next/link";
import { Entry } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { PlatformBadge } from "@/components/platform-badge";
import { useLocale } from "@/lib/locale-context";

function EntryBody({ entry, locale }: { entry: Entry; locale: "fr" | "en" }) {
  return (
    <>
      <time
        dateTime={entry.date}
        className="shrink-0 text-sm tabular-nums text-zinc-400 dark:text-zinc-500 sm:w-24"
      >
        {formatDate(entry.date, locale)}
      </time>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-zinc-900 group-hover:text-[var(--accent)] dark:text-zinc-100">
          {entry.title}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {entry.description}
        </span>
      </div>
    </>
  );
}

const wrapperClassName =
  "group flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4";

export function EntryList({ entries }: { entries: Entry[] }) {
  const { locale } = useLocale();
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <ul className="flex flex-col gap-6">
      {sorted.map((entry) => (
        <li key={entry.slug} className="flex items-baseline gap-2">
          {entry.post ? (
            <Link href={`/blog/${entry.slug}`} className={wrapperClassName}>
              <EntryBody entry={entry} locale={locale} />
            </Link>
          ) : entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className={wrapperClassName}
            >
              <EntryBody entry={entry} locale={locale} />
            </a>
          ) : (
            <div className={wrapperClassName}>
              <EntryBody entry={entry} locale={locale} />
            </div>
          )}
          {entry.platform && <PlatformBadge platform={entry.platform} />}
        </li>
      ))}
    </ul>
  );
}
