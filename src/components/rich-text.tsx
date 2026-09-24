"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { GithubIcon } from "@/components/github-icon";
import { HoverCard } from "@/components/inline-card";
import { cards, glows, links, objects, pics } from "@/lib/content";

/**
 * Balisage léger des textes de `content.ts`, pour garder la décoration à côté
 * des mots qu'elle concerne :
 *
 *   ==finance quantitative==          trait de surligneur
 *   [Salahdine Parnasse](card:parnasse)   carte au survol (voir `cards`)
 *   [Shadow Slave](shadow card:shadowslave)   plusieurs effets, séparés par
 *                                             des espaces
 *   [zixload](github)                 pastille vers le profil GitHub
 *   [Shadow Slave](obj:weaver)        objet 3D à côté du paragraphe
 *                                     (voir `objects`)
 *   [Red Team](glow:redteam)          mot en gras et son icône, qui
 *                                     s'allument au survol (voir `glows`)
 *   [boxe thaï](pic:gloves)           petite image collée au mot, à hauteur
 *                                     de texte (voir `pics`)
 */
const TOKEN = /==(.+?)==|\[([^\]]+)\]\(([^)]+)\)/g;

const github = links.find((link) => link.label === "GitHub");

/** Trait de surligneur qui se trace une seule fois, à l'arrivée à l'écran. */
function Marker({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setDrawn(true);
        observer.disconnect();
      },
      // Le trait part quand le mot est bien dans la page, pas au ras du bord.
      { rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="marker" data-drawn={drawn}>
      {children}
    </span>
  );
}

function GithubPill({ label }: { label: string }) {
  const pill = (
    <a
      href={github?.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex translate-y-px items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[0.9em] text-zinc-700 transition-colors hover:bg-zinc-200/80 hover:text-[var(--accent)]"
    >
      <GithubIcon className="h-3.5 w-3.5" />
      {label}
    </a>
  );

  const card = cards.github;
  return card ? <HoverCard card={card}>{pill}</HoverCard> : pill;
}

/**
 * Objet 3D qui flotte à droite du paragraphe, avec son ombre au sol qui se
 * resserre quand il monte. C'est une simple image rendue dans Blender : aucune
 * 3D n'est chargée dans la page.
 */
function FloatingObject({ id }: { id: string }) {
  const object = objects[id];
  if (!object) return null;
  return (
    <span className="floating">
      <span className="floating__body">
        <Image
          src={object.image}
          alt={object.alt}
          width={object.width}
          height={object.height}
          className="floating__image"
        />
      </span>
      <span className="floating__shadow" aria-hidden="true" />
    </span>
  );
}

/** Petite image à hauteur de texte, juste avant le mot qu'elle illustre. */
function Pic({ id }: { id: string }) {
  const pic = pics[id];
  if (!pic) return null;
  return (
    <span
      className={`pic pic--${pic.shape} ${pic.sway ? "pic--sway" : ""}`}
      aria-hidden="true"
    >
      <Image
        src={pic.src}
        alt=""
        width={pic.width ?? 64}
        height={pic.height ?? 64}
        className="pic__image"
      />
    </span>
  );
}

// Icônes unies, dessinées sur une grille de 24, dans la couleur du texte.
const GLOW_ICONS = {
  // Courbe qui monte, terminée par une flèche : à la taille du texte, trois
  // chandeliers devenaient un amas de points.
  trend: (
    <>
      <path
        d="M2.5 18.5 9 12l4 4 8-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 5.2h7.3a1 1 0 0 1 1 1v7.3a1 1 0 0 1-1.7.7l-7.3-7.3a1 1 0 0 1 .7-1.7Z" />
    </>
  ),
  // Réticule : un anneau, quatre repères et le point visé.
  crosshair: (
    <>
      <path
        fillRule="evenodd"
        d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm0 2.6a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8Z"
      />
      <rect x="10.8" y="0.5" width="2.4" height="6" rx="1.2" />
      <rect x="10.8" y="17.5" width="2.4" height="6" rx="1.2" />
      <rect x="0.5" y="10.8" width="6" height="2.4" rx="1.2" />
      <rect x="17.5" y="10.8" width="6" height="2.4" rx="1.2" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
};

/** Mot en gras et son icône, qui prennent leur couleur au survol. */
function GlowWord({ label, id }: { label: string; id: string }) {
  const glow = glows[id];
  if (!glow) return <>{label}</>;
  // Le groupe peut passer à la ligne, mais l'icône reste collée au dernier mot :
  // un bloc insécable entier creuserait des trous dans le texte justifié.
  const cut = label.lastIndexOf(" ") + 1;
  return (
    <span className="glow" style={{ "--glow": glow.color } as CSSProperties}>
      {label.slice(0, cut)}
      <span className="whitespace-nowrap">
        {label.slice(cut)}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="glow__icon"
          aria-hidden="true"
        >
          {GLOW_ICONS[glow.icon]}
        </svg>
      </span>
    </span>
  );
}

function Decorated({ label, attrs }: { label: string; attrs: string }) {
  const parts = attrs.split(/\s+/);

  if (parts.includes("github")) return <GithubPill label={label} />;

  const glowId = parts.find((p) => p.startsWith("glow:"))?.slice(5);
  if (glowId) return <GlowWord label={label} id={glowId} />;

  const shadow = parts.includes("shadow");
  const cardId = parts.find((p) => p.startsWith("card:"))?.slice(5);
  const card = cardId ? cards[cardId] : undefined;
  const picId = parts.find((p) => p.startsWith("pic:"))?.slice(4);
  const pic = picId ? <Pic id={picId} /> : null;

  // Mot qui ne porte qu'une image : il reste du texte normal, sans soulignement
  // qui promettrait une carte au survol. L'image ne se sépare pas du mot en fin
  // de ligne.
  if (!card && !shadow) {
    return (
      <span className="whitespace-nowrap">
        {pic}
        {label}
      </span>
    );
  }

  // Le mot est focalisable pour que la carte s'ouvre aussi au clavier et au
  // toucher, où le survol n'existe pas.
  const word = (
    <span
      className={`inline-card__trigger ${shadow ? "shadow-word" : ""}`}
      tabIndex={card ? 0 : undefined}
      data-sound={card ? "" : undefined}
    >
      {label}
    </span>
  );

  // L'objet éventuel n'est pas rendu ici mais au niveau du paragraphe (voir
  // RichText), pour se placer par rapport à lui et non par rapport au mot.
  const content = (
    <span className="deco whitespace-nowrap">
      {pic}
      {word}
    </span>
  );

  return card ? <HoverCard card={card}>{content}</HoverCard> : content;
}

export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  // Expression recréée à chaque rendu : avec le drapeau `g`, un `lastIndex`
  // partagé entre deux appels ferait sauter le début du texte suivant.
  const pattern = new RegExp(TOKEN.source, "g");
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    if (match[1] !== undefined) {
      nodes.push(<Marker key={key++}>{match[1]}</Marker>);
    } else {
      nodes.push(<Decorated key={key++} label={match[2]} attrs={match[3]} />);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  // Les objets sont ajoutés à la fin, enfants directs du paragraphe : dans le
  // mot, ils se placeraient par rapport à lui et non au bord du paragraphe.
  const floating = [...text.matchAll(/obj:([\w-]+)/g)].map((m) => m[1]);

  return (
    <>
      {nodes}
      {floating.map((id) => (
        <FloatingObject key={id} id={id} />
      ))}
    </>
  );
}
