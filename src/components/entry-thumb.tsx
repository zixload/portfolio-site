import Image from "next/image";

// Dégradés générés, jamais des photos : chaque entrée reçoit sa variante dans la
// famille bleue de l'accent du site.
const PALETTE = [
  ["#2f5bff", "#7fa0ff", "#c9d6ff"],
  ["#1f3fd1", "#5f7dff", "#a9bcff"],
  ["#3d4dd6", "#8095ff", "#d2dcff"],
  ["#2547e0", "#6d8bff", "#b7c7ff"],
  ["#1b34b8", "#4f74ff", "#9fb6ff"],
];

/** Hash stable : la même entrée garde toujours la même vignette. */
function hash(value: string) {
  let acc = 0;
  for (let i = 0; i < value.length; i += 1) {
    acc = (acc * 31 + value.charCodeAt(i)) % 100000;
  }
  return acc;
}

export function EntryThumb({
  slug,
  src,
  className = "h-12 w-20",
}: {
  slug: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={80}
        height={48}
        className={`${className} shrink-0 rounded-md object-cover`}
      />
    );
  }

  const seed = hash(slug);
  const [deep, mid, pale] = PALETTE[seed % PALETTE.length];
  const angle = 110 + (seed % 120);
  // Deuxième dégradé décalé : ça donne un peu de relief, là où un dégradé
  // simple ferait très plat en aussi petit.
  const glowX = 20 + (seed % 60);
  const glowY = 15 + ((seed >> 3) % 55);

  return (
    <span
      aria-hidden="true"
      className={`${className} block shrink-0 rounded-md`}
      style={{
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${pale}, transparent 55%), linear-gradient(${angle}deg, ${deep}, ${mid})`,
      }}
    />
  );
}
