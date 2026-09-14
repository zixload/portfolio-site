"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// Chaque bloc démarre un peu après le précédent, et ses lettres se répartissent
// sur SPREAD_MS : la révélation descend la page au lieu de tout allumer d'un coup.
const BLOCK_STAGGER_MS = 220;
const SPREAD_MS = 700;

const RevealContext = createContext(false);

function transition(delay: number): CSSProperties {
  return {
    transition: "filter 460ms ease, opacity 460ms ease",
    transitionDelay: `${delay}ms`,
  };
}

/** Conteneur qui décide quand la révélation démarre. */
export function RevealScope({
  revealed,
  children,
  className,
}: {
  revealed: boolean;
  children: ReactNode;
  className?: string;
}) {
  // Le contenu doit être peint flouté avant de s'éclaircir, sinon le navigateur
  // n'a rien à animer : on bascule à la frame suivante.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(revealed));
    return () => cancelAnimationFrame(frame);
  }, [revealed]);

  return (
    <RevealContext.Provider value={armed}>
      <div className={className}>{children}</div>
    </RevealContext.Provider>
  );
}

/** Texte qui se défloute lettre par lettre. */
export function RevealChars({
  text,
  order = 0,
  className,
}: {
  text: string;
  order?: number;
  className?: string;
}) {
  const revealed = useContext(RevealContext);
  const characters = [...text];

  return (
    <span className={className}>
      {characters.map((char, index) => (
        <span
          key={index}
          style={{
            filter: revealed ? "blur(0)" : "blur(4px)",
            opacity: revealed ? 1 : 0.25,
            ...transition(
              revealed
                ? order * BLOCK_STAGGER_MS +
                    (index / Math.max(characters.length, 1)) * SPREAD_MS
                : 0
            ),
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

/** Bloc non textuel (image, carte) : il se défloute d'un seul tenant. */
export function RevealBlock({
  order = 0,
  children,
  className,
}: {
  order?: number;
  children: ReactNode;
  className?: string;
}) {
  const revealed = useContext(RevealContext);

  return (
    <div
      className={className}
      style={{
        filter: revealed ? "blur(0)" : "blur(5px)",
        opacity: revealed ? 1 : 0.25,
        ...transition(revealed ? order * BLOCK_STAGGER_MS : 0),
      }}
    >
      {children}
    </div>
  );
}
