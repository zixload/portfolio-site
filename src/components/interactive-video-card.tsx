"use client";

import { useEffect, useRef } from "react";
import { HeroVideo } from "@/components/hero-video";

const PIXEL_COLUMNS = 42;

export function InteractiveVideoCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastDrawRef = useRef(0);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!card || !video || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tracking = false;

    const drawPixels = (now: number) => {
      if (!tracking || reducedMotion.matches) {
        frameRef.current = 0;
        return;
      }

      if (now - lastDrawRef.current >= 1000 / 24 && video.readyState >= 2) {
        const ratio = Math.max(0.5, card.clientHeight / card.clientWidth);
        const rows = Math.max(1, Math.round(PIXEL_COLUMNS * ratio));
        if (canvas.width !== PIXEL_COLUMNS || canvas.height !== rows) {
          canvas.width = PIXEL_COLUMNS;
          canvas.height = rows;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        lastDrawRef.current = now;
      }

      frameRef.current = requestAnimationFrame(drawPixels);
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const bounds = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

      card.style.setProperty("--card-rotate-x", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--card-rotate-y", `${(x - 0.5) * 10}deg`);
      card.style.setProperty("--pixel-x", `${x * 100}%`);
      card.style.setProperty("--pixel-y", `${y * 100}%`);
    };

    const startTracking = (event: PointerEvent) => {
      tracking = true;
      card.dataset.tracking = "true";
      updatePointer(event);
      // La vidéo est à l'arrêt le reste du temps : c'est le survol qui la lance.
      if (!reducedMotion.matches) void video.play().catch(() => {});
      if (!frameRef.current) frameRef.current = requestAnimationFrame(drawPixels);
    };

    const stopTracking = () => {
      tracking = false;
      card.dataset.tracking = "false";
      video.pause();
      card.style.setProperty("--card-rotate-x", "0deg");
      card.style.setProperty("--card-rotate-y", "0deg");
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };

    card.addEventListener("pointerenter", startTracking);
    card.addEventListener("pointermove", updatePointer);
    card.addEventListener("pointerleave", stopTracking);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      card.removeEventListener("pointerenter", startTracking);
      card.removeEventListener("pointermove", updatePointer);
      card.removeEventListener("pointerleave", stopTracking);
    };
  }, []);

  return (
    <div className="interactive-video-card-shell">
      <div
        ref={cardRef}
        className="interactive-video-card"
        data-tracking="false"
        tabIndex={0}
        aria-label="Windy morning fields — interactive video"
      >
        <HeroVideo ref={videoRef} />
        <canvas ref={canvasRef} className="interactive-video-card__pixels" />
        <span className="interactive-video-card__shine" aria-hidden="true" />
      </div>
    </div>
  );
}
