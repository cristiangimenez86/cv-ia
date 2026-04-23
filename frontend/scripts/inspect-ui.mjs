#!/usr/bin/env node
/**
 * UI inspection helper — drives Chromium via Playwright to verify that a given
 * element has the CSS it's supposed to have and captures screenshots across
 * time to visualise animations.
 *
 * Usage:
 *   node scripts/inspect-ui.mjs [options]
 *
 * Options:
 *   --url         URL to visit (default: http://localhost:3000/en)
 *   --selector    CSS selector of the element to inspect (default: the chat FAB badge)
 *   --frames      Number of screenshots to capture (default: 5)
 *   --interval    Delay between frames, in ms (default: 400)
 *   --reduced     "reduce" | "no-preference" (default: no-preference)
 *   --viewport    WxH (default: 1280x800)
 *   --out         Output directory (default: scripts/out)
 *   --crop        "auto" to crop around the target, "full" for the whole page (default: auto)
 *   --props       Comma-separated computed-style properties to read (default: animationName,animationDuration,animationIterationCount,transform,boxShadow,opacity)
 *
 * Examples:
 *   node scripts/inspect-ui.mjs --selector "button[aria-label^='Open chat'] span"
 *   node scripts/inspect-ui.mjs --url http://localhost:3000/es --selector ".card-tile" --crop full
 *   node scripts/inspect-ui.mjs --reduced reduce   # simulate OS reduce-motion
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key.slice(2)] = next;
      i++;
    } else {
      args[key.slice(2)] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const url = args.url ?? "http://localhost:3000/en";
const selector =
  args.selector ?? 'button[aria-label*="Open chat" i] span:has-text("AI")';
const frames = Number(args.frames ?? 5);
const interval = Number(args.interval ?? 400);
const reducedMotion = args.reduced === "reduce" ? "reduce" : "no-preference";
const [vw, vh] = (args.viewport ?? "1280x800").split("x").map(Number);
const outDir = path.resolve(args.out ?? "scripts/out");
const cropMode = args.crop ?? "auto";
const props = (
  args.props ??
  "animationName,animationDuration,animationIterationCount,transform,boxShadow,opacity"
).split(",");

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: vw, height: vh },
  reducedMotion,
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});

console.log(`→ navigating ${url} (reducedMotion=${reducedMotion})`);
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

const target = page.locator(selector).first();
await target.waitFor({ state: "visible", timeout: 15000 });
const box = await target.boundingBox();
console.log(`→ target "${selector}" box:`, box);

const computed = await target.evaluate((el, keys) => {
  const cs = getComputedStyle(el);
  const out = { className: el.className };
  for (const k of keys) out[k] = cs[k];
  return out;
}, props);
console.log("→ computed style:", computed);

let clip;
if (cropMode === "auto" && box) {
  clip = {
    x: Math.max(0, box.x - 40),
    y: Math.max(0, box.y - 40),
    width: Math.min(vw - Math.max(0, box.x - 40), box.width + 80),
    height: Math.min(vh - Math.max(0, box.y - 40), box.height + 80),
  };
}

for (let i = 0; i < frames; i++) {
  const file = path.join(outDir, `frame-${String(i).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, clip });
  const sample = await target.evaluate((el, keys) => {
    const cs = getComputedStyle(el);
    const out = {};
    for (const k of keys) out[k] = cs[k];
    return out;
  }, props);
  console.log(`  frame ${i}:`, sample);
  if (i < frames - 1) await page.waitForTimeout(interval);
}

await browser.close();
console.log(`\n✓ ${frames} screenshots saved to: ${outDir}`);
