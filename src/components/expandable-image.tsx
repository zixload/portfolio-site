"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openImage = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMounted(true);
  };

  const closeImage = useCallback(() => {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), 280);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const openingFrame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(openingFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeImage, mounted]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={openImage}
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

      {mounted
        ? createPortal(
            <div
              className={`media-lightbox${visible ? " is-open" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeImage();
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="media-lightbox__image"
                priority
                onMouseDown={(event) => event.stopPropagation()}
              />
              <button
                type="button"
                className="media-lightbox__close"
                onClick={closeImage}
                aria-label="Fermer l'image"
                autoFocus
              >
                &times;
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
