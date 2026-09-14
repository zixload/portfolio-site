"use client";

import Image from "next/image";
import { useState } from "react";
import type { Interest } from "@/lib/content";

// Léger désordre dans l'éventail de cartes, pour que ça ne fasse pas grille.
const TILTS = [-4.5, 1.5, 5];

function InterestTerm({ interest }: { interest: Interest }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <span className="cursor-default underline decoration-dotted decoration-zinc-300 underline-offset-4 transition-colors hover:text-[var(--accent)]">
        {interest.label}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 flex w-max -translate-x-1/2 gap-2"
      >
        {interest.images.map((src, index) => (
          <span
            key={src}
            className="block shrink-0 overflow-hidden rounded-sm bg-zinc-100 shadow-md transition-all duration-300 ease-out"
            style={{
              opacity: open ? 1 : 0,
              transform: open
                ? `translateY(0) rotate(${TILTS[index % TILTS.length]}deg)`
                : "translateY(10px) rotate(0deg)",
              transitionDelay: `${open ? index * 55 : 0}ms`,
            }}
          >
            <Image
              src={src}
              alt=""
              width={72}
              height={96}
              className="h-24 w-[4.5rem] object-cover"
            />
          </span>
        ))}
      </span>
    </span>
  );
}

export function Interests({
  heading,
  items,
}: {
  heading: string;
  items: Interest[];
}) {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {heading} :{" "}
      {items.map((interest, index) => (
        <span key={interest.label}>
          {index > 0 && ", "}
          <InterestTerm interest={interest} />
        </span>
      ))}
    </p>
  );
}
