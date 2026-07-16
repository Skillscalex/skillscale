import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const script = path.join(root, "scripts", "check-deploy-env.mjs");

function run(args = [], env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

{
  const result = run(["--mode=ci"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Deploy env contract OK/);
}

{
  const result = run(["--mode=production"], {
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    INGEST_ADMIN_TOKEN: "",
  });
  assert.notEqual(result.status, 0, "production mode must fail when required backend env is missing");
  assert.match(result.stderr, /Missing required production variables/);
  assert.match(result.stderr, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(result.stderr, /SUPABASE_SERVICE_ROLE_KEY/);
}

{
  const result = run(["--mode=pages"], {
    NEXT_PUBLIC_SUPABASE_URL: "https://skillscale-prod.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /GitHub Pages public config env OK/);
}

console.log("ok - deploy env checker enforces CI, production, and Pages contracts");
