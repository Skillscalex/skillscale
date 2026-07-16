# Skillscale

Skillscale is an AI skills marketplace, catalog, and agent workspace. The repo contains a Next.js app, a static GitHub Pages export in `docs/`, Supabase schemas for auth and permanent storage, ingestion tooling for mirrored skill catalogs, and a lightweight WebSocket agent server for Studio.

## Current Product Surfaces

| Surface | Path | Purpose |
|---|---|---|
| Home | `/` and `docs/index.html` | Brand entry point for Skillscale |
| Skills | `/marketplace`, `/skill/[id]`, `docs/skills.html` | Browse audited skills by occupation, inspect cards, read `SKILL.md`, and save skills |
| Market | `docs/market.html` | Marketplace-style skill discovery and publishing flow |
| Vault | `/vault`, `docs/vault.html` | Private dreamed/owned skill storage with local fallback and Supabase sync |
| Studio | `/studio`, `docs/studio.html` | Agent workspace for chat, streaming responses, and live agent handoff |
| Hubs, Loops, MCPs, Community | `docs/*.html` | Static ecosystem pages for workflows, integrations, and community context |
| Auth/Safety | `docs/auth.html`, `docs/auth-setup.md` | Supabase login setup and safety notes |

The GitHub Pages version is designed to work without a server. When public Supabase config is present, it upgrades to authenticated Vault sync and full SkillsMP mirror reads. Without config, it falls back to committed JSON shards and browser `localStorage`.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Static GitHub Pages files in `docs/` using React UMD and Babel for portable pages
- Supabase Auth, Postgres, Row Level Security, and REST views
- Stripe routes for checkout and webhook handling
- Anthropic SDK for audit and Studio chat paths
- `ws` WebSocket agent server in `src/agents/server.ts`
- Ingestion and autonomous catalog tooling under `src/ingestion/`

## Data Architecture

Skillscale uses three data layers:

| Layer | Files/Tables | Notes |
|---|---|---|
| Static fallback | `docs/data/skills-catalog.json`, `docs/data/skills-index/**`, `docs/data/occupation-counts.json` | Small committed mirror samples for GitHub Pages reliability |
| Supabase full mirror | `skillsmp_occupation_groups`, `skillsmp_mirror_skills`, public views | Permanent paginated storage for all mirrored SkillsMP records |
| User-private Vault | `vault_items` | Per-user dreamed/owned skills protected by RLS |

Run these migrations in Supabase:

```sql
supabase/001_initial.sql
supabase/002_component_ingestion.sql
supabase/003_skillsmp_full_mirror.sql
supabase/004_skill_market_realtime.sql
supabase/005_vault_storage.sql
```

For GitHub Pages auth and mirror reads, create `docs/data/auth-config.json` from `docs/data/auth-config.example.json`:

```json
{
  "supabaseUrl": "https://your-project-ref.supabase.co",
  "supabaseAnonKey": "your-public-anon-key"
}
```

The anon key is public by design. Security comes from Supabase RLS policies and service-role-only import scripts.

## SkillsMP Mirror

`docs/skills.html` reads full mirrored data from Supabase when configured:

- `public_skillsmp_occupation_counts` powers occupation labels, upstream totals, mirrored counts, coverage, and status.
- `public_skillsmp_skills` powers paginated cards and global search.
- Static shards remain a sample fallback and should not be treated as the full 1.6M+ catalog.

Import an approved SkillsMP export/API dump:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/import-skillsmp-mirror.mjs --input=skillsmp-export.jsonl --batch=1000
```

Rebuild committed fallback data:

```bash
npm run autonomous:skills:publish
```

## Auth And Vault

The static Vault supports:

- Google OAuth
- GitHub OAuth
- Discord OAuth
- Email magic links
- Email/password sign in and sign up
- Local-only fallback when Supabase is not configured
- Authenticated cloud sync to `vault_items`

Required Supabase setup:

- Enable desired providers in Supabase Auth.
- Add `https://skillscalex.github.io/skillscale/vault.html` to allowed redirect URLs.
- Run `supabase/005_vault_storage.sql`.
- Commit or inject the public `docs/data/auth-config.json` for GitHub Pages.

## Studio And Agents

Studio has two implementations:

- Next.js `/studio`: React 19 app that calls `/api/studio/agents` and streams `/api/studio/chat`.
- Static `docs/studio.html`: portable GitHub Pages Studio surface.

The persistent agent server lives in `src/agents/server.ts` and exposes:

- WebSocket: `ws://localhost:3001`
- Health: `GET /health`
- Agents: VideoAgent, ContentAgent, ResearchAgent, SkillCoachAgent

Run locally:

```bash
npm run agents:dev
```

See `src/agents/README.md` for the deployment plan.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Start Next.js |
| `npm run build` | Build the app |
| `npm run lint` / `npm run typecheck` | TypeScript check |
| `npm run agents:dev` | Start the WebSocket agent server |
| `npm run ingest:all` | Run ingestion CLI |
| `npm run autonomous:skills` | Run autonomous skill loop |
| `npm run autonomous:skills:publish` | Publish GitHub Pages skill JSON |
| `npm run skillsmp:mirror:import` | Import SkillsMP mirror into Supabase |

## Key Directories

| Directory | Purpose |
|---|---|
| `src/app` | Next.js pages and API routes |
| `src/components` | Shared app components |
| `src/agents` | Persistent WebSocket agent server |
| `src/ingestion` | Source ingestion, normalization, autonomous catalog publishing |
| `src/lib` | Supabase, Stripe, Anthropic, SkillsMP mirror, utilities |
| `docs` | GitHub Pages static site |
| `docs/data` | Static auth example and generated catalog fallback data |
| `supabase` | SQL migrations |
| `scripts` | Import and seed scripts |

## Deployment Notes

- GitHub Pages serves `docs/`.
- Next.js can deploy to Vercel or another Node host.
- Supabase stores auth, private vault rows, mirrored SkillsMP records, market tables, and realtime data.
- Agent server should run as a long-lived process on DigitalOcean, Railway, or Render.
- Production setup is documented in [`docs/deployment-runbook.md`](docs/deployment-runbook.md).
