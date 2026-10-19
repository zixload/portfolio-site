// Petits sons d'interface synthétisés à la volée (Web Audio), sans fichier audio.
// Le timbre vient d'un sinus très grave passé dans un lowpass : on obtient un
// "toc" feutré plutôt qu'un bip d'interface.

const MIN_INTERVAL_MS = 35; // anti-mitraillette sur les clics rapprochés

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastPlayedAt = 0;

type ToneOptions = {
  gain?: number;
  duration?: number;
  filter?: number;
  glideTo?: number;
};

/** Souris fine uniquement : jamais de son au tap sur mobile. */
function hasFinePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function ensureContext() {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  return ctx;
}

/**
 * Les navigateurs interdisent l'audio tant que l'utilisateur n'a pas interagi :
 * on débloque le contexte au premier clic / première touche.
 */
function unlock() {
  const audio = ensureContext();
  if (audio?.state === "suspended") void audio.resume();
}

function playTone(frequency: number, options: ToneOptions = {}) {
  const { gain = 0.05, duration = 0.05, filter = 540, glideTo = 0 } = options;
  if (!hasFinePointer()) return;
  if (!ctx || ctx.state !== "running" || !master) return;

  const now = performance.now();
  if (now - lastPlayedAt < MIN_INTERVAL_MS) return;
  lastPlayedAt = now;

  const start = ctx.currentTime + 0.001;
  const osc = ctx.createOscillator();
  const envelope = ctx.createGain();
  const lowpass = ctx.createBiquadFilter();

  lowpass.type = "lowpass";
  lowpass.frequency.value = filter;

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  }

  // Attaque très courte puis extinction exponentielle : un clic, pas une note.
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(gain, start + 0.005);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(lowpass).connect(envelope).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

export function playClick() {
  playTone(220, { gain: 0.045, duration: 0.085, filter: 640 });
}

/**
 * Écouteur délégué sur le document : tout `<a>` / `<button>` sonne au clic,
 * sans avoir à instrumenter chaque composant. Retourne la fonction de
 * nettoyage.
 */
export function initSound() {
  const selector = "a, button, [data-sound]";

  // Le clic est aussi le geste qui autorise l'audio : au tout premier, le
  // contexte démarre à peine, on attend qu'il tourne pour jouer le son.
  const onPointerDown = (event: PointerEvent) => {
    const audio = ensureContext();
    const target = (event.target as Element | null)?.closest?.(selector);
    if (!audio || !target) {
      unlock();
      return;
    }
    if (audio.state === "running") playClick();
    else void audio.resume().then(playClick);
  };

  // Le clavier réveille aussi l'audio, sans jouer de son.
  const onKeyDown = () => unlock();

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);

  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
  };
}
