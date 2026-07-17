#!/usr/bin/env node
const changed = (process.env.CHANGED_FILES || "")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const productPrefixes = ["apps/", "services/", "packages/", "src/", "supabase/", "infra/"];
const specPrefixes = ["docs/strategy/", "docs/product/", "docs/research/", "docs/architecture/", "docs/adr/", "docs/specs/", "docs/tickets/", "docs/ux/", "docs/qa/"];
const automationPrefixes = ["docs/agentic-delivery/", "scripts/", ".github/"];

const productChanges = changed.filter((file) => productPrefixes.some((prefix) => file.startsWith(prefix)));
if (productChanges.length === 0) {
  console.log("ok - no product/service code changes requiring spec gate");
  process.exit(0);
}

const hasSpecArtifact = changed.some((file) => specPrefixes.some((prefix) => file.startsWith(prefix)));
const onlyAutomation = productChanges.length === 0 && changed.every((file) => automationPrefixes.some((prefix) => file.startsWith(prefix)));

if (!hasSpecArtifact && !onlyAutomation) {
  console.error("Spec-first gate failed: product/service code changed without docs/specs, docs/tickets, docs/architecture, docs/adr, docs/product, or docs/ux artifact updates.");
  console.error("Product changes:\n" + productChanges.map((file) => `- ${file}`).join("\n"));
  process.exit(1);
}

console.log(`ok - spec-first gate passed (${productChanges.length} product files, spec artifact present: ${hasSpecArtifact})`);
