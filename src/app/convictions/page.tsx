"use client";

import { useContent } from "@/lib/locale-context";

export default function ConvictionsPage() {
  const c = useContent();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-tight">
        {c.pages.convictions.title}
      </h1>
      <ul className="flex flex-col gap-3">
        {c.beliefs.map((belief) => (
          <li
            key={belief}
            className="leading-relaxed text-zinc-700 dark:text-zinc-300"
          >
            {belief}
          </li>
        ))}
      </ul>
    </div>
  );
}
