import Image from "next/image";
import { platforms, type PlatformKey } from "@/lib/content";

export function PlatformBadge({ platform }: { platform: PlatformKey }) {
  const p = platforms[platform];
  return (
    <a
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      title={p.label}
      aria-label={p.label}
      className="inline-flex shrink-0 items-center transition-opacity hover:opacity-70"
    >
      <Image
        src={p.logo}
        alt={p.label}
        width={p.width}
        height={p.height}
        className="h-8 w-8 object-contain"
        style={{ transform: `scale(${p.scale ?? 1})` }}
      />
    </a>
  );
}
