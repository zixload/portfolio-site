"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Scroll interpolé (Lenis) : la molette ne saute plus, elle glisse.
 * Désactivé si l'utilisateur demande moins d'animations, et sur tactile où le
 * scroll natif reste meilleur.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      syncTouch: false, // tactile : on laisse le scroll natif
      autoRaf: true,
    });
    lenisRef.current = lenis;

    // `html` est en hauteur fixe (h-full), donc l'auto-resize de Lenis ne voit
    // jamais la page grandir : sans ça, déplier un bloc laisse la limite de
    // scroll sur l'ancienne hauteur et la page paraît bloquée.
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lenis garde sa propre position : sans ça, changer d'onglet laisse la page
  // au milieu du scroll précédent.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
