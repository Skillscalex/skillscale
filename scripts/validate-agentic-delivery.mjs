#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const required = [
  "docs/agentic-delivery/00-overview.md",
  "docs/agentic-delivery/01-ceo-ai.md",
  "docs/agentic-delivery/02-pm-ai.md",
  "docs/agentic-delivery/03-research-ai.md",
  "docs/agentic-delivery/04-architect-ai.md",
  "docs/agentic-delivery/05-spec-ai.md",
  "docs/agentic-delivery/06-ux-ai.md",
  "docs/agentic-delivery/07-engineering-ai.md",
  "docs/agentic-delivery/08-qa-ai.md",
  "docs/agentic-delivery/09-deploy-ai.md",
  "docs/agentic-delivery/handoff-template.md",
  "docs/agentic-delivery/ticket-template.md",
  "docs/agentic-delivery/adr-template.md",
  "docs/agentic-delivery/release-gate-template.md",
  "docs/strategy/vision.md",
  "docs/product/prd.md",
  "docs/architecture/system-architecture.md",
  "docs/architecture/service-boundaries.md",
  "docs/architecture/api-contracts.md",
  "docs/architecture/data-model.md",
  "docs/architecture/ai-orchestration.md",
  "docs/architecture/testing-strategy.md",
  "docs/architecture/observability.md",
  "docs/adr/0001-agentic-delivery-pipeline.md",
  "docs/adr/0002-monorepo-service-boundaries.md",
  "docs/adr/0003-vercel-cloud-run-k8s-path.md",
  "docs/specs/platform-v1.md"
];

const missing = required.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
if (missing.length) {
  console.error("Missing agentic delivery artifacts:\n" + missing.map((m) => `- ${m}`).join("\n"));
  process.exit(1);
}

const overview = fs.readFileSync("docs/agentic-delivery/00-overview.md", "utf8");
for (const phrase of [
  "No product code before specs",
  "CEO AI -> PM AI -> Research AI -> Architect AI -> Spec AI -> UX AI -> Engineering AI -> QA AI -> Deploy AI",
  "Preview before production",
  "Living graph first"
]) {
  if (!overview.includes(phrase)) {
    console.error(`Agentic overview missing required phrase: ${phrase}`);
    process.exit(1);
  }
}

const ticketTemplate = fs.readFileSync("docs/agentic-delivery/ticket-template.md", "utf8");
for (const heading of ["Files allowed to touch", "Tests to add or update", "Commands required", "Refactors allowed", "Observability requirements", "Rollback plan"]) {
  if (!ticketTemplate.includes(heading)) {
    console.error(`Ticket template missing: ${heading}`);
    process.exit(1);
  }
}

const ticketDir = "docs/tickets/platform-v1";
const tickets = fs.readdirSync(ticketDir).filter((name) => name.endsWith(".md"));
if (tickets.length < 5) {
  console.error(`Expected at least 5 platform-v1 tickets, found ${tickets.length}`);
  process.exit(1);
}

console.log(`ok - agentic delivery artifacts validated (${required.length} required files, ${tickets.length} tickets)`);
