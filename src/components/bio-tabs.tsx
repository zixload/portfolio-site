"use client";

import { useState, type ReactNode } from "react";
import { LocaleToggle } from "@/components/locale-toggle";
import { RevealChars, RevealScope } from "@/components/reveal-text";

/**
 * Bio courte toujours montée, à laquelle on ajoute la suite au clic. Les
 * paragraphes déjà lus ne sont ni remontés ni ré-animés : seul le contenu
 * nouveau se révèle, et la page pousse simplement vers le bas.
 */
export function BioTabs({
  short,
  extra,
  longExtra,
  footer,
  moreLabel,
  lessLabel,
  expandable = true,
}: {
  short: string[];
  extra: string[]; // paragraphes ajoutés au dépliage, pas la bio complète
  longExtra?: ReactNode;
  footer?: ReactNode; // ligne de fin commune aux deux états (le lien GitHub)
  moreLabel: string;
  lessLabel: string;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const showExtra = expandable && expanded;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center border-b border-zinc-200 pb-2 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Bio
        <LocaleToggle className="ml-auto" />
      </div>

      <div className="flex flex-col gap-4">
        {short.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-xl leading-relaxed text-zinc-700 dark:text-zinc-300"
          >
            {paragraph}
          </p>
        ))}

        {showExtra && (
          <RevealScope revealed className="flex flex-col gap-4">
            {extra.map((paragraph, index) => (
              <p
                key={paragraph}
                className="max-w-xl leading-relaxed text-zinc-700 dark:text-zinc-300"
              >
                <RevealChars text={paragraph} order={index} />
              </p>
            ))}
            {longExtra}
          </RevealScope>
        )}
      </div>

      {footer}

      {expandable && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start text-sm text-zinc-400 underline decoration-dotted decoration-zinc-300 underline-offset-4 transition-colors hover:text-[var(--accent)] dark:text-zinc-500"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
