"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type Track = {
  title: string;
  artist: string;
  cover: string;
  /** Fichier audio. Sans lui, le lecteur s'anime mais reste muet. */
  src?: string;
};

// 33⅓ tours par minute : 1,8 s par tour, la vitesse réelle d'un vinyle.
const DEGREES_PER_SECOND = 360 / 1.8;
// Le plateau met un instant à prendre sa vitesse et plus longtemps à s'arrêter,
// comme un vrai : un arrêt net trahit tout de suite l'animation CSS.
const SPIN_UP = 3.2;
const SPIN_DOWN = 1.4;
// Volume linéaire, pas perçu : l'oreille entend en décibels. 0,1 = -20 dB,
// vrai fond sonore ; entre 0,3 et 0,25 on n'entend presque pas la différence.
const VOLUME = 0.1;

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="2.6" height="14" rx="1" />
      <path d="M19 5.6v12.8a.9.9 0 0 1-1.4.75L9 12.75a.9.9 0 0 1 0-1.5l8.6-6.4a.9.9 0 0 1 1.4.75Z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="16.4" y="5" width="2.6" height="14" rx="1" />
      <path d="M5 5.6v12.8a.9.9 0 0 0 1.4.75L15 12.75a.9.9 0 0 0 0-1.5L6.4 4.85A.9.9 0 0 0 5 5.6Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

export function VinylPlayer({ tracks }: { tracks: Track[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const discRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);

  const track = tracks[index];

  // Rotation pilotée en JS plutôt qu'en CSS : `animation-play-state` fige le
  // disque instantanément, alors qu'un plateau accélère et décélère.
  useEffect(() => {
    const disc = discRef.current;
    if (!disc) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angle = 0;
    let speed = 0;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const target = playingRef.current ? DEGREES_PER_SECOND : 0;
      const rate = playingRef.current ? SPIN_UP : SPIN_DOWN;
      speed += (target - speed) * Math.min(dt * rate, 1);
      angle = (angle + speed * dt) % 360;
      disc.style.transform = `rotate(${angle}deg)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Un seul élément audio, dont on change la source au changement de piste.
  useEffect(() => {
    if (!track.src) {
      audioRef.current?.pause();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Musique d'ambiance : elle accompagne la lecture, elle ne la couvre pas.
      audioRef.current.volume = VOLUME;
    }
    const audio = audioRef.current;
    if (!audio.src.endsWith(track.src)) {
      audio.src = track.src;
      audio.load();
    }
    if (playing) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, track.src]);

  const go = useCallback(
    (step: number) => {
      setIndex((i) => (i + step + tracks.length) % tracks.length);
    },
    [tracks.length]
  );

  // Fin du morceau : on enchaîne sur le suivant.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => go(1);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [go, track.src]);

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className="vinyl" data-playing={playing}>
      <div className="vinyl__deck">
        <div className="vinyl__shadow" aria-hidden="true" />

        <div ref={discRef} className="vinyl__disc" aria-hidden="true">
          <div className="vinyl__ring">
            <div className="vinyl__label">
              <Image
                key={track.cover}
                src={track.cover}
                alt=""
                width={160}
                height={160}
                className="vinyl__cover"
              />
            </div>
          </div>
        </div>

        {/* Le reflet reste fixe pendant que le disque tourne dessous : c'est la
            lumière qui ne bouge pas, pas la matière. */}
        <div className="vinyl__sheen" aria-hidden="true" />

        <div className="vinyl__arm" aria-hidden="true">
          <span className="vinyl__bar" />
          <span className="vinyl__knob" />
        </div>
      </div>

      <div className="vinyl__info">
        <span className="vinyl__eyebrow">Now playing</span>
        <span className="vinyl__title">{track.title}</span>
        <span className="vinyl__artist">{track.artist}</span>

        <div className="vinyl__controls">
          <button
            type="button"
            className="vinyl__button"
            onClick={() => go(-1)}
            aria-label="Morceau précédent"
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            className="vinyl__button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className="vinyl__button"
            onClick={() => go(1)}
            aria-label="Morceau suivant"
          >
            <NextIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
