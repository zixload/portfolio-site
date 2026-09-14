"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useContent, useLocale } from "@/lib/locale-context";

export function Nav() {
  const nav = useContent().nav;
  const { locale } = useLocale(); // sert à remesurer le trait quand les libellés changent
  const pathname = usePathname();

  const listRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Le trait se cale sur l'onglet actif, et glisse jusqu'au suivant à la
  // navigation : on relit la position à chaque changement de route ou de langue.
  const measure = useCallback(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[data-active='true']");
    if (!list || !active) {
      setUnderline(null);
      return;
    }
    const listBox = list.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    setUnderline({
      left: activeBox.left - listBox.left,
      width: activeBox.width,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, pathname, locale]);

  return (
    <header
      className="w-full"
      style={{ animation: "fadeUp 0.7s ease-out 0ms both" }}
    >
      <nav className="mx-auto flex max-w-2xl items-center gap-5 px-6 pt-10 text-sm text-zinc-500 dark:text-zinc-400 sm:px-0">
        <div ref={listRef} className="relative flex items-center gap-5 pb-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className={`transition-colors hover:text-[var(--accent)] ${
                  active ? "text-[var(--foreground)]" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-px bg-[var(--foreground)]"
            style={{
              left: underline?.left ?? 0,
              width: underline?.width ?? 0,
              opacity: underline ? 1 : 0,
              transition:
                "left 420ms cubic-bezier(0.16, 1, 0.3, 1), width 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
            }}
          />
        </div>
      </nav>
    </header>
  );
}
