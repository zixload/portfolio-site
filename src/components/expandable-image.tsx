"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function ExpandableImage({
  src,
  alt,
  width,
  height,
  className,
  hoverClassName,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  hoverClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Agrandir : ${alt}`}
        className={`block shrink-0 cursor-zoom-in overflow-hidden ${className ?? ""}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-200 hover:opacity-80 ${hoverClassName ?? ""}`}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-6"
          onClick={() => setOpen(false)}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1500}
            className="max-h-full max-w-full rounded-sm object-contain"
          />
        </div>
      )}
    </>
  );
}
