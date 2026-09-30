// Saint en pixel art 48x48, vue dans 8 directions (5 dessinées, 3 en miroir).
//   NODE_PATH=node_modules node art/pixel/saint8.js --site public/shadows/saint.png src/lib/shadows/saint.json
//   (ou un chemin .png / .gif / -tour.gif pour les aperçus de validation)
// Étape de validation : poses immobiles de chaque vue, agrandies.
const sharp = require("sharp");

const CELL = 48;
const GROUND = 46;
const PAL = {
  K: [8, 8, 11], // contour, jointures
  b: [34, 34, 44], // plate, ombre
  A: [52, 52, 66], // plate
  B: [80, 80, 100], // plate, lumière
  H: [124, 124, 150], // reflet
  h: [182, 182, 204], // reflet vif
  C: [13, 13, 17], // cape
  c: [24, 24, 31], // cape, pli
  R: [112, 16, 28], // doublure, plumet
  r: [170, 28, 42], // plumet clair
  E: [255, 52, 66], // yeux rubis
  e: [140, 22, 34], // halo des yeux
  S: [222, 226, 234], // lame
  s: [122, 128, 142], // lame, ombre
  G: [168, 168, 182], // garde, pommeau
  D: [58, 36, 34], // poignée
};

// --- primitives -------------------------------------------------------------
function canvas() { return Array.from({ length: CELL }, () => Array(CELL).fill(null)); }
// Le haut du corps est dessiné avec un décalage vertical (UP) : jambes plus
// longues, silhouette élancée.
let OFFY = 0;
const UP = -2;
function px(cv, x, y, c) { x = Math.round(x); y = Math.round(y + OFFY); if (x >= 0 && x < CELL && y >= 0 && y < CELL && c) cv[y][x] = c; }
function line(cv, x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) { px(cv, x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
function thick(cv, x0, y0, x1, y1, w, c) {
  const r = (w - 1) / 2;
  for (let oy = -r; oy <= r; oy += 0.5) for (let ox = -r; ox <= r; ox += 0.5)
    if (ox * ox + oy * oy <= r * r + 0.3) line(cv, x0 + ox, y0 + oy, x1 + ox, y1 + oy, c);
}
function poly(cv, pts, c) {
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y + 0.5 && y1 > y + 0.5) || (y1 <= y + 0.5 && y0 > y + 0.5)) xs.push(x0 + ((y + 0.5 - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) px(cv, x, y, c);
  }
}
function ellipse(cv, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(cv, x, y, c);
    }
}
// Contour sombre d'un pixel autour de la silhouette : la détache de la page.
function outline(cv) {
  const out = canvas();
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    if (cv[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cv[y + dy]?.[x + dx] && cv[y + dy][x + dx] !== "K")) out[y][x] = "K";
  }
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (out[y][x]) cv[y][x] = "K";
}

// --- pièces communes -------------------------------------------------------
// Lumière venant d'en haut à gauche : bord gauche éclairé, droit dans l'ombre.
function sabaton(cv, x, y, dir) {
  if (dir) {
    poly(cv, [[x - 2, y - 2.5], [x + 2, y - 2.5], [x + 5.5, y + 0.6], [x - 2, y + 0.6]], "A");
    line(cv, x - 1, y - 2, x + 2, y - 2, "B"); line(cv, x - 2, y, x + 5, y, "b");
  } else {
    poly(cv, [[x - 2, y - 2.5], [x + 2, y - 2.5], [x + 2.5, y + 0.6], [x - 2.5, y + 0.6]], "A");
    px(cv, x - 1, y - 2, "B"); line(cv, x - 2, y, x + 2, y, "b");
  }
}
// Jambe d'armure : cuissot, genouillère, jambière.
function armoredLeg(cv, hx, hy, fx, fy, dark) {
  const kx = (hx + fx) / 2, ky = (hy + fy) / 2;
  thick(cv, hx, hy, kx, ky, 4, dark ? "b" : "A");
  thick(cv, kx, ky, fx, fy - 2, 3.5, dark ? "b" : "A");
  if (!dark) { line(cv, hx - 1.5, hy + 1, kx - 1.5, ky - 1, "B"); line(cv, kx - 1.2, ky + 2, fx - 1.2, fy - 3, "B"); }
  ellipse(cv, kx, ky, 2.1, 1.7, dark ? "A" : "B");
  if (!dark) px(cv, kx - 1, ky - 1, "H");
  line(cv, kx - 1.5, ky + 1.6, kx + 1.5, ky + 1.6, "K");
}
// Épaulière à trois lames.
function pauldron(cv, x, y, lit) {
  ellipse(cv, x, y, 3.6, 2.5, lit ? "B" : "A");
  line(cv, x - 3, y - 2, x + 1, y - 2.4, lit ? "H" : "B");
  if (lit) px(cv, x - 1, y - 2, "h");
  line(cv, x - 3.2, y + 1.6, x + 3.2, y + 1.6, "K");
  line(cv, x - 3, y + 2.6, x + 3, y + 2.6, lit ? "A" : "b");
  line(cv, x - 2.6, y + 3.5, x + 2.6, y + 3.5, "K");
}
function gauntlet(cv, x, y) {
  ellipse(cv, x, y, 1.9, 1.7, "A");
  px(cv, x - 1, y - 1, "B");
  line(cv, x - 1, y + 1, x + 1, y + 1, "K");
}
// Épée plantée au repos (elle marche sans) : pommeau, poignée, garde, lame
// jusqu'au sol.
function swordPlanted(cv, x, top) {
  const saved = OFFY; OFFY = 0; top += UP;
  px(cv, x, top, "G"); px(cv, x + 1, top, "H");
  line(cv, x, top + 1, x, top + 3, "D"); line(cv, x + 1, top + 1, x + 1, top + 3, "D");
  line(cv, x - 3, top + 4, x + 4, top + 4, "G"); px(cv, x - 3, top + 3, "G"); px(cv, x + 4, top + 3, "G");
  for (let y = top + 5; y <= GROUND - 1; y++) { px(cv, x, y, "S"); px(cv, x + 1, y, "s"); }
  px(cv, x, GROUND, "S");
  OFFY = saved;
}
// Cuirasse vue de face (ou de trois-quarts avec `turn` > 0) : épaules larges,
// taille fine, plastron à arête centrale, ceinture pourpre, faudes évasées.
function cuirass(cv, cx, turn) {
  const o = turn * 0.5, l = cx - 6 + o, r = cx + 6 + o, ridge = cx + turn;
  poly(cv, [[l, 17], [r, 17], [r - 1, 22], [cx + 3 + o, 28], [cx - 3 + o, 28], [l + 1, 22]], "A");
  poly(cv, [[ridge, 17], [r, 17], [r - 1, 22], [cx + 3 + o, 28], [ridge, 28]], "b");
  line(cv, l + 1, 18, l + 2, 22, "B"); line(cv, l + 2, 22, cx - 2.5 + o, 27, "B");
  line(cv, ridge, 18, ridge, 27, "B"); px(cv, ridge, 19, "H");
  line(cv, l + 1.5, 23.5, r - 1.5, 23.5, "K");
  line(cv, cx - 3.5 + o, 28.5, cx + 3.5 + o, 28.5, "R"); px(cv, ridge, 28.5, "G");
  poly(cv, [[cx - 4 + o, 29.2], [cx + 4 + o, 29.2], [cx + 5.5 + o, 34], [cx + 2 + o, 33], [cx + o, 35.5], [cx - 2 + o, 33], [cx - 5.5 + o, 34]], "A");
  line(cv, cx - 4 + o, 29.5, cx - 5 + o, 33.5, "B");
  line(cv, cx - 5 + o, 31.5, cx + 5 + o, 31.5, "K");
}
// Heaume (bassinet) : calotte, arête, visière avancée ; `turn` décale la
// visière vers la droite (0 de face, 1 trois-quarts, 2 profil).
function helmet(cv, cx, turn, eyes) {
  const vx = cx + turn * 1.6;
  ellipse(cv, cx, 9.3, 4, 5, "A");
  poly(cv, [[cx - 3.8 + turn, 9], [vx + 4 + turn * 1.4, 9.5], [vx + 3 + turn, 13], [cx + turn * 0.6, 15.2], [cx - 3 + turn * 0.4, 13.5]], "A");
  poly(cv, [[cx + 1 + turn, 4.5], [cx + 4.3, 7], [vx + 4 + turn * 1.4, 9.5], [vx + 3 + turn, 13], [cx + 1 + turn, 15]], "b");
  line(cv, cx - 3, 6, cx - 1, 4, "B"); line(cv, cx - 3.8, 7, cx - 3.8, 11, "B"); px(cv, cx - 2, 5, "H");
  line(cv, cx + turn * 0.5, 4, cx + turn * 0.9, 9, "B");
  line(cv, cx - 2.5 + turn * 1.2, 10, vx + 3.5 + turn * 1.2, 10, "K");
  if (eyes) eyes.forEach((x) => { px(cv, x, 10, "E"); px(cv, x, 11, "e"); });
  px(cv, vx + 1 + turn, 12.5, "K"); px(cv, vx + 2.5 + turn, 12, "K");
  poly(cv, [[cx - 3, 14.5], [cx + 3 + turn * 0.5, 14.5], [cx + 3.5 + turn * 0.5, 17], [cx - 3.5, 17]], "b");
  line(cv, cx - 3, 15, cx - 3.5, 16.5, "B");
}

// Heaume de profil : même calotte arrondie que les autres vues, sans visière
// en bec. De côté on ne voit qu'un œil, au bout de la fente.
function helmetProfile(cv, cx) {
  ellipse(cv, cx, 9.3, 4.7, 5, "A");
  poly(cv, [[cx - 3.8, 10], [cx + 4.6, 10.5], [cx + 3.8, 13.4], [cx + 0.5, 15.2], [cx - 3, 13.6]], "A");
  // ombre en bas vers l'avant, lumière en haut à gauche, arête sur le devant
  poly(cv, [[cx - 1, 12.5], [cx + 3.9, 12.5], [cx + 3.2, 14], [cx + 0.5, 15.2], [cx - 2.5, 13.8]], "b");
  line(cv, cx - 3, 6.2, cx - 1, 4.4, "B"); line(cv, cx - 4.3, 7.5, cx - 4.3, 11.5, "B"); px(cv, cx - 2, 5.2, "H");
  line(cv, cx + 2, 5.2, cx + 4.3, 8.5, "B");
  // fente de visière jusqu'au bord avant, un seul œil qui luit dedans
  line(cv, cx - 0.5, 10, cx + 4.4, 10, "K");
  px(cv, cx + 3, 10, "E"); px(cv, cx + 4, 10, "E"); px(cv, cx + 2, 10, "e"); px(cv, cx + 3, 11, "e");
  // trous d'aération
  px(cv, cx + 2, 12.5, "K"); px(cv, cx + 3, 12.2, "K");
  // gorgerin
  poly(cv, [[cx - 3, 14.5], [cx + 2.5, 14.5], [cx + 3, 17], [cx - 3.5, 17]], "b");
  line(cv, cx - 3, 15, cx - 3.5, 16.5, "B");
}

// Heaume de trois-quarts face : même calotte ronde, l'arête et la fente
// tournent vers la droite ; l'œil lointain, raccourci, est près du bord.
function helmetQuarterFront(cv, cx) {
  ellipse(cv, cx, 9.3, 4.5, 5, "A");
  poly(cv, [[cx - 3.6, 10], [cx + 4.4, 10], [cx + 3.6, 13.4], [cx + 0.8, 15.2], [cx - 3, 13.6]], "A");
  // côté droit dans l'ombre, lumière en haut à gauche
  poly(cv, [[cx + 2.5, 4.8], [cx + 4.5, 8], [cx + 4.4, 10.5], [cx + 3.6, 13.4], [cx + 1.8, 14.8], [cx + 2.5, 10]], "b");
  line(cv, cx - 3, 6.2, cx - 1, 4.4, "B"); line(cv, cx - 4.1, 7.5, cx - 4.1, 11.5, "B"); px(cv, cx - 2, 5.2, "H");
  // arête centrale, décalée vers la droite
  line(cv, cx + 1.2, 4.6, cx + 1.4, 9, "B"); line(cv, cx + 1.4, 11, cx + 1.2, 14.4, "B");
  // fente de visière et deux yeux : le proche net, le lointain au bord
  line(cv, cx - 2.2, 10, cx + 4.3, 10, "K");
  px(cv, cx - 0.5, 10, "E"); px(cv, cx - 0.5, 11, "e");
  px(cv, cx + 3, 10, "E");
  // trous d'aération
  px(cv, cx + 2.4, 12.4, "K"); px(cv, cx + 3.4, 12, "K");
  poly(cv, [[cx - 3, 14.5], [cx + 3, 14.5], [cx + 3.5, 17], [cx - 3.5, 17]], "b");
  line(cv, cx - 3, 15, cx - 3.5, 16.5, "B");
}
// Heaume de trois-quarts dos : calotte ronde vue de l'arrière ; seul le bout
// de la fente dépasse sur le bord droit, avec une lueur rubis.
function helmetQuarterBack(cv, cx) {
  ellipse(cv, cx, 9.3, 4.5, 5, "A");
  poly(cv, [[cx - 3.6, 10], [cx + 4.4, 10], [cx + 3.4, 13.4], [cx + 0.5, 15.2], [cx - 3, 13.6]], "A");
  poly(cv, [[cx + 1.5, 4.8], [cx + 4.5, 8], [cx + 4.4, 10.5], [cx + 3.4, 13.4], [cx + 0.5, 15.2], [cx + 1, 10]], "b");
  line(cv, cx - 3, 6.2, cx - 1, 4.4, "B"); line(cv, cx - 4.1, 7.5, cx - 4.1, 11.5, "B"); px(cv, cx - 2, 5.2, "H");
  // bord de la visière qui tourne sur le côté
  line(cv, cx + 3, 10, cx + 4.4, 10, "K"); px(cv, cx + 4, 10, "E"); px(cv, cx + 3, 10, "e");
  line(cv, cx + 3.2, 9, cx + 4.3, 9, "B");
  poly(cv, [[cx - 3, 14.5], [cx + 3.5, 14.5], [cx + 4, 17], [cx - 3.5, 17]], "b");
  line(cv, cx - 3, 15, cx - 3.5, 16.5, "B");
}

// --- marche ------------------------------------------------------------------
// Vecteur d'un pas par vue : le moteur avance le sprite d'exactement ce vecteur
// à chaque image. Le pied posé recule du même vecteur dans le dessin, il reste
// donc fixe à l'écran : aucun glissement.
const STEP = { E: [6, 0], SE: [5, 3], S: [0, 4], NE: [5, -3], N: [0, -4] };
// Pour chaque image : fraction du pas où se trouve le pied, et sa levée.
// Posé sur les images 0 et 1 (il recule d'un pas entier), en l'air sur 2 et 3.
const PHASES = [[0.5, 0], [-0.5, 0], [-0.25, 1], [0.2, 0.55]];
function footAt(f, offset, step, lift) {
  const [t, l] = PHASES[(f + offset) % 4];
  return [step[0] * t, step[1] * t - l * lift];
}
// Le corps monte d'un pixel quand les jambes se croisent.
const bobOf = (f) => (f % 2 === 1 ? -1 : 0);
// Jambe pliée : le genou se place par cinématique inverse, vers l'avant.
function ikLeg(cv, hx, hy, fx, fy, dark) {
  const T = 8.4, S = 8.4;
  const ax = fx, ay = fy - 2;
  const d = Math.min(Math.hypot(ax - hx, ay - hy), T + S - 0.05);
  const a = Math.atan2(ay - hy, ax - hx);
  const b = Math.acos((T * T + d * d - S * S) / (2 * T * d));
  const kx = hx + T * Math.cos(a - b), ky = hy + T * Math.sin(a - b);
  thick(cv, hx, hy, kx, ky, 4, dark ? "b" : "A");
  thick(cv, kx, ky, ax, ay, 3.5, dark ? "b" : "A");
  if (!dark) { line(cv, hx - 1.5, hy + 1, kx - 1.5, ky - 1, "B"); line(cv, kx - 1.2, ky + 2, ax - 1.2, ay - 1, "B"); }
  ellipse(cv, kx, ky, 2.1, 1.7, dark ? "A" : "B");
  if (!dark) px(cv, kx - 1, ky - 1, "H");
  line(cv, kx - 1.5, ky + 1.6, kx + 1.5, ky + 1.6, "K");
}

// --- vue de profil (E) --------------------------------------------------------
function side(f) {
  const cv = canvas();
  const walk = f != null, bob = walk ? bobOf(f) : 0;
  // cape : pend au repos, s'écarte vers l'arrière en marchant
  const hemX = walk ? 10 - (f % 2) : 12;
  poly(cv, [[19, 13 + bob], [22, 14 + bob], [22, 28], [21, GROUND], [hemX, GROUND], [14 - (walk ? 1 : 0), 32], [16, 17 + bob]], "C");
  line(cv, 16, 18 + bob, hemX + 1, GROUND - 1, "c"); line(cv, 19, 19 + bob, 18, GROUND - 1, "c");
  line(cv, 21, 17 + bob, 20.5, GROUND - 1, "R"); line(cv, hemX, GROUND, 20, GROUND, "R");
  if (walk) {
    const b = footAt(f, 2, STEP.E, 4), fr = footAt(f, 0, STEP.E, 4);
    ikLeg(cv, 22, 30 + bob, 22 + b[0], GROUND + b[1], true); sabaton(cv, 22 + b[0], GROUND + b[1], 1);
    ikLeg(cv, 25, 30 + bob, 25 + fr[0], GROUND + fr[1], false); sabaton(cv, 25 + fr[0], GROUND + fr[1], 1);
  } else {
    armoredLeg(cv, 22, 30, 21, GROUND, true); sabaton(cv, 21, GROUND, 1);
    armoredLeg(cv, 25, 30, 27, GROUND, false); sabaton(cv, 27, GROUND, 1);
  }
  OFFY = UP + bob;
  poly(cv, [[20, 29.2], [27, 29.2], [28.5, 34], [25, 33], [23, 35.5], [19.5, 33.5]], "A");
  line(cv, 20, 29.5, 19, 33, "B"); line(cv, 19.5, 31.5, 28, 31.5, "K");
  poly(cv, [[19, 17], [28.5, 17], [29, 21], [27, 28], [21, 28], [20, 22]], "A");
  poly(cv, [[25.5, 17], [28.5, 17], [29, 21], [27, 28], [25, 28]], "b");
  line(cv, 20, 18, 21, 27, "B"); line(cv, 28, 18, 28.5, 21, "B");
  line(cv, 20.5, 23.5, 28, 23.5, "K");
  line(cv, 21, 28.5, 27, 28.5, "R"); px(cv, 26, 28.5, "G");
  helmetProfile(cv, 24.5);
  const flow = walk ? 1 : 0;
  thick(cv, 23, 3.8, 19 - flow, 3.2, 2.2, "R"); thick(cv, 19 - flow, 3.2, 16 - flow, 6.5, 2, "R"); line(cv, 16 - flow, 6.5, 15.5 - flow, 10, "R");
  line(cv, 23, 3.2, 19 - flow, 2.3, "r"); line(cv, 19 - flow, 2.3, 16.5 - flow, 4.5, "r");
  if (walk) {
    // sans épée en marchant : le bras se balance à l'opposé de la jambe
    const sw = [-2, 0, 2, 0][f];
    thick(cv, 28, 19.5, 28.5 + sw, 26, 3.5, "A"); line(cv, 28.5, 18.5, 29 + sw, 25, "B");
    gauntlet(cv, 28.8 + sw, 27);
  } else {
    swordPlanted(cv, 36, 21);
    thick(cv, 28, 19.5, 33, 24, 3.5, "A"); line(cv, 28.5, 18.5, 33.5, 23, "B");
    gauntlet(cv, 35, 24);
  }
  pauldron(cv, 27.5, 18, true);
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- vue de face (S) -------------------------------------------------------------
function front(f) {
  const cv = canvas();
  const walk = f != null, bob = walk ? bobOf(f) : 0, sway = walk ? (f % 2 ? 1 : -1) : 0;
  poly(cv, [[18, 14 + bob], [30, 14 + bob], [35 + sway, GROUND], [13 + sway, GROUND]], "C");
  line(cv, 16, 25 + bob, 14 + sway, GROUND - 1, "R"); line(cv, 32, 25 + bob, 34 + sway, GROUND - 1, "R");
  if (walk) {
    // pieds dans la profondeur : le pied posé devant est plus bas à l'écran
    const l = footAt(f, 0, STEP.S, 4), r = footAt(f, 2, STEP.S, 4);
    const legs = [[21.5, 21 + l[0], 44 + l[1], false], [26.5, 27 + r[0], 44 + r[1], true]];
    legs.sort((a, b) => a[2] - b[2]).forEach(([hx, fx, fy, dark]) => { armoredLeg(cv, hx, 30 + bob, fx, fy, dark); sabaton(cv, fx, fy, 0); });
  } else {
    armoredLeg(cv, 21.5, 30, 21, GROUND, false); sabaton(cv, 21, GROUND, 0);
    armoredLeg(cv, 26.5, 30, 27, GROUND, true); sabaton(cv, 27, GROUND, 0);
  }
  OFFY = UP + bob;
  cuirass(cv, 24, 0);
  if (walk) {
    // les bras se balancent en opposition
    const sw = f % 2 ? 1 : -1;
    thick(cv, 17, 20, 15, 27 + sw, 3.5, "A"); line(cv, 16, 19.5, 14, 26.5 + sw, "B"); gauntlet(cv, 14.8, 28 + sw);
    thick(cv, 31, 20, 33, 27 - sw, 3.5, "b"); gauntlet(cv, 33.2, 28 - sw);
  } else {
    swordPlanted(cv, 11, 23);
    thick(cv, 17, 20, 13.5, 26, 3.5, "A"); line(cv, 16, 19.5, 12.5, 25.5, "B"); gauntlet(cv, 12.5, 26.5);
    thick(cv, 31, 20, 33, 27.5, 3.5, "b"); gauntlet(cv, 33.3, 28.5);
  }
  pauldron(cv, 17, 18, true); pauldron(cv, 31, 18, false);
  helmet(cv, 24, 0, [22, 26]);
  line(cv, 23, 3.6, 25.5, 3, "R"); line(cv, 25.5, 3, 27.5, 4, "r");
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- trois-quarts face (SE) ------------------------------------------------------
function frontQuarter(f) {
  const cv = canvas();
  const walk = f != null, bob = walk ? bobOf(f) : 0;
  const hem = walk ? 10 - (f % 2) : 11;
  poly(cv, [[18, 14 + bob], [23, 14 + bob], [19, GROUND], [hem, GROUND]], "C");
  line(cv, 18, 25 + bob, hem + 2, GROUND - 1, "R");
  if (walk) {
    const b = footAt(f, 2, STEP.SE, 4), fr = footAt(f, 0, STEP.SE, 4);
    // De trois-quarts face, le pas vient vers nous : jambes droites sous le
    // corps qui raccourcissent en perspective, pieds tournés vers l'avant. Des
    // genoux pliés de côté donnaient une marche en crabe.
    const legs = [[21.5, 22 + b[0], 44 + b[1], true], [26, 25.5 + fr[0], 45 + fr[1], false]];
    legs.sort((p, q) => p[2] - q[2]).forEach(([hx, fx, fy, dark]) => {
      armoredLeg(cv, hx, 30 + bob, fx, fy, dark);
      sabaton(cv, fx + 0.5, fy, 0);
    });
  } else {
    armoredLeg(cv, 21.5, 30, 20.5, GROUND, true); sabaton(cv, 20.5, GROUND, 1);
    armoredLeg(cv, 26, 30, 27.5, GROUND, false); sabaton(cv, 27.5, GROUND, 1);
  }
  OFFY = UP + bob;
  cuirass(cv, 24, 1.5);
  if (walk) {
    const sw = [1, 0, -1, 0][f];
    thick(cv, 18.5, 20, 16.5, 26.5 - sw, 3.5, "b"); gauntlet(cv, 16.3, 27.5 - sw);
    thick(cv, 29.5, 20, 31.5, 26.5 + sw, 3.5, "A"); line(cv, 30, 19, 32, 25.5 + sw, "B"); gauntlet(cv, 31.8, 27.5 + sw);
  } else {
    swordPlanted(cv, 35, 22);
    thick(cv, 18.5, 20, 16.5, 26.5, 3.5, "b"); gauntlet(cv, 16.3, 27.5);
    thick(cv, 29.5, 20, 33, 24.5, 3.5, "A"); line(cv, 30, 19, 33.5, 23.5, "B"); gauntlet(cv, 34.2, 25);
  }
  pauldron(cv, 18.5, 18, false); pauldron(cv, 30, 18, true);
  helmetQuarterFront(cv, 24.5);
  thick(cv, 23, 3.6, 19.5, 3.6, 2, "R"); line(cv, 19.5, 3.6, 17.5, 6.5, "R"); line(cv, 23, 3, 19.5, 2.6, "r");
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- vue de dos (N) ---------------------------------------------------------------
function back(f) {
  const cv = canvas();
  const walk = f != null, bob = walk ? bobOf(f) : 0;
  if (walk) {
    const l = footAt(f, 0, STEP.N, 4), r = footAt(f, 2, STEP.N, 4);
    sabaton(cv, 21 + l[0], 44 + l[1], 0); sabaton(cv, 27 + r[0], 44 + r[1], 0);
  } else {
    sabaton(cv, 21, GROUND, 0); sabaton(cv, 27, GROUND, 0);
    swordPlanted(cv, 36, 23);
  }
  // l'ourlet de la cape ondule au rythme des pas
  const w = walk ? (f % 2 ? 1 : -1) : 0;
  const hb = walk ? 2 : 0; // en marche l'ourlet remonte, les pieds se voient
  poly(cv, [[18, 13 + bob], [30, 13 + bob], [35, 44 - hb], [31, 45.2 + w - hb], [24, 44 - hb], [17, 45.2 - w - hb], [13, 44 - hb]], "C");
  line(cv, 21, 17 + bob, 18.5, 43 - hb, "c"); line(cv, 27, 17 + bob, 29.5, 43 - hb, "c"); line(cv, 24, 18 + bob, 24, 43 - hb, "c");
  line(cv, 13, 44 - hb, 17, 45.2 - w - hb, "R"); line(cv, 17, 45.2 - w - hb, 24, 44 - hb, "R"); line(cv, 24, 44 - hb, 31, 45.2 + w - hb, "R"); line(cv, 31, 45.2 + w - hb, 35, 44 - hb, "R");
  OFFY = UP + bob;
  if (walk) {
    // les deux poings dépassent de la cape, de chaque côté
    const sw = f % 2 ? 1 : -1;
    thick(cv, 15, 19.5, 13.8, 25.5 + sw, 3.2, "A"); line(cv, 14, 19.5, 12.8, 25 + sw, "B");
    thick(cv, 33, 19.5, 34.2, 25.5 - sw, 3.2, "b");
    gauntlet(cv, 13.5, 26.5 + sw); gauntlet(cv, 34.5, 26.5 - sw);
  }
  pauldron(cv, 17, 17.5, true); pauldron(cv, 31, 17.5, false);
  if (!walk) gauntlet(cv, 35.2, 25);
  ellipse(cv, 24, 9.3, 4, 5, "A");
  poly(cv, [[25, 4.5], [28.3, 7], [28.3, 12], [25, 14]], "b");
  line(cv, 21, 6, 23, 4, "B"); line(cv, 19.7, 7, 19.7, 11, "B");
  poly(cv, [[21, 14], [27, 14], [27.5, 16.5], [20.5, 16.5]], "b");
  // le plumet retombe sur le côté de la nuque
  thick(cv, 24, 4.8, 21, 9, 3, "R"); thick(cv, 21, 9, 19, 15.5, 2.6, "R"); line(cv, 24.8, 4.8, 21.8, 9, "r"); line(cv, 21.8, 9, 20.2, 14, "r");
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- trois-quarts dos (NE) --------------------------------------------------------
function backQuarter(f) {
  const cv = canvas();
  const walk = f != null, bob = walk ? bobOf(f) : 0;
  if (walk) {
    const b = footAt(f, 2, STEP.NE, 4), fr = footAt(f, 0, STEP.NE, 4);
    sabaton(cv, 20.5 + b[0], 44 + b[1], 1); sabaton(cv, 27 + fr[0], 45 + fr[1], 1);
  } else {
    sabaton(cv, 20.5, GROUND, 1); sabaton(cv, 27.5, GROUND, 1);
    swordPlanted(cv, 36, 22);
  }
  const w = walk ? (f % 2 ? 1 : -1) : 0;
  const hb = walk ? 2 : 0;
  poly(cv, [[17, 13 + bob], [29.5, 13 + bob], [33, 44 - hb], [29, 45.2 + w - hb], [22, 44 - hb], [15, 45.2 - w - hb], [12 - (walk ? 1 : 0), 43.5 - hb]], "C");
  line(cv, 20, 17 + bob, 17, 43 - hb, "c"); line(cv, 26, 17 + bob, 27.5, 43 - hb, "c");
  line(cv, 12, 43.5 - hb, 15, 45.2 - w - hb, "R"); line(cv, 15, 45.2 - w - hb, 22, 44 - hb, "R"); line(cv, 22, 44 - hb, 29, 45.2 + w - hb, "R"); line(cv, 29, 45.2 + w - hb, 33, 44 - hb, "R");
  OFFY = UP + bob;
  pauldron(cv, 17.5, 17.5, false); pauldron(cv, 30, 17.5, true);
  if (walk) {
    // bras le long du corps, qui se balance
    const sw = [1, 0, -1, 0][f];
    thick(cv, 30.5, 20, 32.5, 26 + sw, 3.5, "A"); gauntlet(cv, 32.8, 27 + sw);
    thick(cv, 15, 19.5, 13.4, 25.5 - sw, 3.2, "b"); gauntlet(cv, 13, 26.5 - sw);
  } else {
    thick(cv, 30.5, 20, 34, 24.5, 3.5, "A"); gauntlet(cv, 35.2, 25);
  }
  helmetQuarterBack(cv, 23.5);
  thick(cv, 23, 4.8, 20, 9, 3, "R"); thick(cv, 20, 9, 18.2, 15, 2.6, "R"); line(cv, 23.8, 4.8, 20.8, 9, "r"); line(cv, 20.8, 9, 19.3, 13.5, "r");
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- poses d'attente, de face ---------------------------------------------------
// Comme le chat qui dort ou se gratte : avant de les jouer, elle se tourne
// vers l'écran. `kind` : "alert", "kneel", "sleep1", "sleep2", "salute1",
// "salute2".
const KNEEL_DROP = 6; // elle descend de 6 pixels à genou
function frontIdle(kind) {
  const cv = canvas();
  const kneel = kind === "kneel" || kind.startsWith("sleep");
  const K = kneel ? KNEEL_DROP : 0;
  // cape : à genou, elle s'étale au sol
  if (kneel) {
    poly(cv, [[18, 14 + K], [30, 14 + K], [37, GROUND], [11, GROUND]], "C");
    line(cv, 16, 25 + K, 12, GROUND - 1, "R"); line(cv, 32, 25 + K, 36, GROUND - 1, "R");
    line(cv, 11, GROUND, 37, GROUND, "c");
  } else {
    poly(cv, [[18, 14], [30, 14], [35, GROUND], [13, GROUND]], "C");
    line(cv, 16, 25, 14, GROUND - 1, "R"); line(cv, 32, 25, 34, GROUND - 1, "R");
  }
  // jambes
  if (kneel) {
    // genou droit levé vers nous, genou gauche posé au sol
    armoredLeg(cv, 21.5, 30 + K, 20.5, GROUND, false); sabaton(cv, 20.5, GROUND, 0);
    ellipse(cv, 21, 40.5, 2.6, 2, "B"); px(cv, 20, 39.5, "H"); line(cv, 19, 42.3, 23, 42.3, "K");
    thick(cv, 26.5, 30 + K, 27, GROUND - 1.5, 4, "b");
    ellipse(cv, 27, GROUND - 1.5, 2.1, 1.6, "A"); line(cv, 25.5, GROUND, 28.5, GROUND, "K");
  } else {
    armoredLeg(cv, 21.5, 30, 21, GROUND, false); sabaton(cv, 21, GROUND, 0);
    armoredLeg(cv, 26.5, 30, 27, GROUND, true); sabaton(cv, 27, GROUND, 0);
  }
  if (!kneel && !kind.startsWith("salute")) swordPlanted(cv, 11, 23);
  OFFY = UP + K;
  cuirass(cv, 24, 0);
  pauldron(cv, 17, 18, true); pauldron(cv, 31, 18, false);
  // à genou, l'épée est plantée devant elle, au centre, par-dessus le corps
  if (kneel) swordPlanted(cv, 23.5, 26 + K - 2);
  if (kneel) {
    // les deux mains jointes sur le pommeau
    thick(cv, 17, 20.5, 21.5, 23.5, 3.5, "A"); line(cv, 16.5, 19.5, 21, 22.5, "B");
    thick(cv, 31, 20.5, 26.5, 23.5, 3.5, "b");
    gauntlet(cv, 22.3, 24); gauntlet(cv, 25.7, 24);
  } else if (kind.startsWith("salute")) {
    // salut du chevalier : poignée au menton, lame dressée devant le heaume
    thick(cv, 17.5, 20, 22.5, 23, 3.5, "A"); line(cv, 17, 19, 22, 22, "B");
    thick(cv, 30.5, 20, 25.5, 23, 3.5, "b");
  } else {
    thick(cv, 17, 20, 13.5, 26, 3.5, "A"); line(cv, 16, 19.5, 12.5, 25.5, "B"); gauntlet(cv, 12.5, 26.5);
    thick(cv, 31, 20, 33, 27.5, 3.5, "b"); gauntlet(cv, 33.3, 28.5);
  }
  // heaume : à genou et endormie, la tête s'incline
  if (kind.startsWith("sleep")) OFFY += 1;
  helmet(cv, 24, 0, []);
  const eye = kind === "sleep1" ? "e" : kind === "sleep2" ? null : "E";
  if (eye) {
    px(cv, 22, 10, eye); px(cv, 26, 10, eye);
    if (eye === "E") { px(cv, 22, 11, "e"); px(cv, 26, 11, "e"); }
  }
  if (kind === "alert" || kind === "salute2") {
    // les yeux s'embrasent
    px(cv, 22, 11, "E"); px(cv, 26, 11, "E"); px(cv, 21, 10, "r"); px(cv, 27, 10, "r");
  }
  line(cv, 23, 3.6, 25.5, 3, "R"); line(cv, 25.5, 3, 27.5, 4, "r");
  if (kind.startsWith("salute")) {
    // poignée entre les mains, garde, lame qui monte jusqu'au-dessus du heaume
    line(cv, 23.5, 21, 23.5, 24, "D"); line(cv, 24.5, 21, 24.5, 24, "D");
    px(cv, 23.5, 25, "G"); px(cv, 24.5, 25, "H");
    line(cv, 20.5, 20, 27.5, 20, "G"); line(cv, 20.5, 19.5, 27.5, 19.5, "s");
    for (let y = 19; y >= 1; y--) { px(cv, 23.5, y, "S"); if (y > 3) px(cv, 24.5, y, "s"); }
    px(cv, 23.5, 0, "h");
    // un éclat qui court le long de la lame
    const glint = kind === "salute1" ? 14 : 5;
    px(cv, 23.5, glint, "h"); px(cv, 24.5, glint, "h");
    gauntlet(cv, 23, 22.5); gauntlet(cv, 25, 23);
  }
  OFFY = 0;
  outline(cv);
  return cv;
}

// --- aperçus ------------------------------------------------------------------------
function toBuffer(cv, mirror) {
  const buf = Buffer.alloc(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const c = cv[y][mirror ? CELL - 1 - x : x]; if (!c) continue;
    const i = (y * CELL + x) * 4; const [r, g, b] = PAL[c]; buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  }
  return buf;
}
const RAW = { raw: { width: CELL, height: CELL, channels: 4 } };
// Les 8 directions : vue dessinée, miroir éventuel.
const DIRS = [
  ["E", side, false], ["SE", frontQuarter, false], ["S", front, false], ["SW", frontQuarter, true],
  ["W", side, true], ["NW", backQuarter, true], ["N", back, false], ["NE", backQuarter, false],
];
function stepOf(name, mirror) {
  const key = { E: "E", W: "E", SE: "SE", SW: "SE", S: "S", N: "N", NE: "NE", NW: "NE" }[name];
  const base = STEP[key];
  return mirror ? [-base[0], base[1]] : base;
}

async function staticPreview(out) {
  const views = [side(), frontQuarter(), front(), backQuarter(), back()];
  const scale = 6, pad = 12, tileW = CELL * scale + pad;
  const comps = [];
  for (let i = 0; i < views.length; i++) {
    const buf = toBuffer(views[i], false);
    comps.push({ input: await sharp(buf, RAW).resize(CELL * scale, CELL * scale, { kernel: "nearest" }).png().toBuffer(), left: i * tileW, top: 0 });
    comps.push({ input: await sharp(buf, RAW).png().toBuffer(), left: i * tileW + (CELL * scale - CELL) / 2, top: CELL * scale + pad * 2 });
  }
  await sharp({ create: { width: tileW * views.length, height: CELL * scale + CELL + pad * 3, channels: 4, background: "#ffffff" } })
    .composite(comps).flatten({ background: "#ffffff" }).png().toFile(out);
}

// GIF de marche : 8 cases, chacune avec un sol à points fixes. Le sprite avance
// d'un pas par image : si un pied glissait, on le verrait bouger sur le sol.
async function walkPreview(out, frames, delay) {
  const scale = 3, P = 72;
  const cols = 4, rows = 2, W = P * cols, H = P * rows;
  const sprites = {};
  for (const [name, draw, mirror] of DIRS) sprites[name] = [0, 1, 2, 3].map((f) => toBuffer(draw(f), mirror));
  const mod = (v, m) => ((v % m) + m) % m;
  const images = [];
  for (let k = 0; k < frames; k++) {
    const buf = Buffer.alloc(W * H * 4, 255);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (x % P === 0 || y % P === 0) { buf[i] = 190; buf[i + 1] = 190; buf[i + 2] = 196; }
      else if (x % 6 === 3 && y % 6 === 3) { buf[i] = 212; buf[i + 1] = 212; buf[i + 2] = 220; }
    }
    DIRS.forEach(([name, , mirror], d) => {
      const [sx, sy] = stepOf(name, mirror);
      const ox = (d % cols) * P, oy = Math.floor(d / cols) * P;
      const x = mod(12 + sx * k, P - 24) - 6, y = mod(12 + sy * k, P - 36) - 6;
      const spr = sprites[name][k % 4];
      for (let yy = 0; yy < CELL; yy++) for (let xx = 0; xx < CELL; xx++) {
        const si = (yy * CELL + xx) * 4; if (!spr[si + 3]) continue;
        const X = ox + x + xx, Y = oy + y + yy;
        if (X <= ox || Y <= oy || X >= ox + P || Y >= oy + P) continue;
        const di = (Y * W + X) * 4;
        buf[di] = spr[si]; buf[di + 1] = spr[si + 1]; buf[di + 2] = spr[si + 2];
      }
    });
    images.push(await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).resize(W * scale, H * scale, { kernel: "nearest" }).png().toBuffer());
  }
  await sharp(images, { join: { animated: true } }).gif({ delay: images.map(() => delay), loop: 0 }).toFile(out);
}

// GIF de rotation : elle pivote sur place en passant par chaque direction,
// une image par direction, comme le moteur le fera quand elle change de cap.
async function turnPreview(out, delay) {
  const scale = 5, images = [];
  const order = [...DIRS, DIRS[0]];
  for (const [, draw, mirror] of order) {
    const img = await sharp(toBuffer(draw(), mirror), RAW).resize(CELL * scale, CELL * scale, { kernel: "nearest" }).png().toBuffer();
    images.push(await sharp({ create: { width: CELL * scale, height: CELL * scale, channels: 4, background: "#ffffff" } }).composite([{ input: img }]).png().toBuffer());
  }
  await sharp(images, { join: { animated: true } }).gif({ delay: images.map(() => delay), loop: 0 }).toFile(out);
}

// Planche du site : une ligne par direction (ordre DIRS), colonne 0 le repos,
// colonnes 1 à 4 la marche. Les vecteurs de pas partent avec, pour que le
// moteur avance exactement du pas dessiné.
async function siteSheet(pngOut, jsonOut) {
  const IDLE = ["alert", "kneel", "sleep1", "sleep2", "salute1", "salute2"];
  const cols = Math.max(5, IDLE.length), rows = DIRS.length + 1;
  const comps = [];
  // dernière ligne : les poses d'attente, de face
  for (let c = 0; c < IDLE.length; c++)
    comps.push({ input: await sharp(toBuffer(frontIdle(IDLE[c]), false), RAW).png().toBuffer(), left: c * CELL, top: DIRS.length * CELL });
  for (let r = 0; r < DIRS.length; r++) {
    const [name, draw, mirror] = DIRS[r];
    const frames = [draw(), draw(0), draw(1), draw(2), draw(3)];
    for (let c = 0; c < frames.length; c++)
      comps.push({ input: await sharp(toBuffer(frames[c], mirror), RAW).png().toBuffer(), left: c * CELL, top: r * CELL });
  }
  await sharp({ create: { width: CELL * cols, height: CELL * rows, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps).png().toFile(pngOut);
  const meta = {
    cell: CELL,
    feet: GROUND,
    directions: DIRS.map(([name, , mirror]) => ({ name, step: stepOf(name, mirror) })),
    walkFrames: 4,
    idleRow: DIRS.length,
    idle: Object.fromEntries(IDLE.map((k, i) => [k, i])),
  };
  require("fs").writeFileSync(jsonOut, `${JSON.stringify(meta, null, 2)}\n`);
}

(async () => {
  const out = process.argv[2];
  if (out === "--site") await siteSheet(process.argv[3], process.argv[4]);
  else if (out.endsWith("-tour.gif")) await turnPreview(out, 160);
  else if (out.endsWith(".gif")) await walkPreview(out, 24, 110);
  else await staticPreview(out);
  console.log("ok", out);
})();
