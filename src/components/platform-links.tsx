import Image from "next/image";
import { platforms, type PlatformKey } from "@/lib/content";

const order: PlatformKey[] = ["htb", "thm", "rootme"];

export function PlatformLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
      {order.map((key) => {
        const p = platforms[key];
        return (
          <a
            key={key}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0 transition-colors hover:text-[var(--accent)]"
          >
            <Image
              src={p.logo}
              alt={p.label}
              width={p.width}
              height={p.height}
              className="h-8 w-8 object-contain"
              style={{ transform: `scale(${p.scale ?? 1})` }}
            />
            {p.label}
          </a>
        );
      })}
    </div>
  );
}
