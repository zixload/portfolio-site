import type { CSSProperties } from "react";

// Petite volée de pétales qui traverse le cadre lors d'un changement de page.
// `seed` change à chaque navigation (voir SidebarVisual) pour rejouer l'effet
// avec une trajectoire différente ; `side` biaise la direction générale du
// souffle pour accompagner le tilt 3D de la vidéo.
function petalStyle(i: number, seed: number, side: number): CSSProperties {
  // Pseudo-aléatoire déterministe (pas de Math.random, pour rester stable
  // entre deux rendus tant que i/seed ne changent pas).
  const r = (n: number) => {
    const x = Math.sin(n * 12.9898 + seed * 0.0078233) * 43758.5453;
    return x - Math.floor(x);
  };

  const startX = 10 + r(i) * 80; // %
  const startY = 10 + r(i + 100) * 80; // %
  const baseAngle = side > 0 ? -0.35 : Math.PI - 0.35;
  const angle = baseAngle + (r(i + 200) - 0.5) * 1.8;
  const dist = 25 + r(i + 300) * 50; // %
  const endX = startX + Math.cos(angle) * dist;
  const endY = startY + Math.sin(angle) * dist;
  const size = 4 + r(i + 400) * 8;
  const delay = r(i + 500) * 300;
  const duration = 800 + r(i + 600) * 700;
  const opacity = 0.45 + r(i + 700) * 0.45;
  const rot0 = r(i + 800) * 360;
  const rot1 = rot0 + 100 + r(i + 900) * 200;

  return {
    left: `${startX}%`,
    top: `${startY}%`,
    width: size,
    height: size * 0.75,
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
    ["--px0" as string]: "0px",
    ["--py0" as string]: "0px",
    ["--px1" as string]: `${endX - startX}%`,
    ["--py1" as string]: `${endY - startY}%`,
    ["--pr0" as string]: `${rot0}deg`,
    ["--pr1" as string]: `${rot1}deg`,
    ["--po" as string]: opacity,
  };
}

export function PetalBurst({
  seed,
  side,
  count,
}: {
  seed: number;
  side: number;
  count: number;
}) {
  const petals = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((i) => (
        <div key={i} className="petal" style={petalStyle(i, seed, side)} />
      ))}
    </div>
  );
}
