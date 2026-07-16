#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  })
);

const mode = args.get("mode") ?? "ci";

const PUBLIC_PAGES_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const BACKEND_REQUIRED_ENV = [
  ...PUBLIC_PAGES_ENV,
  "SUPABASE_SERVICE_ROLE_KEY",
  "INGEST_ADMIN_TOKEN",
  "CRON_SECRET",
];
const OPTIONAL_RUNTIME_ENV = [
  "ANTHROPIC_API_KEY",
  "TOGETHER_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_AGENTS_WS_URL",
  "SKILLS_SH_BEARER_TOKEN",
  "ELEVENLABS_API_KEY",
  "TAVILY_API_KEY",
  "PEXELS_API_KEY",
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY",
  "CLOUDFLARE_R2_SECRET_KEY",
  "CLOUDFLARE_R2_BUCKET",
  "WS_PORT",
];
const ALL_DOCUMENTED_ENV = [...new Set([...BACKEND_REQUIRED_ENV, ...OPTIONAL_RUNTIME_ENV])];

function present(name) {
  const value = process.env[name];
  return Boolean(value && value.trim() && !value.includes("your-") && !value.includes("example"));
}

function requirePresent(names, label) {
  const missing = names.filter((name) => !present(name));
  if (missing.length) {
    console.error(`${label}: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function requireExampleDocuments(names) {
  const examplePath = path.join(root, ".env.example");
  if (!fs.existsSync(examplePath)) {
    console.error("Missing .env.example");
    process.exit(1);
  }
  const content = fs.readFileSync(examplePath, "utf8");
  const missing = names.filter((name) => !new RegExp(`^${name}=`, "m").test(content));
  if (missing.length) {
    console.error(`.env.example is missing variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

switch (mode) {
  case "ci":
    requireExampleDocuments(ALL_DOCUMENTED_ENV);
    console.log("Deploy env contract OK: .env.example documents every known production variable.");
    break;
  case "pages":
    requirePresent(PUBLIC_PAGES_ENV, "GitHub Pages public config env missing");
    console.log("GitHub Pages public config env OK.");
    break;
  case "production":
    requirePresent(BACKEND_REQUIRED_ENV, "Missing required production variables");
    console.log("Production deploy env OK.");
    break;
  default:
    console.error(`Unknown mode: ${mode}. Use --mode=ci, --mode=pages, or --mode=production.`);
    process.exit(1);
}
