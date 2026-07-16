#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  })
);

const outDir = path.resolve(process.cwd(), args.get("out") ?? "docs/data");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function usable(value) {
  return Boolean(value && !value.includes("your-") && !value.includes("example"));
}

if (!usable(supabaseUrl) || !usable(supabaseAnonKey)) {
  console.log("Skipping public Pages Supabase config: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not both configured.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
const target = path.join(outDir, "auth-config.json");
const config = {
  supabaseUrl,
  supabaseAnonKey,
};
fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote public GitHub Pages Supabase config to ${path.relative(process.cwd(), target)}`);
