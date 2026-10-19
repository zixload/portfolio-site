"use client";

import Link from "next/link";
import { useState } from "react";
import { EntryThumb } from "@/components/entry-thumb";
import { SlidingHighlight } from "@/components/sliding-highlight";
import { WipBadge } from "@/components/wip-badge";
import { Entry } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";

function EntryDate({ entry, locale }: { entry: Entry; locale: "fr" | "en" }) {
  return (
    <time
      dateTime={entry.date}
      className="shrink-0 text-sm tabular-nums text-zinc-400 dark:text-zinc-500 sm:w-24"
    >
      {formatDate(entry.date, locale)}
    </time>
  );
}

function EntryTitle({ entry }: { entry: Entry }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-zinc-900 group-hover:text-[var(--accent)] dark:text-zinc-100">
        {entry.title}
      </span>
      {entry.wip && <WipBadge />}
    </span>
  );
}

function EntryBody({
  entry,
  locale,
  showThumb,
}: {
  entry: Entry;
  locale: "fr" | "en";
  showThumb: boolean;
}) {
  return (
    <>
      <EntryDate entry={entry} locale={locale} />
      {showThumb && (
        <EntryThumb
          slug={entry.slug}
          src={entry.image}
          className="h-12 w-20 self-start"
        />
      )}
      <div className="flex flex-col gap-0.5">
        <EntryTitle entry={entry} />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {entry.description}
        </span>
      </div>
    </>
  );
}

/**
 * Entrée sans lien : le résumé est replié et se déroule au clic. L'astuce des
 * lignes de grille 0fr → 1fr permet d'animer vers la hauteur réelle du texte,
 * ce qu'une `max-height` en dur ne sait pas faire proprement.
 */
function ExpandableEntry({
  entry,
  locale,
  showThumb,
}: {
  entry: Entry;
  locale: "fr" | "en";
  showThumb: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      data-highlight
      className={`${wrapperClassName} text-left`}
    >
      <EntryDate entry={entry} locale={locale} />
      {showThumb && (
        <EntryThumb
          slug={entry.slug}
          src={entry.image}
          className="h-12 w-20 self-start"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start gap-2">
          <EntryTitle entry={entry} />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform duration-300 dark:text-zinc-600"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <span className="block pt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {entry.description}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

const wrapperClassName =
  "entry-row group flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4";

export function EntryList({
  entries,
  showThumbs = true,
}: {
  entries: Entry[];
  showThumbs?: boolean; // les vignettes n'ont pas de sens partout (ex. Recherche)
}) {
  const { locale } = useLocale();
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SlidingHighlight>
      <ul className="flex flex-col gap-6">
        {sorted.map((entry) => (
          <li key={entry.slug} className="flex items-baseline gap-2">
            {entry.post ? (
              <Link
                href={`/blog/${entry.slug}`}
                className={wrapperClassName}
                data-highlight
              >
                <EntryBody
                  entry={entry}
                  locale={locale}
                  showThumb={showThumbs}
                />
              </Link>
            ) : entry.href ? (
              <a
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                className={wrapperClassName}
                data-highlight
              >
                <EntryBody
                  entry={entry}
                  locale={locale}
                  showThumb={showThumbs}
                />
              </a>
            ) : (
              <ExpandableEntry
                entry={entry}
                locale={locale}
                showThumb={showThumbs}
              />
            )}
          </li>
        ))}
      </ul>
    </SlidingHighlight>
  );
}
