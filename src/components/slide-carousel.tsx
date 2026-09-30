"use client";

import { useRef, useState } from "react";

/**
 * Carrousel de diapositives : une piste qui défile par aimantation (le doigt
 * suffit sur mobile), deux boutons, les flèches du clavier et un compteur.
 * Les images sont numérotées 01.webp, 02.webp… dans `dir`.
 */
export function SlideCarousel({
  dir,
  count,
  label,
}: {
  dir: string;
  count: number;
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const slides = Array.from({ length: count }, (_, i) =>
    `${dir}${String(i + 1).padStart(2, "0")}.webp`
  );

  return (
    <span
      className="slide-carousel"
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <span
        ref={track}
        className="slide-carousel__track"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${label}, diapositive ${i + 1} sur ${count}`}
            loading={i < 2 ? "eager" : "lazy"}
            className="slide-carousel__slide"
          />
        ))}
      </span>

      <span className="slide-carousel__bar">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Diapositive précédente"
          className="slide-carousel__button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <span className="slide-carousel__count" aria-live="polite">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label="Diapositive suivante"
          className="slide-carousel__button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </span>
    </span>
  );
}
