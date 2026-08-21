"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Photo = { src: string; alt: string };

export function PhotoStack({ images }: { images: Photo[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, images.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        aria-label="Voir les captures"
        className="relative h-28 w-24 shrink-0 cursor-zoom-in"
      >
        {images.map((img, i) => (
          <span
            key={img.src}
            className="absolute inset-0 overflow-hidden rounded-md border-2 border-white shadow-md dark:border-zinc-900"
            style={{
              transform: `translate(${i * 3}px, ${i * 3}px) rotate(${i % 2 === 0 ? i * 2.5 : -i * 2.5}deg)`,
              zIndex: images.length - i,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={96}
              height={128}
              className="h-full w-full object-cover"
            />
          </span>
        ))}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-black/85 p-6"
          onClick={() => setOpen(false)}
        >
          <Image
            src={images[index].src}
            alt={images[index].alt}
            width={1200}
            height={1500}
            className="max-h-[80vh] max-w-full cursor-default rounded-sm object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="flex items-center gap-4 text-white/70"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Précédent"
              onClick={() =>
                setIndex((i) => (i - 1 + images.length) % images.length)
              }
              className="cursor-pointer px-2 hover:text-white"
            >
              ←
            </button>
            <span className="text-sm tabular-nums">
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              aria-label="Suivant"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="cursor-pointer px-2 hover:text-white"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
