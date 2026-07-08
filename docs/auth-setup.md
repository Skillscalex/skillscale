# Skillscale Auth Setup

The Next.js app and static GitHub Pages vault use Supabase Auth for Google login, optional GitHub/Discord OAuth, email magic links, and email/password accounts.

## Required environment variables

Set these in local development and in the deployment environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Only the first two are required for browser login. The service role key is for server-side imports and admin tasks only.

## Google OAuth provider

In Supabase Dashboard, enable the Google provider under Authentication providers and add the Google OAuth Client ID and Client Secret.

In Google Cloud, configure:

- Authorized JavaScript origin: your app origin, such as `http://localhost:3000` and the production domain.
- Authorized redirect URI: the Supabase callback URL from the Google provider settings.

In Supabase URL configuration, allow:

- `http://localhost:3000/auth/callback`
- `https://your-production-domain/auth/callback`
- `https://skillscalex.github.io/skillscale/vault.html`

GitHub and Discord use the same app-side flow. Enable each provider in Supabase before exposing those buttons in production.

## Email/password provider

In Supabase Dashboard, enable the Email provider. Keep email confirmations on for production accounts unless you have another verification layer. The static Vault supports both:

- email magic link via `signInWithOtp`
- email/password sign in and sign up via Supabase Auth

## Static GitHub Pages vault

`docs/vault.html` and `docs/skills.html` cannot read Next.js environment variables. They load public Supabase browser config from either:

- `window.SKILLSCALE_AUTH_CONFIG`
- `docs/data/auth-config.json`

Create `docs/data/auth-config.json` using `docs/data/auth-config.example.json` as the shape:

```json
{
  "supabaseUrl": "https://your-project-ref.supabase.co",
  "supabaseAnonKey": "your-public-anon-key"
}
```

The anon key is public by design, but Row Level Security must still be enabled for private Supabase data.

## Private Vault storage

Run:

```sql
supabase/005_vault_storage.sql
```

This creates `vault_items` with Row Level Security:

- authenticated users can select, insert, update, and delete only rows where `user_id = auth.uid()`
- static Vault continues to work from `localStorage` when Supabase is absent
- on login, local Vault rows are upserted to Supabase, then remote rows are merged back onto the device

The table stores dreamed and owned skills with private notes, scores, tiers, timestamps, and the original skill payload.

## Full SkillsMP mirror

`docs/skills.html` should not ship 1.65M records as GitHub Pages JSON. It now prefers the Supabase mirror tables created by:

```sql
supabase/003_skillsmp_full_mirror.sql
```

Use an approved SkillsMP export/API feed, then import it in batches:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/import-skillsmp-mirror.mjs --input=skillsmp-export.jsonl --batch=1000
```

Expected result:

- `indexed_count` remains the SkillsMP upstream total.
- `mirrored_count` becomes the imported row count per occupation group.
- `mirror_status` becomes `complete` only when `mirrored_count >= indexed_count`.
- `skills.html` reads `public_skillsmp_occupation_counts` and `public_skillsmp_skills` directly from Supabase with pagination.

If Supabase config is absent, the static page falls back to the smaller committed JSON shards.
