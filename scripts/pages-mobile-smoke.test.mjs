import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("docs/index.html", "utf8");
const css = await readFile("docs/styles.css", "utf8");

assert.match(html, /const \[mobileOpen, setMobileOpen\] = useState\(false\)/, "mobile nav state exists");
assert.match(html, /className=\"mobile-menu-button lg\"/, "mobile menu button exists");
assert.match(html, /aria-expanded=\{mobileOpen\}/, "menu exposes aria-expanded");
assert.match(html, /aria-controls=\"mobile-navigation\"/, "menu controls mobile-navigation panel");
assert.match(html, /id=\"mobile-navigation\"/, "mobile navigation panel exists");

for (const label of ["Skills", "Market", "Loops", "Community", "MCPs", "Vault", "Hubs", "Studio", "Safety"]) {
  assert.ok(html.includes(`label: '${label}'`) || html.includes(`>${label}<`) || html.includes(`${label}', icon`), `mobile nav includes ${label}`);
}

for (const selector of [".mobile-nav-actions", ".mobile-menu-button", ".mobile-nav-panel", ".mobile-nav-link", ".mobile-nav-cta"]) {
  assert.ok(css.includes(selector), `${selector} styles exist`);
}

assert.match(css, /@media \(max-width: 760px\)/, "mobile breakpoint exists");
assert.match(css, /min-height:\s*44px/, "touch targets meet 44px minimum");
assert.match(css, /100svh/, "small viewport hero sizing uses svh");
assert.match(css, /display:\s*none !important/, "desktop nav is hidden on mobile");
assert.match(css, /grid-template-columns:\s*1fr !important/, "mobile stats collapse to one column");

console.log("ok - GitHub Pages home has mobile nav, touch targets, and responsive hero contracts");
