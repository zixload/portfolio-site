"use client";

import { ShadowSlaveBook } from "@/components/shadow-slave-book";

export function ReadingCard({ compact = false }: { compact?: boolean }) {
  // En compact la carte est posée à droite d'un paragraphe : plus de filet
  // vertical, il n'a de sens que quand le bloc occupe toute la largeur.
  if (compact) return <ShadowSlaveBook compact />;

  return (
    <div className="border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
      <ShadowSlaveBook />
    </div>
  );
}
