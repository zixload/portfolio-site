"use client";

import { ExpandableImage } from "@/components/expandable-image";
import { media } from "@/lib/content";
import { useContent } from "@/lib/locale-context";

export function ReadingCard() {
  const { currentlyReading } = useContent();

  return (
    <div className="flex flex-col gap-6 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
      <div className="flex gap-5">
        <ExpandableImage
          src={media.currentlyReadingCover}
          alt={`${currentlyReading.title} cover`}
          width={110}
          height={150}
          className="h-[150px] w-[110px] rounded-sm shadow-sm"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {currentlyReading.label} — {currentlyReading.title} (
            {currentlyReading.author})
          </p>
          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">
              {currentlyReading.abstractLabel}
            </span>{" "}
            — {currentlyReading.abstract}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <blockquote className="italic leading-relaxed text-zinc-700 dark:text-zinc-300">
            &ldquo;{currentlyReading.quote}&rdquo;
          </blockquote>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            {currentlyReading.quoteNote}
          </span>
        </div>
        <ExpandableImage
          src={media.currentlyReadingIllustration}
          alt={`${currentlyReading.title} illustration`}
          width={96}
          height={130}
          className="mx-auto h-[130px] w-24 rounded-sm sm:mx-0"
        />
      </div>
    </div>
  );
}
