// Outils de dessin pixel art partagés (cellules 64x64, le dragon).
// Coordonnées en pixels, fractions arrondies. Une toile est un tableau de
// lignes de codes couleur (une lettre de la palette, ou null pour le vide).
const sharp = require("sharp");

const CELL = 64;
const GROUND = 62;

function canvas() {
  return Array.from({ length: CELL }, () => Array(CELL).fill(null));
}
function px(cv, x, y, c) {
  x = Math.round(x);
  y = Math.round(y);
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
  const r = (w - 1) / 2;
  for (let oy = -r; oy <= r; oy += 0.5)
    for (let ox = -r; ox <= r; ox += 0.5)
      if (ox * ox + oy * oy <= r * r + 0.3) line(cv, x0 + ox, y0 + oy, x1 + ox, y1 + oy, c);
}
// Trait épais qui suit une suite de points (courbes, queues, cornes).
function path(cv, pts, w, c) {
  for (let i = 0; i + 1 < pts.length; i++) thick(cv, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, c);
}
function poly(cv, pts, c) {
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
// Contour sombre d'un pixel autour de la silhouette, là où il n'y a rien.
function outline(cv, k = "K") {
  const out = canvas();
  for (let y = 0; y < CELL; y++)
    for (let x = 0; x < CELL; x++) {
      if (cv[y][x]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cv[y + dy]?.[x + dx] && cv[y + dy][x + dx] !== k)) out[y][x] = k;
    }
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (out[y][x]) cv[y][x] = k;
}
function toBuffer(cv, pal, mirror) {
  const buf = Buffer.alloc(CELL * CELL * 4);
  for (let y = 0; y < CELL; y++)
    for (let x = 0; x < CELL; x++) {
      const c = cv[y][mirror ? CELL - 1 - x : x];
      if (!c) continue;
      const i = (y * CELL + x) * 4;
      const [r, g, b] = pal[c];
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  return buf;
}
const RAW = { raw: { width: CELL, height: CELL, channels: 4 } };

// Planche de validation : chaque vue agrandie, et sa taille réelle dessous.
async function staticPreview(views, pal, out) {
  const scale = 6, pad = 12, tileW = CELL * scale + pad;
  const comps = [];
  for (let i = 0; i < views.length; i++) {
    const buf = toBuffer(views[i], pal, false);
    comps.push({ input: await sharp(buf, RAW).resize(CELL * scale, CELL * scale, { kernel: "nearest" }).png().toBuffer(), left: i * tileW, top: 0 });
    comps.push({ input: await sharp(buf, RAW).png().toBuffer(), left: i * tileW + (CELL * scale - CELL) / 2, top: CELL * scale + pad * 2 });
  }
  await sharp({ create: { width: tileW * views.length, height: CELL * scale + CELL + pad * 3, channels: 4, background: "#ffffff" } })
    .composite(comps).flatten({ background: "#ffffff" }).png().toFile(out);
}

module.exports = { CELL, GROUND, canvas, px, line, thick, path, poly, ellipse, outline, toBuffer, RAW, staticPreview };
