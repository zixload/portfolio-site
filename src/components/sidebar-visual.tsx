"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeroVideo } from "@/components/hero-video";
import { PetalBurst } from "@/components/petal-burst";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function SidebarVisual() {
  const pathname = usePathname();
  const frameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const isFirstRender = useRef(true);
  const [burst, setBurst] = useState<{
    seed: number;
    side: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = frameRef.current;
    if (el) {
      animationRef.current?.cancel();

      const side = Math.random() < 0.5 ? 1 : -1;
      const strength = randomBetween(0.65, 1.35);
      const duration = randomBetween(750, 1450);
      const peakBlur = randomBetween(1.5, 4) * strength;
      const rotY1 = side * randomBetween(2, 6) * strength;
      const rotX1 = -side * randomBetween(0.4, 1.6) * strength;
      const tx1 = side * randomBetween(0.8, 2) * strength;
      const ty1 = randomBetween(-0.8, 0.8) * strength;
      const tz1 = -randomBetween(8, 26) * strength;
      const scale1 = 1 - randomBetween(0.008, 0.025) * strength;

      const rotY2 = -rotY1 * 0.35;
      const rotX2 = -rotX1 * 0.35;
      const tx2 = -tx1 * 0.35;
      const ty2 = -ty1 * 0.35;
      const tz2 = tz1 * 0.25;
      const scale2 = 1 + (1 - scale1) * 0.3;

      animationRef.current = el.animate(
        [
          {
            transform:
              "rotateY(0deg) rotateX(0deg) translate3d(0,0,0) scale(1)",
            filter: "blur(0px)",
            offset: 0,
          },
          {
            transform: `rotateY(${rotY1}deg) rotateX(${rotX1}deg) translate3d(${tx1}%, ${ty1}%, ${tz1}px) scale(${scale1})`,
            filter: `blur(${peakBlur}px)`,
            offset: 0.3,
          },
          {
            transform: `rotateY(${rotY2}deg) rotateX(${rotX2}deg) translate3d(${tx2}%, ${ty2}%, ${tz2}px) scale(${scale2})`,
            filter: `blur(${peakBlur * 0.3}px)`,
            offset: 0.63,
          },
          {
            transform:
              "rotateY(0deg) rotateX(0deg) translate3d(0,0,0) scale(1)",
            filter: "blur(0px)",
            offset: 1,
          },
        ],
        { duration, easing: "cubic-bezier(0.33, 0.7, 0.2, 1)", fill: "both" }
      );
    }

    setBurst({
      seed: Date.now(),
      side: Math.random() < 0.5 ? 1 : -1,
      count: Math.round(randomBetween(5, 12)),
    });
  }, [pathname]);

  return (
    <div
      className="relative aspect-[400/520] overflow-hidden rounded-lg"
      style={{ perspective: "900px" }}
    >
      <div ref={frameRef} className="h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <HeroVideo />
      </div>
      {burst && (
        <PetalBurst
          key={burst.seed}
          seed={burst.seed}
          side={burst.side}
          count={burst.count}
        />
      )}
    </div>
  );
}
