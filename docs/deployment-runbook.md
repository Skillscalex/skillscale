# Skillscale Deployment Runbook

This runbook turns the repository into a deployable production stack while keeping GitHub Pages as a resilient static fallback.

## 1. Required services

| Service | Purpose | Recommended target |
|---|---|---|
| GitHub Pages | Static marketing/catalog fallback | `https://skillscalex.github.io/skillscale/` from `main:/docs` |
| Vercel | Next.js app and API routes | `skillscale.ai` or `app.skillscale.ai` |
| Supabase | Auth, vault, skill mirror, public read views | Production Supabase project |
| Railway/Render/DigitalOcean | Long-running WebSocket agents | `wss://agents.skillscale.ai` |
| Stripe | Marketplace payments | Production Stripe account |

## 2. Environment variables

Use `.env.example` as the contract. Never commit real secrets.

Required for production backend:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INGEST_ADMIN_TOKEN=
CRON_SECRET=
```

Recommended for full product behavior:

```bash
ANTHROPIC_API_KEY=
TOGETHER_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_AGENTS_WS_URL=wss://agents.skillscale.ai
SKILLS_SH_BEARER_TOKEN=
```

Validate locally:

```bash
npm run check:deploy-env
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm run pages:auth-config
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... INGEST_ADMIN_TOKEN=... CRON_SECRET=... \
  node scripts/check-deploy-env.mjs --mode=production
```

## 3. Supabase setup

Run SQL migrations in order:

```sql
supabase/001_initial.sql
supabase/002_component_ingestion.sql
supabase/003_skillsmp_full_mirror.sql
supabase/004_skill_market_realtime.sql
supabase/005_vault_storage.sql
```

Then validate anonymous public reads:

```bash
curl -fsS "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/public_skillsmp_occupation_counts?select=id,label,indexed_count,mirrored_count" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

The service role key is only for server-side ingestion and import scripts.

## 4. GitHub repository secrets

Configure these in `Skillscalex/skillscale`:

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Skillscalex/skillscale --body "$NEXT_PUBLIC_SUPABASE_URL"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Skillscalex/skillscale --body "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo Skillscalex/skillscale --body "$SUPABASE_SERVICE_ROLE_KEY"
gh secret set INGEST_ADMIN_TOKEN --repo Skillscalex/skillscale --body "$INGEST_ADMIN_TOKEN"
gh secret set CRON_SECRET --repo Skillscalex/skillscale --body "$CRON_SECRET"
gh secret set SKILLS_SH_BEARER_TOKEN --repo Skillscalex/skillscale --body "$SKILLS_SH_BEARER_TOKEN"
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public browser config, but keeping them in secrets lets Actions generate `docs/data/auth-config.json` only when production config exists.

## 5. GitHub Pages static catalog

The `Agentic Skill Catalog` workflow now:

1. Publishes `docs/data/skills-catalog.json`, `docs/data/occupation-counts.json`, and `docs/data/skills-index/**`.
2. Generates `docs/data/auth-config.json` when Supabase public env is configured.
3. Commits those generated files back to `main` for GitHub Pages.

If `auth-config.json` is present, `docs/skills.html` upgrades from static fallback to Supabase REST reads for the full mirror.

## 6. Full SkillsMP mirror import

Given an approved JSONL export/API dump:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/import-skillsmp-mirror.mjs --input=skillsmp-export.jsonl --batch=1000
```

Then rebuild static fallback shards:

```bash
npm run autonomous:skills:publish
```

## 7. Vercel deployment

1. Connect `Skillscalex/skillscale` in Vercel.
2. Use Node 24 to match GitHub Actions.
3. Add all production environment variables from `.env.example`.
4. Build command: `npm run build`.
5. Install command: `npm ci`.
6. Add custom domain if desired.

Smoke checks:

```bash
curl -fsS "https://<vercel-domain>/api/v1/skills/search?q=code&limit=5"
curl -fsS "https://<vercel-domain>/api/components?limit=5"
```

## 8. Agent server deployment

Deploy `src/agents/server.ts` as a persistent Node service:

```bash
npm ci
WS_PORT=3001 NODE_ENV=production npm run agents:dev
```

For production, put it behind HTTPS/WSS and set:

```bash
NEXT_PUBLIC_AGENTS_WS_URL=wss://agents.skillscale.ai
```

Before exposing public traffic, replace truthy-token auth with Supabase JWT verification, add payload limits, and add rate limiting.

## 9. CI release gates

The `CI` workflow runs:

```bash
npm ci
npm run check:deploy-env
npm run typecheck
npm run build
npm run test:ingestion
npm run test:autonomous-skills
npm run test:agentic-civilization
npm run test:e2e:mobile
npm run test:deploy-env
npm audit --audit-level=high
```

The audit gate intentionally fails while reachable high vulnerabilities remain. Fix or document a temporary exception before production release.
