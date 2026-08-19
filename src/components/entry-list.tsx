"use client";

import { Entry } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";

export function EntryList({ entries }: { entries: Entry[] }) {
  const { locale } = useLocale();
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <ul className="flex flex-col gap-6">
      {sorted.map((entry) => {
        const Wrapper = entry.href ? "a" : "div";
        const wrapperProps = entry.href
          ? { href: entry.href, target: "_blank", rel: "noopener noreferrer" }
          : {};
        return (
          <li key={entry.slug}>
            <Wrapper
              {...wrapperProps}
              className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
            >
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
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
}
