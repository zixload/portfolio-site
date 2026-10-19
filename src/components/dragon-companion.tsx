"use client";

import { useEffect, useRef } from "react";
import sprites from "@/lib/dragon-sprites.json";
import { VINYL_ACTIVITY_EVENT } from "@/lib/companion-events";

type Point = { x: number; y: number };
type Mode = "waking" | "flying" | "landing" | "alert" | "fire" | "tired" | "sleeping" | "drowsy" | "walking";
const TAU = Math.PI * 2;
const FLAP_MS = 130;
const TURN_MS = 105;
const CHASE_MS = 5000;
const SPEED = 120;
const INACTIVE_MS = 60_000;
const WALK_SPEED = 16;

function directionToward(dx: number, dy: number) {
  return (Math.round(Math.atan2(dy, dx) / (TAU / 8)) + 8) % 8;
}

function turnStep(from: number, to: number) {
  const clockwise = (to - from + 8) % 8;
  return clockwise === 0 ? 0 : clockwise <= 4 ? 1 : -1;
}

/** A persistent companion; its animation runs outside React's render cycle. */
export function DragonCompanion() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const button = buttonRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!button || !canvas || !context) return;
    context.imageSmoothingEnabled = false;

    const image = new window.Image();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motion.matches;
    let scale = 2;
    let perch: Point = { x: 100, y: 200 };
    let perchFraction = 0.66;
    let pointer: Point | null = null;
    let position: Point = { x: 100, y: 150 };
    let mode: Mode = "sleeping";
    let direction = 0;
    let turningUntil = 0;
    let nextTurn = 0;
    let stageSince = performance.now();
    let lastActivity = stageSince;
    let last = stageSince;
    let hiddenSince = 0;
    let animation = 0;
    let loaded = false;
    let disposed = false;
    let previousFrame = -1;
    let previousPosition = "";
    let recentClicks: number[] = [];
    let platform: DOMRect | null = null;
    let walkTargetFraction = perchFraction;
    let walkDistance = 0;
    let previousWalkPhase = -1;
    const walkingFrames: HTMLCanvasElement[] = [];

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

    const measure = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      scale = width < 640 ? 1.5 : 2;
      button.style.width = `${sprites.cell * scale}px`;
      button.style.height = `${sprites.cell * scale}px`;
      const dock = document.querySelector<HTMLElement>(".vinyl-dock .vinyl");
      const rect = dock?.getBoundingClientRect();
      platform = rect && rect.width > 0 && width >= 1280 ? rect : null;
      if (rect && rect.width > 0 && width >= 1280) {
        perch = { x: rect.left + rect.width * perchFraction, y: rect.top + 1 };
      } else {
        perch = { x: width - 60 - (perchFraction - 0.54) * 80, y: height - 22 };
      }
      if (mode === "flying" || mode === "landing") {
        position.x = clamp(position.x, 32 * scale, width - 32 * scale);
        position.y = clamp(position.y, 36 * scale, height - 28 * scale);
      } else position = { ...perch };
    };

    measure();
    position = { ...perch };

    const takeOff = (now: number) => {
      if (reducedMotion) { mode = "alert"; position = { ...perch }; return; }
      if (mode !== "flying" && mode !== "landing") position.y -= 14 * scale;
      mode = "flying";
      stageSince = now;
      previousFrame = -1;
    };
    const setMode = (value: Mode, now: number) => {
      mode = value;
      stageSince = now;
      previousFrame = -1;
      if (value !== "flying" && value !== "landing" && value !== "walking") direction = 0;
      if (value !== "flying" && value !== "landing") position = { ...perch };
    };

    const render = (now: number) => {
      const flying = mode === "flying" || mode === "landing";
      const walking = mode === "walking";
      const walkPhase = Math.floor(walkDistance / scale) % 8;
      let index: number;
      if (flying) {
        index = now < turningUntil ? sprites.turn[direction]
          : sprites.flight[direction][Math.floor(now / FLAP_MS) % 4];
      } else if (mode === "sleeping") index = sprites.poses.sleep[reducedMotion ? 0 : Math.floor((now - stageSince) / 900) % 2];
      else if (mode === "drowsy") index = sprites.poses.sleep[1];
      else if (mode === "fire") index = sprites.poses.fire[reducedMotion ? 0 : Math.floor((now - stageSince) / 160) % 2];
      else index = mode === "tired" ? sprites.poses.tired : sprites.poses.alert;

      if (index !== previousFrame || (walking && walkPhase !== previousWalkPhase)) {
        context.clearRect(0, 0, sprites.cell, sprites.cell);
        if (walking) {
          context.save();
          if (direction === 4) { context.translate(56, 0); context.scale(-1, 1); }
          context.drawImage(walkingFrames[walkPhase], 0, 0);
          context.restore();
        } else {
          context.drawImage(image, index % sprites.columns * sprites.cell, Math.floor(index / sprites.columns) * sprites.cell,
            sprites.cell, sprites.cell, 0, 0, sprites.cell, sprites.cell);
        }
        if (mode === "drowsy") {
          context.fillStyle = "#FF8A1F";
          context.fillRect(40, 42, 2, 1);
        }
        previousFrame = index;
        previousWalkPhase = walking ? walkPhase : -1;
        button.dataset.frame = String(index);
      }
      // Advance in whole sprite pixels, in sync with each planted foot.
      const renderX = walking ? Math.round(position.x / scale) * scale : position.x;
      const x = Math.round(renderX - (flying ? 32 : 28) * scale);
      const y = Math.round(position.y - (flying ? 36 : 52) * scale);
      const transform = `translate3d(${x}px, ${y}px, 0)`;
      if (transform !== previousPosition) { button.style.transform = transform; previousPosition = transform; }
      if (button.dataset.state !== mode) button.dataset.state = mode;
      if (button.dataset.direction !== sprites.directions[direction]) button.dataset.direction = sprites.directions[direction];
      if (button.style.opacity !== "1") button.style.opacity = "1";
    };

    const tick = (now: number) => {
      if (disposed || document.hidden || !loaded) return;
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      if (!reducedMotion) {
        if (mode === "sleeping" && platform && now - lastActivity >= INACTIVE_MS) {
          walkTargetFraction = 0.3 + Math.random() * 0.48;
          if (Math.abs(walkTargetFraction - perchFraction) < 0.12) {
            walkTargetFraction = perchFraction < 0.54 ? 0.66 + Math.random() * 0.12 : 0.3 + Math.random() * 0.1;
          }
          direction = walkTargetFraction > perchFraction ? 0 : 4;
          walkDistance = 0;
          setMode("walking", now);
        }
        if (mode === "walking") {
          if (!platform) { lastActivity = now; setMode("sleeping", now); }
          else {
            const remaining = (walkTargetFraction - perchFraction) * platform.width;
            const step = Math.min(Math.abs(remaining), WALK_SPEED * dt);
            perchFraction += Math.sign(remaining) * step / platform.width;
            perch = { x: platform.left + platform.width * perchFraction, y: platform.top + 1 };
            position = { ...perch };
            walkDistance += step;
            if (Math.abs(remaining) <= step) { lastActivity = now; setMode("tired", now); }
          }
        }
        if (mode === "flying" && now - stageSince >= CHASE_MS) {
          const previous = perchFraction;
          perchFraction = 0.54 + Math.random() * 0.24;
          // Keep the landing visibly different, and away from the player's edges.
          if (Math.abs(perchFraction - previous) < 0.04) {
            perchFraction = previous < 0.66 ? 0.72 + Math.random() * 0.06 : 0.54 + Math.random() * 0.06;
          }
          measure();
          setMode("landing", now);
        }
        if (mode === "flying" || mode === "landing") {
          const cursor = pointer ?? perch;
          const target = mode === "landing" ? { x: perch.x, y: perch.y - 14 * scale } : {
            x: clamp(cursor.x, 32 * scale, window.innerWidth - 32 * scale),
            y: clamp(cursor.y, 36 * scale, window.innerHeight - 28 * scale),
          };
          const dx = target.x - position.x, dy = target.y - position.y;
          const distance = Math.hypot(dx, dy);
          const stoppingDistance = mode === "landing" ? 0 : 12;
          const desired = directionToward(dx, dy);
          if (mode === "landing" && distance < 3) {
            direction = 0;
            setMode("alert", now);
          } else if (distance > stoppingDistance) {
            if (desired !== direction && now >= nextTurn) {
              direction = (direction + turnStep(direction, desired) + 8) % 8;
              nextTurn = now + TURN_MS;
              turningUntil = nextTurn;
            }
            // Finish facing the target before moving, so turns never slide sideways.
            if (direction === desired) {
              const step = Math.min(distance - stoppingDistance, SPEED * dt);
              position.x += dx / distance * step;
              position.y += dy / distance * step;
            }
          }
        }
      }
      if (mode !== "flying" && mode !== "landing") {
        const elapsed = now - stageSince;
        if (mode === "waking" && elapsed > 600) setMode("fire", now);
        else if (mode === "fire" && elapsed > 750) setMode("tired", now);
        else if (mode === "alert" && elapsed > 650) setMode("tired", now);
        else if (mode === "tired" && elapsed > 850) setMode("sleeping", now);
        else if (mode === "drowsy" && elapsed > 900) setMode("sleeping", now);
      }
      render(now);
      if (!reducedMotion || mode !== "sleeping") animation = requestAnimationFrame(tick);
    };

    const resume = () => {
      cancelAnimationFrame(animation);
      last = performance.now();
      if (!disposed && loaded && !document.hidden) animation = requestAnimationFrame(tick);
    };
    wakeRef.current = () => {
      if (!loaded || mode === "flying" || mode === "landing") return;
      const now = performance.now();
      recentClicks = recentClicks.filter(time => now - time < 1800);
      recentClicks.push(now);
      if (recentClicks.length >= 3 && !reducedMotion) {
        recentClicks = [];
        takeOff(now);
      } else if (mode === "sleeping" || mode === "drowsy" || mode === "tired" || mode === "alert" || mode === "walking") setMode("waking", now);
      resume();
    };
    const onMusic = () => {
      lastActivity = performance.now();
      if (!loaded || (mode !== "sleeping" && mode !== "drowsy")) return;
      recentClicks = [];
      setMode("drowsy", performance.now());
      resume();
    };
    const onVisibility = () => {
      if (document.hidden) { hiddenSince = performance.now(); cancelAnimationFrame(animation); }
      else {
        const paused = performance.now() - hiddenSince;
        stageSince += paused;
        lastActivity += paused;
        resume();
      }
    };
    const onMotion = () => {
      reducedMotion = motion.matches;
      recentClicks = [];
      if (reducedMotion) { direction = 0; setMode("sleeping", performance.now()); }
      previousFrame = -1;
      resume();
    };
    const onResize = () => { measure(); if (loaded) render(performance.now()); };
    const onActivity = () => { lastActivity = performance.now(); };
    const onPointer = (event: PointerEvent) => { pointer = { x: event.clientX, y: event.clientY }; onActivity(); };
    const observer = new ResizeObserver(onResize);
    const dock = document.querySelector(".vinyl-dock");
    if (dock) observer.observe(dock);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener(VINYL_ACTIVITY_EVENT, onMusic);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    image.onload = () => {
      if (disposed) return;
      // Animate the folded-wing standing pose: alternating planted and swinging legs.
      const sx = sprites.poses.alert % sprites.columns * sprites.cell;
      const sy = Math.floor(sprites.poses.alert / sprites.columns) * sprites.cell;
      for (let phase = 0; phase < 8; phase++) {
        const frame = document.createElement("canvas");
        frame.width = frame.height = sprites.cell;
        const draw = frame.getContext("2d")!;
        draw.imageSmoothingEnabled = false;
        const bob = phase === 1 || phase === 5 ? 1 : 0;
        draw.drawImage(image, sx, sy, sprites.cell, 47, 0, -bob, sprites.cell, 47);
        for (let leg = 0; leg < 2; leg++) {
          const planted = (phase < 4) === (leg === 0);
          const beat = phase % 4;
          const offset = planted ? 1 - beat : [-2, 0, 2, 1][beat];
          const lift = planted ? 0 : [0, 1, 2, 1][beat];
          const left = leg === 0 ? 18 : 32;
          draw.drawImage(image, sx + left, sy + 47, 14, 5, left + offset, 47 - lift, 14, 5);
        }
        walkingFrames.push(frame);
      }
      loaded = true;
      lastActivity = performance.now();
      resume();
    };
    image.src = sprites.src;

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener(VINYL_ACTIVITY_EVENT, onMusic);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      image.onload = null;
      wakeRef.current = () => {};
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="dragon-companion"
      aria-label="Réveiller le petit dragon"
      title="Cliquer pour réveiller le dragon"
      onClick={() => wakeRef.current()}
    >
      <canvas ref={canvasRef} width={sprites.cell} height={sprites.cell} aria-hidden="true" />
    </button>
  );
}
