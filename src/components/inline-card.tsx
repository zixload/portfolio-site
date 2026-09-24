"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { GithubIcon } from "@/components/github-icon";
import type { InlineCard as Card } from "@/lib/content";

// Léger désordre dans l'éventail, pour qu'une pile ne fasse pas grille.
const TILTS = [-6, 2, 7];

function PhotoLayout({ card }: { card: Card }) {
  return (
    <>
      <Image
        src={card.images[0]}
        alt=""
        width={352}
        height={264}
        className="h-32 w-44 rounded-lg object-cover"
      />
      {card.title && <Caption card={card} />}
    </>
  );
}

/** Couverture de livre : format portrait, pour ne pas trancher le titre. */
function CoverLayout({ card }: { card: Card }) {
  return (
    <>
      <Image
        src={card.images[0]}
        alt=""
        width={224}
        height={336}
        className="h-40 w-[6.75rem] rounded-md object-cover shadow-sm"
      />
      {card.title && <Caption card={card} />}
    </>
  );
}

function StackLayout({ card }: { card: Card }) {
  return (
    <>
      <span className="relative block h-32 w-52">
        {card.images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={240}
            height={160}
            className="absolute top-2 h-24 w-32 rounded-md border-2 border-white object-cover shadow-md"
            style={{
              left: `${i * 36}px`,
              transform: `rotate(${TILTS[i % TILTS.length]}deg)`,
              zIndex: i,
            }}
          />
        ))}
      </span>
      {card.title && <Caption card={card} />}
    </>
  );
}

/** Carte de profil, dans l'esprit des cartes de réseaux sociaux : avatar,
 *  nom, identifiant, et le logo en filigrane à droite. */
function ProfileLayout({ card }: { card: Card }) {
  return (
    <span className="relative flex w-64 flex-col gap-3 overflow-hidden rounded-lg bg-gradient-to-b from-zinc-100 to-zinc-200 p-3.5">
      <GithubIcon className="absolute -right-6 -top-4 h-36 w-36 text-white/70" />
      <Image
        src={card.images[0]}
        alt=""
        width={96}
        height={96}
        className="relative h-11 w-11 rounded-lg object-cover shadow-sm"
      />
      <span className="relative flex flex-col">
        <span className="text-sm font-medium text-zinc-800">{card.title}</span>
        {card.subtitle && (
          <span className="text-xs text-zinc-500">{card.subtitle}</span>
        )}
      </span>
      {card.note && (
        <span className="relative text-xs text-zinc-500">{card.note}</span>
      )}
    </span>
  );
}

function Caption({ card }: { card: Card }) {
  return (
    <span className="flex flex-col px-0.5 pt-1.5">
      <span className="text-xs font-medium text-zinc-800">{card.title}</span>
      {card.subtitle && (
        <span className="text-[0.7rem] text-zinc-500">{card.subtitle}</span>
      )}
    </span>
  );
}

/**
 * Mot déclencheur et sa carte, qui apparaît au-dessus au survol ou au focus
 * clavier. La carte ne capte pas la souris : elle n'empêche jamais de lire la
 * ligne du dessus.
 */
export function HoverCard({
  card,
  children,
  className,
}: {
  card: Card;
  children: ReactNode;
  className?: string;
}) {
  const layout = card.layout ?? (card.images.length > 1 ? "stack" : "photo");

  return (
    <span className={`inline-card group/card relative ${className ?? ""}`}>
      {children}
      <span
        aria-hidden="true"
        className="inline-card__panel pointer-events-none absolute bottom-full left-1/2 z-40 mb-2.5 block w-max -translate-x-1/2 rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.12)]"
      >
        {layout === "profile" && <ProfileLayout card={card} />}
        {layout === "stack" && <StackLayout card={card} />}
        {layout === "photo" && <PhotoLayout card={card} />}
        {layout === "cover" && <CoverLayout card={card} />}
      </span>
    </span>
  );
}
