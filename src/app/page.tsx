"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BioTabs } from "@/components/bio-tabs";
import { EntryThumb } from "@/components/entry-thumb";
import { Interests } from "@/components/interests";
import { RichText } from "@/components/rich-text";
import { SlidingHighlight } from "@/components/sliding-highlight";
import { WipBadge } from "@/components/wip-badge";
import { formatDate } from "@/lib/format";
import { showLongBio } from "@/lib/content";
import { useContent, useLocale } from "@/lib/locale-context";

export default function Home() {
  const c = useContent();
  const { locale } = useLocale();
  // Seulement le journal : les mémoires et papiers de recherche restent sur
  // /recherche, ils n'ont pas à remonter ici.
  const recent = [...c.journal].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-4">
          <div style={{ animation: "fadeUp 0.7s ease-out 180ms both" }}>
            <BioTabs
              short={c.bio}
              extra={[
                ...c.bioLong,
                c.readingBlurb,
                c.combatSportsBlurb,
                c.lolBlurb,
              ]}
              moreLabel={c.bioMoreLabel}
              lessLabel={c.bioLessLabel}
              expandable={showLongBio}
              footer={
                <p className="max-w-xl leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <RichText text={c.githubLine} />
                </p>
              }
            />
          </div>
        </section>

        <section
          className="flex flex-col gap-4"
          style={{ animation: "fadeUp 0.7s ease-out 360ms both" }}
        >
          {/* Même traitement que l'en-tête "Bio" : petit, gris, souligné. */}
          <h2 className="border-b border-zinc-200 pb-2 text-sm font-normal text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            {c.blogsHeading}
          </h2>
          <SlidingHighlight className="flex flex-col">
            {recent.map((entry) => {
              const rowClassName =
                "entry-row group flex flex-1 items-center justify-between gap-6";
              const rowContent = (
                <>
                  <span className="flex min-w-0 items-center gap-3">
                    <EntryThumb slug={entry.slug} src={entry.image} />
                    <span className="text-sm text-zinc-800 group-hover:text-[var(--accent)] dark:text-zinc-200">
                      {entry.title}
                    </span>
                    {entry.wip && <WipBadge />}
                  </span>
                  <time
                    dateTime={entry.date}
                    className="shrink-0 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    {formatDate(entry.date, locale)}
                  </time>
                </>
              );
              let link: ReactNode;
              if (entry.post) {
                link = (
                  <Link
                    href={`/blog/${entry.slug}`}
                    className={rowClassName}
                    data-highlight
                  >
                    {rowContent}
                  </Link>
                );
              } else if (entry.href) {
                link = (
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={rowClassName}
                    data-highlight
                  >
                    {rowContent}
                  </a>
                );
              } else {
                link = <div className={rowClassName}>{rowContent}</div>;
              }
              return (
                <div
                  key={entry.slug}
                  className="flex items-center gap-2 py-3"
                >
                  {link}
                </div>
              );
            })}
          </SlidingHighlight>
        </section>

        <section style={{ animation: "fadeUp 0.7s ease-out 450ms both" }}>
          <Interests
            heading={c.interests.heading}
            items={c.interests.items}
          />
        </section>

    </div>
  );
}
