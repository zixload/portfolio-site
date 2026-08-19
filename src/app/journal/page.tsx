"use client";

import { EntryList } from "@/components/entry-list";
import { useContent } from "@/lib/locale-context";

export default function JournalPage() {
  const c = useContent();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {c.pages.journal.title}
        </h1>
        <p className="max-w-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
          {c.pages.journal.description}
        </p>
      </div>
      <EntryList entries={c.journal} />
    </div>
  );
}
