// Dragon volant en pixel art 48x48 (affiché en 2x sur le site).
//   NODE_PATH=node_modules node art/pixel/dragon.js <apercu.png | apercu.gif>
// Vu de profil, tourné vers la droite (la gauche est le miroir). Pour monter
// ou piquer, tout le dessin est incliné (tangage) avant d'être converti en
// pixels : les pixels restent nets, sans rotation d'image.
const sharp = require("sharp");
const { CELL, canvas, px, line, poly, outline, toBuffer, RAW } = require("./pixel");

const PAL = {
  K: [8, 8, 12], // contour
  F: [18, 17, 24], // corps, côté lointain
  A: [34, 32, 44], // écailles
  B: [54, 50, 68], // écailles, lumière
  H: [96, 88, 120], // reflet
  y: [78, 58, 66], // plaques du ventre
  M: [96, 18, 32], // membrane des ailes
  m: [150, 30, 46], // membrane, lumière
  f: [56, 12, 22], // aile lointaine
  C: [196, 190, 170], // cornes, griffes
  E: [255, 150, 40], // yeux de braise
  e: [200, 60, 30], // halo des yeux
};

// --- géométrie : tout passe par la transformation du tangage ----------------
const PIVOT = [24, 26];
let T = (p) => p;
function setPitch(deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  T = ([x, y]) => [PIVOT[0] + (x - PIVOT[0]) * c - (y - PIVOT[1]) * s, PIVOT[1] + (x - PIVOT[0]) * s + (y - PIVOT[1]) * c];
}
const P = (pts) => pts.map(T);
function shape(cv, pts, c) { poly(cv, P(pts), c); }
function seg(cv, a, b, c) { const [p, q] = P([a, b]); line(cv, p[0], p[1], q[0], q[1], c); }
function blob(cv, cx, cy, rx, ry, c) {
  const pts = [];
  for (let i = 0; i < 24; i++) { const t = (i / 24) * 2 * Math.PI; pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
  shape(cv, pts, c);
}
// Membre ou queue : un ruban dont la largeur varie le long des points.
function ribbon(cv, pts, w0, w1, c) {
  const left = [], right = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const dx = q[0] - o[0], dy = q[1] - o[1], n = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    left.push([p[0] - (dy / n) * w, p[1] + (dx / n) * w]);
    right.push([p[0] + (dy / n) * w, p[1] - (dx / n) * w]);
  });
  shape(cv, [...left, ...right.reverse()], c);
}
const rad = (d) => (d * Math.PI) / 180;
const polar = ([x, y], len, deg) => [x + len * Math.cos(rad(deg)), y - len * Math.sin(rad(deg))];

// Aile : bras, avant-bras, trois doigts et la membrane tendue entre eux.
// `phi` : angle du bras (95 = levée, 235 = abaissée), en degrés, y vers le haut.
function wing(cv, shoulder, phi, far) {
  const elbow = polar(shoulder, 6, phi);
  const wrist = polar(elbow, 5, phi - 25);
  const tips = [[9, phi - 10], [9, phi + 30], [7, phi + 68]].map(([l, a]) => polar(wrist, l, a));
  const attach = [16, 26];
  const inward = (a, b) => [(a[0] + b[0]) / 2 * 0.72 + wrist[0] * 0.28, (a[1] + b[1]) / 2 * 0.72 + wrist[1] * 0.28];
  const membrane = [shoulder, elbow, wrist, tips[0], inward(tips[0], tips[1]), tips[1], inward(tips[1], tips[2]), tips[2], attach];
  shape(cv, membrane, far ? "f" : "M");
  if (!far) {
    // lumière le long du bord d'attaque
    shape(cv, [elbow, wrist, tips[0], inward(tips[0], tips[1])], "m");
  }
  const bone = far ? "F" : "B";
  seg(cv, shoulder, elbow, bone); seg(cv, elbow, wrist, bone);
  tips.forEach((t) => seg(cv, wrist, t, bone));
  if (!far) seg(cv, elbow, wrist, "H");
}

// Battement d'ailes en 4 images : levée, descente, abaissée, remontée.
const FLAP = [100, 165, 235, 160];

function dragon(frame, pitch = 0, opts = {}) {
  const cv = canvas();
  setPitch(pitch);
  const phi = FLAP[frame % 4];
  // le corps monte un peu quand les ailes poussent vers le bas
  const lift = frame % 4 === 2 ? -1 : frame % 4 === 0 ? 1 : 0;
  const L = (pts) => pts.map(([x, y]) => [x, y + lift]);

  // aile lointaine, derrière le corps
  wing(cv, [27, 22 + lift], phi + 10, true);
  // queue effilée, pointe en fer de lance
  ribbon(cv, L([[16, 27], [11, 28], [7, 30], [3, 30], [1, 28]]), 4.5, 1.2, "A");
  shape(cv, L([[1, 26], [-1.5, 28.5], [1, 31], [3, 28.5]]), "A");
  // patte arrière repliée
  ribbon(cv, L([[18, 29], [19, 32], [17, 34]]), 2.6, 1.6, "F");
  seg(cv, [17, 34 + lift], [15.5, 35 + lift], "C");
  // corps et poitrail
  blob(cv, 21, 27 + lift, 7.5, 3.8, "A");
  blob(cv, 27, 26 + lift, 4, 3.8, "A");
  shape(cv, L([[15, 29], [29, 28.5], [28, 30], [16, 30.5]]), "y");
  seg(cv, [16, 24 + lift], [27, 23 + lift], "B");
  // patte avant repliée
  ribbon(cv, L([[27, 28.5], [29, 31], [31, 31.5]]), 2.2, 1.4, "A");
  seg(cv, [31, 31.5 + lift], [32, 32 + lift], "C");
  // cou et tête, museau vers la droite
  ribbon(cv, L([[28, 25], [32, 22], [35, 19.5], [37, 18.5]]), 4.2, 3.2, "A");
  seg(cv, [30, 22.5 + lift], [35, 18 + lift], "B");
  shape(cv, L([[35.5, 17], [40, 16], [44, 17.5], [46.5, 19.5], [45, 21], [40, 21.5], [36, 20.5]]), "A");
  seg(cv, [37, 16.8 + lift], [43, 17.3 + lift], "B");
  // cornes vers l'arrière
  ribbon(cv, L([[38, 16.5], [35, 13.5], [32.5, 12.5]]), 1.8, 1, "C");
  ribbon(cv, L([[36.5, 17], [33.5, 15.5]]), 1.4, 1, "C");
  // œil de braise, gueule
  const [eye] = P([[40.5, 18.3 + lift]]);
  px(cv, eye[0], eye[1], "E"); px(cv, eye[0] + 1, eye[1], "E");
  seg(cv, [40, 20.6 + lift], [45.5, 20 + lift], "K");
  // arête dorsale
  [[18, 23.2], [21, 22.8], [24, 22.7], [29, 22.4], [32, 20]].forEach(([x, y]) => seg(cv, [x, y + lift], [x - 1, y - 1.3 + lift], "B"));
  // aile proche, par-dessus le corps
  wing(cv, [25, 23 + lift], phi, false);
  if (opts.fire) {
    const tip = [47, 20 + lift];
    shape(cv, [tip, [tip[0] + 6, tip[1] - 3], [tip[0] + 8, tip[1]], [tip[0] + 6, tip[1] + 3]], "E");
  }
  outline(cv);
  return cv;
}

module.exports = { PAL, dragon, FLAP };

// --- aperçus ---------------------------------------------------------------------
async function sheetPreview(out) {
  const pitches = [0, -35, 35, -65, 65];
  const s = 4, comps = [];
  for (let r = 0; r < pitches.length; r++)
    for (let f = 0; f < 4; f++) {
      const img = await sharp(toBuffer(dragon(f, pitches[r]), PAL, false), RAW).resize(CELL * s, CELL * s, { kernel: "nearest" }).png().toBuffer();
      comps.push({ input: img, left: f * (CELL * s + 8), top: r * (CELL * s + 8) });
    }
  await sharp({ create: { width: 4 * (CELL * s + 8), height: pitches.length * (CELL * s + 8), channels: 4, background: "#ffffff" } })
    .composite(comps).flatten({ background: "#fff" }).png().toFile(out);
}
async function flapGif(out) {
  const s = 4, images = [];
  for (let k = 0; k < 8; k++) {
    const img = await sharp(toBuffer(dragon(k % 4, 0), PAL, false), RAW).resize(CELL * s, CELL * s, { kernel: "nearest" }).png().toBuffer();
    images.push(await sharp({ create: { width: CELL * s, height: CELL * s, channels: 4, background: "#ffffff" } }).composite([{ input: img }]).png().toBuffer());
  }
  await sharp(images, { join: { animated: true } }).gif({ delay: images.map(() => 110), loop: 0 }).toFile(out);
}
if (require.main === module) {
  const out = process.argv[2];
  (out.endsWith(".gif") ? flapGif(out) : sheetPreview(out)).then(() => console.log("ok", out));
}
