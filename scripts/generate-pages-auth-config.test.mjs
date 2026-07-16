import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts", "generate-pages-auth-config.mjs");
const tmp = mkdtempSync(path.join(tmpdir(), "skillscale-pages-config-"));

const result = spawnSync(process.execPath, [script, `--out=${tmp}`], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "https://skillscale-prod.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-public-key",
  },
  encoding: "utf8",
});

assert.equal(result.status, 0, result.stderr || result.stdout);
const configPath = path.join(tmp, "auth-config.json");
assert.equal(existsSync(configPath), true, "auth-config.json should be generated");
const config = JSON.parse(readFileSync(configPath, "utf8"));
assert.deepEqual(config, {
  supabaseUrl: "https://skillscale-prod.supabase.co",
  supabaseAnonKey: "anon-public-key",
});
assert.match(result.stdout, /Wrote public GitHub Pages Supabase config/);

const missing = spawnSync(process.execPath, [script, `--out=${tmp}`], {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  encoding: "utf8",
});
assert.equal(missing.status, 0, missing.stderr || missing.stdout);
assert.match(missing.stdout, /Skipping public Pages Supabase config/);

console.log("ok - pages auth config generator writes only public Supabase config");
