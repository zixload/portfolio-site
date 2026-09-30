// End-to-end check against a browser started by agent-browser.
// node art/pixel/check-dragon.cjs <cdp-url> <playwright-module-path>
const assert = require("node:assert/strict");
const path = require("node:path");
const sharp = require("sharp");
const { chromium } = require(process.argv[3] || "playwright");
const sprites = require("../../src/lib/dragon-sprites.json");
const ROOT = path.resolve(__dirname, "../..");

async function main() {
  const { data, info } = await sharp(path.join(ROOT, "public/media/dragon/sprites.png")).raw().toBuffer({ resolveWithObject: true });
  let magenta = 0, partialAlpha = 0;
  const colors = new Set();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 0 && data[i + 3] !== 255) partialAlpha++;
    if (!data[i + 3]) continue;
    if (data[i] > 150 && data[i + 2] > 150 && data[i + 1] < 120) magenta++;
    colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  assert.equal(magenta, 0, "No magenta remains in the sprites");
  assert.equal(partialAlpha, 0, "Pixel edges have binary transparency");
  assert.ok(colors.size <= 10, "Palette stays limited");
  for (let frame = 0; frame < 46; frame++) {
    let opaque = 0;
    for (let y = 0; y < sprites.cell; y++) for (let x = 0; x < sprites.cell; x++) {
      const px = frame % sprites.columns * sprites.cell + x;
      const py = Math.floor(frame / sprites.columns) * sprites.cell + y;
      if (data[(py * info.width + px) * 4 + 3]) opaque++;
    }
    assert.ok(opaque > 100, `Frame ${frame} contains a visible dragon`);
  }
  console.log("Atlas: 46 visible frames, transparent background, 10-color palette.");

  const browser = await chromium.connectOverCDP(process.argv[2]);
  const context = await browser.newContext({ viewport: { width: 1916, height: 914 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.clock.install();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await page.clock.runFor(1800);
    const pet = page.locator(".dragon-companion");
    const read = () => pet.evaluate(el => ({ ...el.dataset, transform: el.style.transform, opacity: el.style.opacity }));
    assert.equal((await read()).state, "sleeping");
    assert.equal((await read()).opacity, "1");
    let homePosition = (await read()).transform;
    const initialHomeBox = await pet.boundingBox();
    await page.screenshot({ path: path.join(__dirname, "dragon-idle-desktop.png"), animations: "disabled" });
    await page.evaluate(() => {
      const pet = document.querySelector(".dragon-companion");
      const trace = { modes: new Set(), directions: new Set(), frames: new Set() };
      window.__dragonTrace = trace;
      const record = () => {
        trace.modes.add(pet.dataset.state);
        trace.frames.add(Number(pet.dataset.frame));
        if (pet.dataset.state === "flying") trace.directions.add(pet.dataset.direction);
      };
      record();
      new MutationObserver(record).observe(pet, { attributes: true });
    });
    const trace = () => page.evaluate(() => ({
      modes: [...window.__dragonTrace.modes], directions: [...window.__dragonTrace.directions], frames: [...window.__dragonTrace.frames],
    }));
    await page.clock.runFor(3000);
    assert.equal((await read()).state, "sleeping", "No automatic takeoff");
    assert.equal((await read()).transform, homePosition);
    assert.ok((await trace()).frames.includes(42) && (await trace()).frames.includes(43), "Both sleeping/Zz poses animate");
    console.log("Default: sleeps in place with Zz; no spontaneous takeoff.");

    await page.getByRole("button", { name: "Lecture", exact: true }).click();
    await page.clock.runFor(100);
    assert.equal((await read()).state, "drowsy", "Starting music briefly opens an eye");
    assert.equal((await read()).transform, homePosition, "Music reaction stays curled up in place");
    const eye = await pet.locator("canvas").evaluate(canvas => [...canvas.getContext("2d").getImageData(40, 42, 1, 1).data]);
    assert.deepEqual(eye, [255, 138, 31, 255], "Sleepy eye is visibly amber");
    await page.screenshot({ path: path.join(__dirname, "dragon-sleepy-eye-desktop.png"), animations: "disabled" });
    await page.clock.runFor(1100);
    assert.equal((await read()).state, "sleeping", "Music reaction settles back to sleep without flames");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.clock.runFor(100);
    assert.equal((await read()).state, "sleeping", "Pausing does not wake it");
    await page.getByRole("button", { name: "Morceau suivant", exact: true }).click();
    await page.clock.runFor(100);
    assert.equal((await read()).state, "drowsy", "Changing tracks briefly opens an eye even while paused");
    await page.clock.runFor(1100);
    assert.equal((await read()).state, "sleeping");
    const musicHomeBox = await pet.boundingBox();
    assert.ok(Math.abs(musicHomeBox.y - initialHomeBox.y) <= 1 && Math.abs(musicHomeBox.x - initialHomeBox.x) < 8,
      "Track-title layout changes keep the dragon perched on the player");
    homePosition = (await read()).transform;
    console.log("Music: play/change opens one eye while curled up, then sleeps; pause leaves it asleep.");

    await pet.click();
    await page.clock.runFor(720);
    assert.equal((await read()).state, "fire", "One click wakes the dragon and triggers flames");
    await page.screenshot({ path: path.join(__dirname, "dragon-fire-desktop.png"), animations: "disabled" });
    await page.clock.runFor(2400);
    assert.equal((await read()).state, "sleeping", "One click returns to sleep");
    assert.ok(!(await trace()).modes.includes("flying"), "One click never starts a chase");
    console.log("Single click: wake → flames → tired → sleep, without flight.");

    for (let i = 0; i < 3; i++) { await pet.click(); await page.clock.runFor(100); }
    assert.equal((await read()).state, "flying", "Three quick clicks start chasing the pointer");
    assert.equal(await page.locator(".dragon-effects").count(), 0, "Removed flame and dust overlay stays absent");
    const chaseStarted = await page.evaluate(() => performance.now());
    const center = async () => {
      const box = await pet.boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height * 36 / 64 };
    };
    const beforeChase = await center();
    await page.mouse.move(1100, 450);
    await page.clock.runFor(1500);
    const chasingRight = await center();
    assert.ok(chasingRight.x > beforeChase.x + 120, "Chases the pointer steadily at the increased speed");
    assert.ok(Math.hypot(chasingRight.x - beforeChase.x, chasingRight.y - beforeChase.y) <= 220, "Flight remains bounded rather than snapping to the pointer");
    await page.mouse.move(0, 0);
    await page.clock.runFor(1500);
    const chasingLeft = await center();
    assert.ok(chasingLeft.x < chasingRight.x - 35, "Turns before following the pointer in its new direction");
    await page.clock.runFor(4750 - (await page.evaluate(() => performance.now())) + chaseStarted);
    assert.equal((await read()).state, "flying", "Still chasing just before five seconds");
    const edgeBox = await pet.boundingBox();
    assert.ok(edgeBox.x >= 0 && edgeBox.y >= 0, "Dragon stays visible when the cursor touches the viewport edge");
    await page.screenshot({ path: path.join(__dirname, "dragon-flight-desktop.png"), animations: "disabled" });
    await page.clock.runFor(300);
    assert.equal((await read()).state, "landing", "Stops chasing after five seconds");
    await page.mouse.move(1800, 850);
    const beforeReturn = await center();
    await page.clock.runFor(1500);
    const returning = await center();
    assert.ok(returning.x > beforeReturn.x && returning.x < 600, "Returns to its perch instead of chasing a new pointer position");
    await page.clock.runFor(9000);
    assert.equal((await read()).state, "sleeping", "Chase ends in sleep");
    assert.notEqual((await read()).transform, homePosition, "Returns to a new randomized spot");
    const landed = await pet.boundingBox();
    const player = await page.locator(".vinyl-dock .vinyl").boundingBox();
    assert.ok(Math.abs(landed.y - initialHomeBox.y) <= 1, "Random landing keeps the same resting baseline");
    assert.ok(landed.x >= player.x && landed.x + landed.width <= player.x + player.width, "Random landing stays on the player");
    homePosition = (await read()).transform;
    const flight = await trace();
    assert.ok(flight.directions.length >= 3, "Faces different headings during the pursuit");
    assert.ok(flight.frames.some(f => f >= 32 && f < 40), "Direction changes use turning frames");
    await page.clock.runFor(3000);
    assert.equal((await read()).state, "sleeping", "Does not restart the chase automatically");
    console.log("Repeated clicks: follows moving cursor, turns, stops after 5 seconds, returns home and sleeps.");

    for (let i = 0; i < 3; i++) { await pet.click(); await page.clock.runFor(100); }
    const mouth = await center();
    await page.mouse.move(mouth.x + 60, mouth.y);
    await page.clock.runFor(200);
    assert.equal((await read()).state, "flying", "Keeps flying near the cursor without added flames");
    assert.ok(Number((await read()).frame) < 40, "Uses flight/turn poses when close to the cursor");
    await page.clock.runFor(8000);
    assert.equal((await read()).state, "sleeping");
    assert.notEqual((await read()).transform, homePosition, "Next pursuit chooses another landing spot");
    console.log("Landing: picks another spot for the next return; no flame or dust effects during flight.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.runFor(1000);
    const box = await pet.boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844, "Mobile pet stays in viewport");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "No mobile horizontal overflow");
    await page.screenshot({ path: path.join(__dirname, "dragon-idle-mobile.png"), animations: "disabled" });
    await pet.focus();
    await page.keyboard.press("Enter");
    await page.clock.runFor(750);
    assert.equal((await read()).state, "fire", "Keyboard activates the same single-click action");
    await page.clock.runFor(2500);
    assert.equal((await read()).state, "sleeping");
    console.log("Mobile: visible, no overflow; keyboard wake/flames/sleep works.");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.runFor(100);
    const staticFrame = (await read()).frame;
    await page.clock.runFor(2500);
    assert.equal((await read()).frame, staticFrame, "Reduced motion freezes breathing/Zz animation");
    for (let i = 0; i < 3; i++) { await pet.click(); await page.clock.runFor(100); }
    await page.clock.runFor(2500);
    assert.equal((await read()).state, "sleeping", "Reduced motion avoids flight and still settles back to sleep");
    console.log("Reduced motion: static sleep, no flying, click reaction still settles.");

    await page.evaluate(() => { window.__dragonNode = document.querySelector(".dragon-companion"); });
    await page.getByRole("link", { name: "Recherche", exact: true }).click();
    await page.waitForURL("**/recherche");
    assert.equal(await page.evaluate(() => window.__dragonNode === document.querySelector(".dragon-companion")), true, "Same companion persists across navigation");
    assert.equal((await read()).state, "sleeping");
    assert.deepEqual(errors, [], "No browser exceptions");
    console.log("Navigation: same sleeping companion persists; no browser exceptions.");
  } finally {
    await context.close();
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
