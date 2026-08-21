"use client";

import Link from "next/link";
import { BioTabs } from "@/components/bio-tabs";
import { ExpandableImage } from "@/components/expandable-image";
import { GithubIcon } from "@/components/github-icon";
import { PhotoStack } from "@/components/photo-stack";
import { ReadingCard } from "@/components/reading-card";
import { formatDate } from "@/lib/format";
import { links, media, site } from "@/lib/content";
import { useContent, useLocale } from "@/lib/locale-context";

const github = links.find((link) => link.label === "GitHub");

export default function Home() {
  const c = useContent();
  const { locale } = useLocale();
  const recent = [...c.research, ...c.journal].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-4">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ animation: "fadeUp 0.7s ease-out 90ms both" }}
          >
            {site.handle}
          </h1>
          <div
            className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400"
            style={{ animation: "fadeUp 0.7s ease-out 180ms both" }}
          >
            {github && (
              <a
                href={github.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]"
              >
                <GithubIcon className="h-4 w-4" />
                zixload
              </a>
            )}
            <a
              href={`mailto:${site.email}`}
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)] dark:decoration-zinc-700"
            >
              email
            </a>
          </div>
          <div style={{ animation: "fadeUp 0.7s ease-out 270ms both" }}>
            <BioTabs
              short={c.bio}
              long={[...c.bio, ...c.bioLong]}
              longExtra={
                <>
                  <ReadingCard />
                  <div className="flex gap-4">
                    <ExpandableImage
                      src={media.combatSportsPhoto}
                      alt={c.combatSportsCaption}
                      width={96}
                      height={128}
                      className="h-32 w-24 rounded-sm shadow-sm"
                      hoverClassName="hover:scale-[1.03] hover:-rotate-[0.5deg]"
                    />
                    <p className="flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {c.combatSportsBlurb}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <p className="flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {c.lolBlurb}
                    </p>
                    <PhotoStack
                      images={media.lolScreens.map((src, i) => ({
                        src,
                        alt: `Rank up screenshot ${i + 1}`,
                      }))}
                    />
                  </div>
                </>
              }
            />
          </div>
        </section>

        <section
          className="flex flex-col gap-4"
          style={{ animation: "fadeUp 0.7s ease-out 360ms both" }}
        >
          <h2 className="text-lg font-bold tracking-tight">
            {c.notesHeading}
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {c.notes.map((note) => (
              <li key={note.href} className="flex items-baseline gap-2">
                <span className="h-1.5 w-1.5 shrink-0 bg-zinc-400 dark:bg-zinc-600" />
                <Link
                  href={note.href}
                  className="text-zinc-700 underline decoration-zinc-300 hover:decoration-[var(--accent)] dark:text-zinc-300 dark:decoration-zinc-700"
                >
                  {note.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="flex flex-col gap-4"
          style={{ animation: "fadeUp 0.7s ease-out 450ms both" }}
        >
          <h2 className="text-lg font-bold tracking-tight">
            {c.blogsHeading}
          </h2>
          <div className="flex flex-col">
            {recent.map((entry) => {
              const rowClassName =
                "group flex items-baseline justify-between gap-6 border-t border-zinc-200 py-3 first:border-t-0 dark:border-zinc-800";
              const rowContent = (
                <>
                  <span className="text-zinc-800 group-hover:text-[var(--accent)] dark:text-zinc-200">
                    {entry.title}
                  </span>
                  <time
                    dateTime={entry.date}
                    className="shrink-0 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    {formatDate(entry.date, locale)}
                  </time>
                </>
              );
              if (entry.post) {
                return (
                  <Link
                    key={entry.slug}
                    href={`/blog/${entry.slug}`}
                    className={rowClassName}
                  >
                    {rowContent}
                  </Link>
                );
              }
              if (entry.href) {
                return (
                  <a
                    key={entry.slug}
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={rowClassName}
                  >
                    {rowContent}
                  </a>
                );
              }
              return (
                <div key={entry.slug} className={rowClassName}>
                  {rowContent}
                </div>
              );
            })}
          </div>
        </section>
    </div>
  );
}
