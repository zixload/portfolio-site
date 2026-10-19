"use client";

import Link from "next/link";
import { useContent } from "@/lib/locale-context";

/**
 * 404 rendue dans le layout : la navigation et la platine restent, la musique
 * ne s'arrête pas. Le zéro est un petit disque qui tourne et saute par moments,
 * comme un saphir qui accroche un sillon.
 */
export default function NotFound() {
  const c = useContent().pages.notFound;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6 pt-10">
      <p
        className="flex items-center text-[7rem] font-semibold leading-none tracking-tight text-zinc-900"
        style={{ animation: "fadeUp 0.7s ease-out 60ms both" }}
        aria-label="404"
      >
        <span aria-hidden="true">4</span>
        <span className="disc404" aria-hidden="true">
          <span className="disc404__label" />
        </span>
        <span aria-hidden="true">4</span>
      </p>
      <div
        className="flex flex-col gap-2"
        style={{ animation: "fadeUp 0.7s ease-out 160ms both" }}
      >
        <h1 className="text-xl font-semibold tracking-tight">{c.title}</h1>
        <p className="leading-relaxed text-zinc-600">{c.description}</p>
      </div>
      <Link
        href="/"
        className="text-sm text-zinc-500 underline decoration-dotted decoration-zinc-300 underline-offset-4 transition-colors hover:text-[var(--accent)]"
        style={{ animation: "fadeUp 0.7s ease-out 260ms both" }}
      >
        {c.back}
      </Link>
    </div>
  );
}
