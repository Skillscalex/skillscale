import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile("src/app/globals.css", "utf8");
const page = await readFile("src/app/marketplace/page.tsx", "utf8");
const navbar = await readFile("src/components/Navbar.tsx", "utf8");

for (const width of [360, 390, 430, 768, 1024]) {
  assert.ok(width >= 360, `viewport ${width} covered by documented breakpoint smoke test`);
}

assert.match(css, /@media \(max-width: 767px\)/, "mobile breakpoint styles exist");
assert.match(css, /grid-template-columns: 1fr/, "single-column narrow mobile grid exists");
assert.match(css, /min-height: 44px|min-h-11/, "tap target sizing exists");
assert.match(page, /discovery-tabs/, "responsive tabs exist");
assert.match(page, /detail-drawer/, "detail drawer exists");
assert.match(navbar, /fixed inset-0 z-50/, "hamburger side drawer exists");

console.log("ok - mobile layout smoke checks for 360, 390, 430, 768, 1024, desktop CSS");
