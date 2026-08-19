"use client";

import { useState, type ReactNode } from "react";

export function BioTabs({
  short,
  long,
  longExtra,
}: {
  short: string[];
  long: string[];
  longExtra?: ReactNode;
}) {
  const [tab, setTab] = useState<"default" | "long">("default");
  const paragraphs = tab === "default" ? short : long;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 border-b border-zinc-200 text-sm dark:border-zinc-800">
        <span className="pb-2 text-zinc-400 dark:text-zinc-500">Bio</span>
        <div className="ml-auto flex gap-4">
          <button
            type="button"
            onClick={() => setTab("default")}
            className={`-mb-px border-b pb-2 transition-colors ${
              tab === "default"
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-zinc-400 hover:text-[var(--accent)] dark:text-zinc-500"
            }`}
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => setTab("long")}
            className={`-mb-px border-b pb-2 transition-colors ${
              tab === "long"
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-zinc-400 hover:text-[var(--accent)] dark:text-zinc-500"
            }`}
          >
            Long
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-xl leading-relaxed text-zinc-700 dark:text-zinc-300"
          >
            {paragraph}
          </p>
        ))}
        {tab === "long" && longExtra}
      </div>
    </div>
  );
}
