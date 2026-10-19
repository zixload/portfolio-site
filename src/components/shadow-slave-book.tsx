"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { media } from "@/lib/content";
import { useContent, useLocale } from "@/lib/locale-context";

type PageIllustration = {
  src: string;
  alt: string;
  shape: "opening" | "portrait" | "wide" | "rider";
};

type BookPage =
  | {
      kind: "abstract";
      label: string;
      title: string;
      author: string;
      heading: string;
      text: string;
      illustration: PageIllustration;
    }
  | {
      kind: "quote";
      paragraphs: string[];
      attribution: string;
      illustrations?: PageIllustration[];
    };

function PageArt({ illustration }: { illustration: PageIllustration }) {
  return (
    <figure className={`shadow-book__page-art shadow-book__page-art--${illustration.shape}`}>
      <Image
        src={illustration.src}
        alt={illustration.alt}
        fill
        sizes="(max-width: 640px) 42vw, 330px"
      />
    </figure>
  );
}

function PageContent({ page, number }: { page?: BookPage; number: number }) {
  if (!page) {
    return <div className="shadow-book__page-content" aria-hidden="true" />;
  }

  if (page.kind === "abstract") {
    return (
      <div className="shadow-book__page-content shadow-book__page-content--abstract">
        <span className="shadow-book__eyebrow">{page.label}</span>
        <h2>{page.title}</h2>
        <p className="shadow-book__author">{page.author}</p>
        <div className="shadow-book__rule" />
        <PageArt illustration={page.illustration} />
        <h3>{page.heading}</h3>
        <p className="shadow-book__abstract">{page.text}</p>
        <span className="shadow-book__folio">{String(number).padStart(2, "0")}</span>
      </div>
    );
  }

  return (
    <div className="shadow-book__page-content shadow-book__page-content--quote">
      <span className="shadow-book__eyebrow">Excerpt</span>
      <blockquote className="shadow-book__quote">
        {page.paragraphs.map((paragraph, index) => (
          <p key={`${number}-${index}`}>{paragraph}</p>
        ))}
      </blockquote>
      <p className="shadow-book__attribution">{page.attribution}</p>
      {page.illustrations?.length === 1 ? (
        <PageArt illustration={page.illustrations[0]} />
      ) : page.illustrations?.length ? (
        <div className="shadow-book__page-art-gallery">
          {page.illustrations.map((illustration) => (
            <PageArt key={illustration.src} illustration={illustration} />
          ))}
        </div>
      ) : null}
      <span className="shadow-book__folio">{String(number).padStart(2, "0")}</span>
    </div>
  );
}

export function ShadowSlaveBook({ compact = false }: { compact?: boolean }) {
  const { currentlyReading } = useContent();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [opened, setOpened] = useState(false);
  const [spread, setSpread] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pages: BookPage[] = [
    {
      kind: "abstract",
      label: currentlyReading.label,
      title: currentlyReading.title,
      author: currentlyReading.author,
      heading: currentlyReading.abstractLabel,
      text: currentlyReading.abstract,
      illustration: {
        src: media.currentlyReadingIllustration,
        alt: "The Forgotten Shore and the Dark City",
        shape: "opening",
      },
    },
    {
      kind: "quote",
      paragraphs: [
        "A nameless slave ascended the Black Mountain. Both heroes and monsters fell by his hand. Unbroken, he entered the ruined temple of a long-forgotten god and spilled his blood on the sacred altar. The gods were dead, and yet they listened.",
      ],
      attribution: "Chapter 15, Shadow Slave",
      illustrations: [
        {
          src: "/media/shadow-slave-page-2.webp",
          alt: "A frozen ruined temple beneath a pale light",
          shape: "wide",
        },
      ],
    },
    {
      kind: "quote",
      paragraphs: [currentlyReading.quote],
      attribution: currentlyReading.quoteNote,
      illustrations: [
        {
          src: "/media/shadow-slave-page-3.webp",
          alt: "Nephis, the Star of Ruin",
          shape: "portrait",
        },
      ],
    },
    {
      kind: "quote",
      paragraphs: [
        "Sunny gritted his teeth, ignoring the Sin of Solace. The cursed sword remained silent for a while, observing him.",
        "Eventually, it asked: “So, did you find it? Conviction? Or whatever it was you've been searching for?”",
        "Sunny spared the vague shape a glance, then continued digging. “No… no, I didn't find crap.”",
        "He wiped his face with an elbow. “Actually, that's not true. I did find something. I found out that I was right all along!”",
      ],
      attribution: "Chapter 1060, The Fall of Falcon Scott (78)",
      illustrations: [
        {
          src: "/media/shadow-slave-page-4-arctic-worm.webp",
          alt: "A warrior facing the Arctic Abundance",
          shape: "wide",
        },
      ],
    },
    {
      kind: "quote",
      paragraphs: [
        "Who are you to dare stare me down, beast? I am Lost from Light, who was born from the shadows. I am the rightful heir of death and the bastard son of fate. Wherever I go, ruin follows. If you had any sense, you would have run away as soon as you saw me.",
      ],
      attribution: "To Azure Serpent — Chapter 1274, Time of Truth",
      illustrations: [
        {
          src: "/media/shadow-slave-page-5.webp",
          alt: "A warrior confronting a frozen giant",
          shape: "wide",
        },
      ],
    },
  ];
  const spreadCount = Math.ceil(pages.length / 2);
  const leftIndex = spread * 2;

  const openBook = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSpread(0);
    setMounted(true);
  };

  const closeBook = useCallback(() => {
    setOpened(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), 520);
  }, []);

  const previousPages = useCallback(() => {
    setSpread((current) => Math.max(0, current - 1));
  }, []);
  const nextPages = useCallback(() => {
    setSpread((current) => Math.min(spreadCount - 1, current + 1));
  }, [spreadCount]);

  useEffect(() => {
    if (!mounted) return;

    const openingFrame = requestAnimationFrame(() => setOpened(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBook();
      if (event.key === "ArrowLeft") previousPages();
      if (event.key === "ArrowRight") nextPages();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(openingFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeBook, mounted, nextPages, previousPages]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <div
        className={`shadow-book-teaser${
          compact ? " shadow-book-teaser--compact" : ""
        }`}
      >
        <button
          type="button"
          className="shadow-book-teaser__cover"
          onClick={openBook}
          aria-haspopup="dialog"
          aria-label={
            locale === "fr"
              ? `Ouvrir ${currentlyReading.title}`
              : `Open ${currentlyReading.title}`
          }
        >
          <Image
            src={media.currentlyReadingCover}
            alt={`${currentlyReading.title} cover`}
            width={138}
            height={184}
            sizes="138px"
          />
        </button>

        <div className="shadow-book-teaser__note" aria-hidden="true">
          <span>click here</span>
          <svg viewBox="0 0 120 70">
            <path d="M108 8C79 9 61 20 53 37c-6 13-16 20-36 19" />
            <path d="m28 46-12 10 14 7" />
          </svg>
        </div>
      </div>

      {mounted
        ? createPortal(
            <div
              className={`shadow-book-dialog${opened ? " is-open" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={`${currentlyReading.title} - ${currentlyReading.author}`}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeBook();
              }}
            >
              <button
                type="button"
                className="shadow-book-dialog__close"
                onClick={closeBook}
                autoFocus
              >
                {locale === "fr" ? "Fermer" : "Close"} <span aria-hidden="true">&times;</span>
              </button>

              <div className="shadow-book-stage">
                <div className="shadow-book">
                  <article className="shadow-book__page shadow-book__page--right">
                    <PageContent
                      key={`right-${leftIndex + 1}`}
                      page={pages[leftIndex + 1]}
                      number={leftIndex + 2}
                    />
                  </article>

                  <div className="shadow-book__cover">
                    <div className="shadow-book__cover-face shadow-book__cover-front">
                      <Image
                        src={media.currentlyReadingCover}
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 640px) 46vw, 400px"
                      />
                      <span className="shadow-book__spine" />
                    </div>

                    <article className="shadow-book__cover-face shadow-book__cover-back">
                      <PageContent
                        key={`left-${leftIndex}`}
                        page={pages[leftIndex]}
                        number={leftIndex + 1}
                      />
                    </article>
                  </div>
                </div>

                <nav className="shadow-book__pager" aria-label="Book pages">
                  <button
                    type="button"
                    onClick={previousPages}
                    disabled={spread === 0}
                    aria-label={locale === "fr" ? "Pages precedentes" : "Previous pages"}
                  >
                    &larr;
                  </button>
                  <span>
                    {leftIndex + 1}
                    {leftIndex + 1 < pages.length
                      ? `–${Math.min(leftIndex + 2, pages.length)}`
                      : ""} / {pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={nextPages}
                    disabled={spread === spreadCount - 1}
                    aria-label={locale === "fr" ? "Pages suivantes" : "Next pages"}
                  >
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
