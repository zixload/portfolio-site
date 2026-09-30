// Prepare the approved image-model sheets as aligned, transparent game frames.
// node art/pixel/prepare-dragon-sheets.cjs [source-directory]
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "../..");
const SOURCES = process.argv[2] || path.join(process.env.USERPROFILE, "Downloads");
const CELL = 64;
const COLS = 4;
const PALETTE = [
  [38, 51, 69], [64, 80, 101], [82, 106, 133], [120, 148, 180],
  [168, 190, 211], [230, 227, 214], [248, 238, 195],
  [217, 164, 78], [229, 139, 64], [243, 213, 129],
];
const DIRECTIONS = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"];
const EYE_OFFSET = [[12, -8], [7, -9], [0, -9], [-7, -9], [-12, -8], [-9, -11], [0, -17], [9, -11]];

async function readSheet(name, count, rows) {
  const source = path.join(SOURCES, name);
  const archive = path.join(ROOT, "art/pixel/dragon-sources", name);
  await fs.mkdir(path.dirname(archive), { recursive: true });
  if (path.resolve(source) !== archive) await fs.copyFile(source, archive);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  for (let p = 0; p < labels.length; p++) {
    const i = p * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    if (!data[i + 3] || (r - g > 65 && b - g > 65 && r > 155 && b > 155)) {
      labels[p] = -1;
      data[i + 3] = 0;
    }
  }
  for (let start = 0; start < labels.length; start++) {
    if (labels[start]) continue;
    const id = components.length + 1;
    let head = 0, tail = 1, dark = 0, minX = width, maxX = 0, minY = height, maxY = 0;
    queue[0] = start;
    labels[start] = id;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width), i = p * 4;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      if (data[i] < 120 && data[i + 1] < 150 && data[i + 2] < 180) dark++;
      const neighbors = [];
      if (x) neighbors.push(p - 1);
      if (x + 1 < width) neighbors.push(p + 1);
      if (y) neighbors.push(p - width);
      if (y + 1 < height) neighbors.push(p + width);
      for (const next of neighbors) if (!labels[next]) { labels[next] = id; queue[tail++] = next; }
    }
    components.push({ id, area: tail, dark, minX, maxX, minY, maxY });
  }
  const bodies = components.filter(c => c.area > 3500 && c.dark > 1000);
  if (bodies.length !== count) throw new Error(`${name}: expected ${count} dragons, found ${bodies.length}`);
  bodies.sort((a, b) => rows > 1 && Math.floor((a.minY + a.maxY) / 2 / (height / rows)) !== Math.floor((b.minY + b.maxY) / 2 / (height / rows))
    ? a.minY - b.minY : a.minX - b.minX);
  const groups = bodies.map(body => ({ body, parts: [body] }));
  for (const part of components) {
    if (bodies.includes(part) || part.area < 8) continue;
    // The floating Zs may sit closer to the next dragon's tail bounding box.
    // Associate those little slate-blue letters with the sleeping heads.
    if (name.includes("poses-zz") && part.area < 1500 && part.dark > part.area * 0.7) {
      const sleeping = groups.slice(2, 4).sort((a, b) =>
        Math.abs((part.minX + part.maxX) / 2 - a.body.maxX) - Math.abs((part.minX + part.maxX) / 2 - b.body.maxX));
      sleeping[0].parts.push(part);
      continue;
    }
    const nearest = groups.map(group => {
      const b = group.body;
      const dx = Math.max(b.minX - part.maxX, part.minX - b.maxX, 0);
      const dy = Math.max(b.minY - part.maxY, part.minY - b.maxY, 0);
      return { group, distance: Math.hypot(dx, dy) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (nearest.distance < 100) nearest.group.parts.push(part);
  }
  const frames = groups.map(({ body, parts }) => {
    const minX = Math.min(...parts.map(p => p.minX)), minY = Math.min(...parts.map(p => p.minY));
    const maxX = Math.max(...parts.map(p => p.maxX)), maxY = Math.max(...parts.map(p => p.maxY));
    const w = maxX - minX + 1, h = maxY - minY + 1;
    const pixels = Buffer.alloc(w * h * 4), ids = new Set(parts.map(p => p.id));
    let eyeX = 0, eyeY = 0, eyeCount = 0;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const p = y * width + x, i = p * 4;
      if (!ids.has(labels[p])) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (labels[p] === body.id && r > 150 && g > 85 && b < 125 && r - b > 65) { eyeX += x; eyeY += y; eyeCount++; }
      let best = PALETTE[0], distance = Infinity;
      for (const color of PALETTE) {
        const d = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2;
        if (d < distance) { distance = d; best = color; }
      }
      const j = ((y - minY) * w + x - minX) * 4;
      pixels[j] = best[0]; pixels[j + 1] = best[1]; pixels[j + 2] = best[2]; pixels[j + 3] = 255;
    }
    let horns = null;
    if (!eyeCount) {
      const cream = [];
      const middle = (body.minX + body.maxX) / 2;
      for (let y = body.minY; y < body.minY + (body.maxY - body.minY) * 0.4; y++) {
        for (let x = Math.round(middle - (body.maxX - body.minX) * 0.22); x < middle + (body.maxX - body.minX) * 0.22; x++) {
          const i = (y * width + x) * 4;
          if (labels[y * width + x] === body.id && data[i] > 175 && data[i + 1] > 165 && data[i + 1] - data[i + 2] > 8) cream.push([x, y]);
        }
      }
      if (cream.length) {
        const firstY = Math.min(...cream.map(p => p[1]));
        const tips = cream.filter(p => p[1] <= firstY + 20);
        horns = [tips.reduce((s, p) => s + p[0], 0) / tips.length, tips.reduce((s, p) => s + p[1], 0) / tips.length];
      }
    }
    return { pixels, width: w, height: h, minX, minY, body, eye: eyeCount ? [eyeX / eyeCount, eyeY / eyeCount] : null, horns };
  });
  console.log(`${name}: ${count} silhouettes extracted, magenta removed`);
  return frames;
}

async function normalize(frames, direction, resting = false) {
  let scale = resting ? 0.125 : 0.13;
  const positions = () => frames.map(frame => {
    let x, y;
    if (resting) {
      x = (frame.body.minX + frame.body.maxX) / 2;
      y = frame.body.maxY;
    } else {
      const marker = frame.eye || frame.horns;
      if (!marker) throw new Error(`Missing head landmark for ${DIRECTIONS[direction]}`);
      x = marker[0] - EYE_OFFSET[direction][0] / scale;
      y = marker[1] - EYE_OFFSET[direction][1] / scale;
    }
    return {
      frame, left: (resting ? 28 : 32) + (frame.minX - x) * scale,
      top: (resting ? 52 : 36) + (frame.minY - y) * scale,
      width: Math.max(1, Math.round(frame.width * scale)), height: Math.max(1, Math.round(frame.height * scale)),
    };
  });
  let parts = positions();
  const extents = () => ({
    left: Math.min(...parts.map(p => p.left)), top: Math.min(...parts.map(p => p.top)),
    right: Math.max(...parts.map(p => p.left + p.width)), bottom: Math.max(...parts.map(p => p.top + p.height)),
  });
  let bounds = extents();
  if (bounds.right - bounds.left > CELL - 2 || bounds.bottom - bounds.top > CELL - 2) {
    scale *= Math.min((CELL - 2) / (bounds.right - bounds.left), (CELL - 2) / (bounds.bottom - bounds.top));
    parts = positions(); bounds = extents();
  }
  const shiftX = bounds.left < 1 ? 1 - bounds.left : bounds.right > CELL - 1 ? CELL - 1 - bounds.right : 0;
  const shiftY = bounds.top < 1 ? 1 - bounds.top : bounds.bottom > CELL - 1 ? CELL - 1 - bounds.bottom : 0;
  return Promise.all(parts.map(async p => {
    const resized = await sharp(p.frame.pixels, { raw: { width: p.frame.width, height: p.frame.height, channels: 4 } })
      .resize(p.width, p.height, { kernel: "nearest" }).png().toBuffer();
    return sharp({ create: { width: CELL, height: CELL, channels: 4, background: "#00000000" } })
      .composite([{ input: resized, left: Math.round(p.left + shiftX), top: Math.round(p.top + shiftY) }]).png().toBuffer();
  }));
}

async function main() {
  const frames = [];
  for (const [file, first] of [
    ["dragon-pixel-vol-est-sud-est.png", 0], ["dragon-pixel-vol-sud-sud-ouest.png", 2],
    ["dragon-pixel-vol-ouest-nord-ouest.png", 4], ["dragon-pixel-vol-nord-nord-est.png", 6],
  ]) {
    const sheet = await readSheet(file, 8, 2);
    frames.push(...await normalize(sheet.slice(0, 4), first), ...await normalize(sheet.slice(4, 8), first + 1));
  }
  const turns = await readSheet("dragon-pixel-rotation-8-directions.png", 8, 2);
  for (let direction = 0; direction < 8; direction++) frames.push(...await normalize([turns[direction]], direction));
  const poses = await readSheet("dragon-pixel-poses-zz.png", 6, 1);
  frames.push(...await normalize(poses, 0, true));
  const rows = Math.ceil(frames.length / COLS);
  const compositions = frames.map((input, index) => ({ input, left: index % COLS * CELL, top: Math.floor(index / COLS) * CELL }));
  const output = path.join(ROOT, "public/media/dragon");
  await fs.mkdir(output, { recursive: true });
  await sharp({ create: { width: CELL * COLS, height: CELL * rows, channels: 4, background: "#00000000" } })
    .composite(compositions).png().toFile(path.join(output, "sprites.png"));
  const manifest = {
    src: "/media/dragon/sprites.png", cell: CELL, columns: COLS,
    directions: DIRECTIONS,
    flight: DIRECTIONS.map((_, d) => Array.from({ length: 4 }, (_, f) => d * 4 + f)),
    turn: DIRECTIONS.map((_, d) => 32 + d),
    poses: { alert: 40, tired: 41, sleep: [42, 43], fire: [44, 45] },
  };
  await fs.writeFile(path.join(ROOT, "src/lib/dragon-sprites.json"), JSON.stringify(manifest, null, 2) + "\n");
  await sharp(path.join(output, "sprites.png")).flatten({ background: "#ffffff" })
    .resize(CELL * COLS * 3, CELL * rows * 3, { kernel: "nearest" }).png().toFile(path.join(output, "preview.png"));
  console.log(`Prepared ${frames.length} aligned 64x64 frames; atlas and manifest saved.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
