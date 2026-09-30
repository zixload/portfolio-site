// Les Ombres de Sunny (Shadow Slave) en pixel art, pour public/shadows.
//   NODE_PATH=node_modules node art/pixel/shadows-draw.js public/shadows [apercu.png]
//
// Chaque planche : cellules de 40 px, ligne 0 vers la droite, ligne 1 miroir.
// Colonnes : 0 repos, 1 alerte, 2 fatigue, 3-4 sommeil, 5-6 spéciale, puis la
// course (4 images). Les jambes sont articulées (hanche, genou, pied) : en
// course, le pied posé recule d'exactement AVANCE pixels d'une image à la
// suivante, et le moteur avance le sprite d'autant. Le pied reste donc au même
// pixel de l'écran : pas de glissement. Le moteur lit ces valeurs dans
// shadows.json.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const CELL = 40;
const GROUND = 38; // ligne des pieds
const PAL = {
  K: [9, 9, 12], A: [34, 34, 43], B: [56, 56, 70], H: [96, 96, 116],
  C: [20, 20, 26], R: [118, 18, 30], r: [178, 30, 44],
  E: [255, 48, 64], e: [112, 24, 32], S: [216, 220, 228], s: [120, 126, 140],
  G: [150, 150, 164], D: [62, 38, 36],
  N: [16, 16, 20], n: [42, 42, 54], m: [74, 64, 90],
  P: [22, 24, 29], p: [50, 56, 66], Y: [232, 196, 106],
  F: [30, 30, 37], f: [172, 176, 188], O: [255, 138, 31], o: [255, 210, 96],
};

// --------------------------------------------------------------- primitives
function canvas() { return Array.from({ length: CELL }, () => Array(CELL).fill(null)); }
function px(cv, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x >= 0 && x < CELL && y >= 0 && y < CELL && c) cv[y][x] = c;
}
function line(cv, x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(cv, x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function thick(cv, x0, y0, x1, y1, w, c) {
  // Trait épais : on décale le trait sur un petit disque.
  const r = (w - 1) / 2;
  for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++)
    if (ox * ox + oy * oy <= r * r + 0.3) line(cv, x0 + ox, y0 + oy, x1 + ox, y1 + oy, c);
}
function poly(cv, pts, c) {
  // Remplissage par balayage.
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y + 0.5 && y1 > y + 0.5) || (y1 <= y + 0.5 && y0 > y + 0.5))
        xs.push(x0 + ((y + 0.5 - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) px(cv, x, y, c);
  }
}
function ellipse(cv, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(cv, x, y, c);
    }
}
// Jambe à deux segments : le genou se place par cinématique inverse, plié
// vers l'avant (sens +x).
function leg(cv, hx, hy, fx, fy, thigh, shin, w, c, foot) {
  const dx = fx - hx, dy = fy - hy;
  const d = Math.min(Math.hypot(dx, dy), thigh + shin - 0.01);
  const a = Math.atan2(dy, dx);
  const b = Math.acos((thigh * thigh + d * d - shin * shin) / (2 * thigh * d));
  const kx = hx + thigh * Math.cos(a - b), ky = hy + thigh * Math.sin(a - b);
  thick(cv, hx, hy, kx, ky, w, c);
  thick(cv, kx, ky, fx, fy, w, c);
  if (foot) foot(fx, fy);
  return [kx, ky];
}

// Cycle de course à 4 images pour un pied. Posé 2 images : il recule d'AVANCE
// (de +adv/2 à -adv/2 autour de la hanche). En l'air 2 images : il revient.
function stepFoot(frame, offset, adv, lift) {
  const i = (frame + offset) % 4;
  const half = adv / 2;
  return [
    [half, 0],
    [-half, 0],
    [-half - 1, -lift],
    [half - 1, -Math.round(lift * 0.7)],
  ][i];
}

// ------------------------------------------------------------------- Saint
// Chevalière de pierre en armure de plates noire, cape (le Mantle of
// Darkness), yeux rubis, longue épée.
const SAINT_ADV = 6;
function saint(pose, frame) {
  const cv = canvas();
  const running = pose === "run";
  const kneel = pose === "tired" || pose.startsWith("sleep");
  const bob = running ? (frame % 2 === 0 ? 0 : -1) : 0;
  const hipX = 18, hipY = (kneel ? 30 : 25) + bob;
  const top = hipY - 12; // épaules

  // Cape : pend droite au repos, flotte vers l'arrière en courant.
  const hemBack = running ? 11 + (frame % 2) : kneel ? 7 : 4;
  const hemY = running ? GROUND - 6 + (frame % 2) : GROUND;
  poly(cv, [[hipX - 3, top], [hipX - 1, top], [hipX, top + 6], [hipX - 3, hemY], [hipX - hemBack, hemY], [hipX - 5, top + 3]], "C");
  line(cv, hipX - hemBack, hemY, hipX - 3, hemY, "R");
  line(cv, hipX - 1, top + 3, hipX - 3, hemY - 1, "R");

  // Jambes : arrière sombre, avant claire.
  const foot = (col) => (fx, fy) => { line(cv, fx - 1, fy, fx + 3, fy, col); line(cv, fx - 1, fy - 1, fx + 1, fy - 1, col); };
  let back, front;
  if (running) { back = stepFoot(frame, 2, SAINT_ADV, 4); front = stepFoot(frame, 0, SAINT_ADV, 4); }
  else if (kneel) { back = [-8, 0]; front = [4, 0]; }
  else { back = [-2, 0]; front = [2, 0]; }
  leg(cv, hipX - 1, hipY, hipX - 1 + back[0], GROUND + back[1], 7, 7, 3, "C", foot("K"));
  leg(cv, hipX + 1, hipY, hipX + 1 + front[0], GROUND + front[1], 7, 7, 3, "A", foot("K"));

  // Faudes, cuirasse à taille fine, ceinture.
  poly(cv, [[hipX - 5, hipY - 2], [hipX + 5, hipY - 2], [hipX + 6, hipY + 3], [hipX + 2, hipY + 2], [hipX, hipY + 4], [hipX - 2, hipY + 2], [hipX - 6, hipY + 3]], "C");
  poly(cv, [[hipX - 5, top], [hipX + 6, top], [hipX + 4, hipY - 4], [hipX + 3, hipY - 1], [hipX - 3, hipY - 1], [hipX - 4, hipY - 4]], "A");
  line(cv, hipX + 5, top + 1, hipX + 3, hipY - 2, "B");
  line(cv, hipX + 1, top + 1, hipX + 1, hipY - 3, "B");
  line(cv, hipX - 3, hipY - 2, hipX + 3, hipY - 2, "R");

  // Heaume fermé, fente de visière, yeux rubis, plumet.
  const bow = pose.startsWith("sleep") ? 1 : 0;
  const hx = hipX + 1 + bow, hy = top - 5 + bow;
  ellipse(cv, hx, hy - 1, 4.5, 5, "A");
  poly(cv, [[hx, hy - 2], [hx + 6, hy - 1], [hx + 6, hy + 2], [hx + 3, hy + 4], [hx - 3, hy + 4]], "A");
  line(cv, hx - 2, hy - 5, hx + 3, hy - 5, "B");
  line(cv, hx + 1, hy - 1, hx + 6, hy - 1, "K");
  const eye = pose === "sleep1" ? "e" : pose === "sleep2" ? "K" : "E";
  px(cv, hx + 3, hy - 1, eye); px(cv, hx + 5, hy - 1, eye);
  if (pose === "alert" || pose === "special1" || pose === "special2") { px(cv, hx + 3, hy, "r"); px(cv, hx + 5, hy, "r"); }
  const flow = running ? 3 : 0;
  line(cv, hx - 1, hy - 6, hx - 5 - flow, hy - 5 + (running ? 0 : 1), "R");
  line(cv, hx - 1, hy - 7, hx - 4 - flow, hy - 7 + (running ? 1 : 2), "r");
  if (!running) line(cv, hx - 5, hy - 4, hx - 6, hy - 1, "R");

  // Épée et bras avant.
  const shoulder = [hipX + 4, top + 2];
  let hand;
  if (pose === "special1") {
    hand = [hipX + 6, top - 5];
    thick(cv, hand[0], hand[1] - 2, hand[0], 1, 2, "S"); line(cv, hand[0] + 1, hand[1] - 2, hand[0] + 1, 2, "s");
    line(cv, hand[0] - 2, hand[1] - 1, hand[0] + 3, hand[1] - 1, "G");
  } else if (pose === "special2") {
    hand = [hipX + 9, top + 3];
    thick(cv, hand[0] + 2, hand[1], 39, hand[1], 2, "S"); line(cv, hand[0] + 2, hand[1] + 1, 39, hand[1] + 1, "s");
    line(cv, hand[0] + 1, hand[1] - 2, hand[0] + 1, hand[1] + 3, "G");
  } else if (running) {
    hand = [hipX + 7, top + 7];
    thick(cv, hand[0] + 1, hand[1] + 1, hand[0] + 9, hand[1] + 9, 2, "S");
    line(cv, hand[0] + 1, hand[1] + 2, hand[0] + 8, hand[1] + 9, "s");
    line(cv, hand[0] - 1, hand[1] + 2, hand[0] + 2, hand[1] - 1, "G");
  } else {
    const sx = hipX + 9, lift = pose === "alert" ? -2 : 0;
    hand = [sx - 1, top + 3 + lift];
    thick(cv, sx, top + 7 + lift, sx, GROUND - 1 + lift, 2, "S");
    line(cv, sx + 1, top + 7 + lift, sx + 1, GROUND - 1 + lift, "s");
    line(cv, sx - 2, top + 6 + lift, sx + 3, top + 6 + lift, "G");
    line(cv, sx, top + 3 + lift, sx, top + 5 + lift, "D");
    px(cv, sx, top + 2 + lift, "G");
  }
  thick(cv, shoulder[0], shoulder[1], hand[0], hand[1], 3, "A");
  ellipse(cv, hand[0], hand[1], 1.6, 1.6, "K");
  ellipse(cv, hipX + 5, top + 1, 3.2, 2.3, "B");
  line(cv, hipX + 3, top - 1, hipX + 7, top - 1, "H");
  return cv;
}

// --------------------------------------------------------------- Nightmare
// Étalon noir de jais : cornes recourbées, yeux cramoisis, sabots de métal,
// gueule de loup, voile d'ombre qui fume au-dessus du dos.
const HORSE_ADV = 9;
function arc(cv, pts, w, c) {
  for (let i = 0; i + 1 < pts.length; i++) thick(cv, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, c);
}
function nightmare(pose, frame) {
  const cv = canvas();
  const running = pose === "run";
  const lying = pose === "tired" || pose.startsWith("sleep");
  const bob = running ? (frame % 2 === 0 ? 0 : -1) : 0;
  const by = (lying ? 30 : 22) + bob;
  const hoof = (fx, fy) => { line(cv, fx - 1, fy, fx + 2, fy, "G"); line(cv, fx - 1, fy - 1, fx + 1, fy - 1, "G"); };

  // Queue d'ombre.
  if (running) arc(cv, [[7, by - 3], [3, by - 3 + (frame % 2)], [0, by - 1 + (frame % 2)]], 3, "N");
  else arc(cv, [[7, by - 3], [4, by + 1], [4, by + 8]], 3, "N");

  // Pattes : paire du fond plus sombre.
  const hips = [[10, "n"], [12, "N"], [24, "n"], [26, "N"]];
  const offsets = [2, 3, 0, 1];
  hips.forEach(([hx, col], i) => {
    if (lying) { thick(cv, hx, by + 3, hx + 5, by + 6, 3, col); hoof(hx + 6, by + 7); return; }
    let f = [0, 0];
    if (running) f = stepFoot(frame, offsets[i], HORSE_ADV, 5);
    if (pose === "special1" && i >= 2) f = [3, -8 + (i - 2) * 2];
    if (pose === "special2" && i >= 2) f = [5, -6 - (i - 2) * 2];
    leg(cv, hx, by + 2, hx + f[0], GROUND - 1 + f[1], 6, 8, 3, col, hoof);
  });

  // Corps massif, poitrail large.
  ellipse(cv, 16, by - 1, 11.5, 6.5, "N");
  ellipse(cv, 25, by - 2, 5.5, 6.5, "N");
  line(cv, 8, by - 7, 24, by - 7, "n");

  // Encolure épaisse et tête.
  const up = pose === "alert" || pose.startsWith("special") ? -2 : lying ? 3 : 0;
  const hx = 30, hy = by - 13 + up;
  poly(cv, [[21, by - 7], [28, by - 3], [hx + 4, hy + 5], [hx - 1, hy - 1]], "N");
  poly(cv, [[hx - 3, hy - 1], [hx + 1, hy - 4], [hx + 9, hy + 1], [hx + 10, hy + 4], [hx + 8, hy + 6], [hx + 2, hy + 6], [hx - 1, hy + 3]], "N");
  line(cv, hx, hy - 3, hx + 8, hy + 1, "n");
  // Longues cornes recourbées vers l'arrière.
  arc(cv, [[hx - 1, hy - 3], [hx - 4, hy - 6], [hx - 8, hy - 7], [hx - 10, hy - 5]], 2, "m");
  arc(cv, [[hx + 1, hy - 4], [hx - 1, hy - 8], [hx - 5, hy - 10], [hx - 7, hy - 9]], 2, "m");
  // Œil cramoisi, crocs de loup.
  const eye = pose === "sleep1" ? "e" : pose === "sleep2" ? "N" : "E";
  px(cv, hx + 3, hy, eye);
  if (eye === "E") { px(cv, hx + 4, hy, eye); px(cv, hx + 4, hy - 1, "r"); }
  px(cv, hx + 5, hy + 6, "S"); px(cv, hx + 7, hy + 6, "S"); px(cv, hx + 9, hy + 5, "S");
  // Crinière d'ombre qui fume le long de l'encolure.
  for (let i = 0; i < 6; i++) {
    const x = 21 + i * 1.4, y = by - 8 - i * 1.3;
    px(cv, x - 1 - (running ? frame % 2 : 0), y - 1, "m");
    px(cv, x - 2 - (running ? 1 : 0), y + ((i + frame) % 2), "n");
  }
  return cv;
}

// ------------------------------------------------------------ Soul Serpent
// Serpent d'ombre : les ondulations sont fixes par rapport au sol, il avance
// en s'y glissant. Spéciale : il devient l'odachi noir au serpent gravé.
const SERPENT_ADV = 6;
function serpent(pose, frame) {
  const cv = canvas();
  if (pose.startsWith("special")) {
    const glint = pose === "special1" ? 12 : 22;
    thick(cv, 5, 34, 29, 10, 2, "P"); line(cv, 6, 35, 30, 11, "s");
    for (let i = 0; i < 6; i++) px(cv, 9 + i * 3, 29 - i * 3 + (i % 2), "p");
    px(cv, glint, 36 - glint, "S");
    line(cv, 28, 8, 32, 12, "G");
    thick(cv, 31, 9, 36, 4, 2, "D");
    return cv;
  }
  const running = pose === "run";
  // Longueur d'onde telle que 4 images font un cycle complet : l'onde se
  // décale d'AVANCE pixels par image, comme le sol sous lui.
  const k = (2 * Math.PI) / (4 * SERPENT_ADV);
  const shift = running ? frame * SERPENT_ADV : 0;
  const amp = running ? 2 : 1.4;
  const yAt = (x) => GROUND - 2 + amp * Math.sin(k * (x + shift));
  for (let x = 3; x <= 29; x++) {
    const t = x < 8 ? 1 + (x - 3) * 0.5 : 3.5; // la queue s'effile
    const y = yAt(x);
    for (let d = -t / 2; d <= t / 2; d += 1) px(cv, x, y + d, d < -t / 2 + 1 ? "p" : "P");
    if (x % 3 === 0) px(cv, x, y + t / 2 - 1, "p");
  }
  // Cou dressé et tête.
  const lowered = pose === "tired" || pose.startsWith("sleep");
  const headY = lowered ? GROUND - 6 : pose === "alert" ? 21 : 24;
  const base = [29, yAt(29)];
  thick(cv, base[0], base[1], 32, headY + 4, 3, "P");
  line(cv, base[0] + 1, base[1] - 1, 33, headY + 4, "p");
  ellipse(cv, 34, headY + 1, 3.6, 2.6, "P");
  poly(cv, [[34, headY - 1], [39, headY + 1], [38, headY + 3], [33, headY + 3]], "P");
  line(cv, 33, headY - 1, 37, headY, "p");
  const eye = pose === "sleep1" ? "e" : pose === "sleep2" ? "P" : "Y";
  px(cv, 35, headY, eye);
  if (pose === "alert" || (running && frame % 2 === 0)) { px(cv, 39, headY + 3, "r"); line(cv, 39, headY + 3, 39, headY + 4, "r"); }
  return cv;
}

// ------------------------------------------------------------------- Fiend
// Démon massif à quatre bras, plaques noires et argent, yeux et gueule de feu
// orangé. Spéciale : il crache des flammes.
const FIEND_ADV = 4;
function fiend(pose, frame) {
  const cv = canvas();
  const running = pose === "run";
  const sit = pose === "tired" || pose.startsWith("sleep");
  const bob = running ? (frame % 2 === 0 ? 0 : -1) : 0;
  const hipX = 17, hipY = (sit ? 34 : 31) + bob;
  const cy = hipY - 8;
  const swing = running ? (frame % 2 === 0 ? 2 : -2) : 0;
  const up = pose === "alert" ? -7 : 0;
  const claw = (x, y) => { ellipse(cv, x, y, 2.2, 2, "F"); px(cv, x + 2, y + 1, "f"); px(cv, x + 1, y + 2, "f"); };

  // Bras arrière, derrière le corps.
  thick(cv, hipX - 4, cy - 4, hipX - 9 - swing, cy + 1 + up, 4, "K");
  claw(hipX - 9 - swing, cy + 3 + up);
  thick(cv, hipX - 4, cy + 1, hipX - 8 + swing, cy + 6, 4, "K");
  claw(hipX - 8 + swing, cy + 8);

  // Jambes courtes et puissantes.
  const foot = (fx, fy) => { line(cv, fx - 2, fy, fx + 3, fy, "F"); px(cv, fx + 3, fy - 1, "f"); };
  if (sit) {
    thick(cv, hipX - 2, hipY, hipX + 4, GROUND, 5, "F"); foot(hipX + 5, GROUND);
    thick(cv, hipX + 3, hipY, hipX + 9, GROUND, 5, "F"); foot(hipX + 10, GROUND);
  } else {
    const b = running ? stepFoot(frame, 2, FIEND_ADV, 3) : [-2, 0];
    const f = running ? stepFoot(frame, 0, FIEND_ADV, 3) : [2, 0];
    leg(cv, hipX - 2, hipY, hipX - 2 + b[0], GROUND + b[1], 4, 4, 5, "K", foot);
    leg(cv, hipX + 3, hipY, hipX + 3 + f[0], GROUND + f[1], 4, 4, 5, "F", foot);
  }

  // Torse massif : plastron en V et épaulières d'argent.
  ellipse(cv, hipX, cy, 9, 8.5, "F");
  line(cv, hipX - 5, cy - 4, hipX + 1, cy + 3, "f");
  line(cv, hipX + 7, cy - 4, hipX + 1, cy + 3, "f");
  ellipse(cv, hipX + 5, cy - 6, 4, 2.4, "f");
  ellipse(cv, hipX + 5, cy - 5.5, 3.4, 1.6, "F");
  line(cv, hipX - 3, cy + 6, hipX + 5, cy + 6, "K");

  // Tête : mâchoire énorme, gueule de feu, cornes de taureau.
  const hx = hipX + 4, hy = cy - 11;
  ellipse(cv, hx, hy, 5, 4, "F");
  poly(cv, [[hx - 2, hy + 1], [hx + 7, hy], [hx + 7, hy + 5], [hx, hy + 5]], "F");
  arc(cv, [[hx - 3, hy - 2], [hx - 7, hy - 4], [hx - 7, hy - 8], [hx - 5, hy - 9]], 2, "f");
  arc(cv, [[hx + 2, hy - 3], [hx + 3, hy - 7], [hx + 6, hy - 9]], 2, "f");
  const eye = pose === "sleep1" ? "e" : pose === "sleep2" ? "F" : "O";
  px(cv, hx + 2, hy - 1, eye); px(cv, hx + 4, hy - 1, eye);
  const sleeping = pose.startsWith("sleep");
  line(cv, hx + 1, hy + 2, hx + 7, hy + 2, sleeping ? "K" : "O");
  line(cv, hx + 2, hy + 3, hx + 6, hy + 3, sleeping ? "F" : "o");
  px(cv, hx + 3, hy + 2, "S"); px(cv, hx + 5, hy + 2, "S");

  // Bras avant, devant le corps.
  thick(cv, hipX + 6, cy - 3, hipX + 11 + swing, cy + 1 + up, 4, "F");
  line(cv, hipX + 7, cy - 5, hipX + 12 + swing, cy - 1 + up, "f");
  claw(hipX + 12 + swing, cy + 3 + up);
  thick(cv, hipX + 6, cy + 2, hipX + 10 - swing, cy + 7, 4, "F");
  claw(hipX + 11 - swing, cy + 9);

  if (pose.startsWith("special")) {
    const long = pose === "special1" ? 9 : 13;
    poly(cv, [[hx + 7, hy + 1], [hx + 7 + long, hy - 3], [hx + 9 + long, hy + 3], [hx + 7 + long, hy + 8]], "O");
    poly(cv, [[hx + 7, hy + 2], [hx + 5 + long, hy], [hx + 5 + long, hy + 5]], "o");
  }
  return cv;
}

// ---------------------------------------------------------------- planches
const POSES = ["idle", "alert", "tired", "sleep1", "sleep2", "special1", "special2"];
const RUN_FRAMES = 4;
const CREATURES = {
  saint: { draw: saint, adv: SAINT_ADV, frameMs: 80 },
  nightmare: { draw: nightmare, adv: HORSE_ADV, frameMs: 80 },
  serpent: { draw: serpent, adv: SERPENT_ADV, frameMs: 90 },
  fiend: { draw: fiend, adv: FIEND_ADV, frameMs: 100 },
};

async function rowPng(frames, mirror) {
  const n = frames.length;
  const buf = Buffer.alloc(CELL * n * CELL * 4);
  frames.forEach((cv, f) => {
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const c = cv[y][mirror ? CELL - 1 - x : x];
      if (!c) continue;
      const i = (y * CELL * n + f * CELL + x) * 4;
      const [r, g, b] = PAL[c];
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  });
  return sharp(buf, { raw: { width: CELL * n, height: CELL, channels: 4 } }).png().toBuffer();
}

(async () => {
  const out = process.argv[2];
  const preview = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const meta = { cell: CELL, poses: POSES, run: [], creatures: {} };
  const rows = [];
  for (const [name, c] of Object.entries(CREATURES)) {
    const frames = POSES.map((p) => c.draw(p, 0));
    for (let i = 0; i < RUN_FRAMES; i++) frames.push(c.draw("run", i));
    const right = await rowPng(frames, false);
    const left = await rowPng(frames, true);
    const w = CELL * frames.length;
    await sharp({ create: { width: w, height: CELL * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: right, left: 0, top: 0 }, { input: left, left: 0, top: CELL }])
      .png().toFile(path.join(out, `${name}.png`));
    meta.creatures[name] = { adv: c.adv, frameMs: c.frameMs };
    rows.push(right);
  }
  meta.run = Array.from({ length: RUN_FRAMES }, (_, i) => POSES.length + i);
  fs.writeFileSync(path.join(out, "shadows.json"), JSON.stringify(meta, null, 2) + "\n");
  if (preview) {
    const scale = 5, n = POSES.length + RUN_FRAMES;
    const big = await Promise.all(rows.map((r) => sharp(r).resize(CELL * n * scale, CELL * scale, { kernel: "nearest" }).toBuffer()));
    await sharp({ create: { width: CELL * n * scale, height: CELL * scale * big.length, channels: 4, background: "#ffffff" } })
      .composite(big.map((input, i) => ({ input, left: 0, top: i * CELL * scale })))
      .flatten({ background: "#ffffff" }).png().toFile(preview);
  }
  console.log("ok", Object.keys(CREATURES).join(", "));
})();
