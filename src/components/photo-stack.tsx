"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Photo = { src: string; alt: string };

const STACK_ANGLES = [-2.2, 1.4, -0.8, 2.1, -1.3];

export function PhotoStack({ images }: { images: Photo[] }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openStack = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIndex(0);
    setMounted(true);
  };

  const closeStack = useCallback(() => {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), 280);
  }, []);

  const previous = useCallback(
    () => setIndex((current) => (current - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIndex((current) => (current + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!mounted) return;

    const openingFrame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeStack();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(openingFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeStack, mounted, next, previous]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={openStack}
        aria-label="Voir les captures"
        className="relative h-28 w-24 shrink-0 cursor-zoom-in"
      >
        {images.map((image, imageIndex) => (
          <span
            key={image.src}
            className="absolute inset-0 overflow-hidden rounded-md border-2 border-white shadow-md dark:border-zinc-900"
            style={{
              transform: `translate(${imageIndex * 3}px, ${imageIndex * 3}px) rotate(${STACK_ANGLES[imageIndex % STACK_ANGLES.length]}deg)`,
              zIndex: images.length - imageIndex,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={96}
              height={128}
              className="h-full w-full object-cover"
            />
          </span>
        ))}
      </button>

      {mounted
        ? createPortal(
            <div
              className={`media-lightbox media-lightbox--gallery${visible ? " is-open" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label="Captures League of Legends"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeStack();
              }}
            >
              <Image
                key={images[index].src}
                src={images[index].src}
                alt={images[index].alt}
                width={1270}
                height={712}
                className="media-lightbox__image"
                priority
                onMouseDown={(event) => event.stopPropagation()}
              />
              <div className="media-lightbox__controls">
                <button type="button" aria-label="Precedent" onClick={previous}>
                  &larr;
                </button>
                <span>{index + 1} / {images.length}</span>
                <button type="button" aria-label="Suivant" onClick={next}>
                  &rarr;
                </button>
              </div>
              <button
                type="button"
                className="media-lightbox__close"
                onClick={closeStack}
                aria-label="Fermer la galerie"
                autoFocus
              >
                &times;
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
