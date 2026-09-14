"use client";

import { useRef, useState, type ReactNode } from "react";

type Box = { top: number; height: number };

const PADDING = 8; // marge verticale entre le texte et le bord de la box

/**
 * Une seule box grise pour toute la liste : au lieu de s'allumer sur place, elle
 * glisse de la ligne survolée à la suivante. Les lignes concernées doivent porter
 * l'attribut `data-highlight`.
 */
export function SlidingHighlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  const track = (target: EventTarget | null) => {
    const row = (target as Element | null)?.closest?.("[data-highlight]");
    const container = containerRef.current;
    if (!row || !container) return;

    const containerBox = container.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    // La box déborde du contenu, sinon le texte touche ses bords.
    setBox({
      top: rowBox.top - containerBox.top - PADDING,
      height: rowBox.height + PADDING * 2,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ""}`}
      onPointerOver={(event) => track(event.target)}
      onPointerLeave={() => setBox(null)}
    >
      {/* Déborde de 14px à gauche et à droite : sans ça, la date colle au bord
          droit de la box et le titre au bord gauche. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-3.5 -right-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800"
        style={{
          top: box?.top ?? 0,
          height: box?.height ?? 0,
          opacity: box ? 1 : 0,
          transition:
            "top 320ms cubic-bezier(0.16, 1, 0.3, 1), height 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease",
        }}
      />
      {children}
    </div>
  );
}
