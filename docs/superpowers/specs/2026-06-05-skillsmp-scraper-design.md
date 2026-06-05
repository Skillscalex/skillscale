# SkillsMP Full Scraper — Design Spec
**Date:** 2026-06-05  
**Status:** Approved

---

## Goal

Build a continuous, resumable, long-running HTTP scraper that collects all 1.5M+ skills from skillsmp.com and stores them locally (per-skill JSON + JSONL index) with optional Supabase export. No API key required. No headless browser required.

---

## Technology Choice

**Approach A — HTTP fetch + JSON-LD + RSC stream parsing**

- Plain Node.js `fetch` (native, no extra deps)
- JSON-LD `<script type="application/ld+json">` for structured metadata
- `self.__next_f.push([1,"..."])` RSC chunks for README markdown content
- `<meta name="keywords">` for categories/tags
- Rendered HTML fallback for stars, install command, similar skills
- `cheerio` for robust HTML parsing (new dep, lightweight)

No Playwright/Puppeteer needed — skillsmp.com uses Next.js 14 App Router with SSR, pages fully rendered server-side.

---

## Architecture

```
scripts/scrape-skillsmp.ts
src/ingestion/scrapers/skillsmp/
  index.ts        ← SkillsmpScraper orchestrator
  discovery.ts    ← URL discovery (sitemaps + creator/category pages)
  extractor.ts    ← HTML → SkillsmpSkill (JSON-LD + RSC + meta + HTML)
  queue.ts        ← Persistent JSONL queue (append/drain, crash-safe)
  storage.ts      ← Per-skill JSON + index.jsonl + progress.json
  rateLimit.ts    ← Token bucket (1 token/sec, burst 3)
  types.ts        ← SkillsmpSkill, ScrapeProgress, QueueEntry

.ingestion-cache/skillsmp/
  skills/{aa}/{skill-id}.json   ← sharded by first 2 chars, ~1.5M files
  queue.jsonl                   ← pending URLs
  completed.txt                 ← one skill-id per line
  failed.jsonl                  ← {url, error, attempts, lastAttempt}
  index.jsonl                   ← lightweight metadata (no readme)
  progress.json                 ← live stats + ETA
```

---

## Data Model

```typescript
interface SkillsmpSkill {
  // Identity
  id: string;           // URL slug
  name: string;
  skillsmpUrl: string;

  // Authorship (JSON-LD)
  author: string;
  authorUrl: string;
  githubUrl: string;
  dateModified: string;

  // Metadata (meta tags)
  description: string;
  categories: string[];
  tags: string[];

  // Content (RSC stream)
  readme: string;

  // Engagement (rendered HTML)
  stars: number;
  installCommand: string;

  // Extended (Phase 2)
  occupations: string[];
  similarSkills: string[];

  // Scrape metadata
  scrapedAt: string;
  phase: 1 | 2;
  parseError?: string;
}
```

---

## Discovery Strategy

1. **Sitemaps** (3 HTTP fetches): `skills-recent.xml` (10K), `creators.xml` (5K slugs), `pages.xml` (50+ category slugs), `occupations.xml` (692 slugs)
2. **Creator pages** (5K fetches, 10 concurrent): Each `/creators/{slug}` page lists all their skills → extracts all skill URLs
3. **Category pages** (50 × ~N pages, paginated): `/categories/{slug}?page=N` until exhausted

All slugs merged into deduplicated `Set<string>` → written to `queue.jsonl`.

Discovery runs at 10 concurrent (fast listing pages). Detail scraping drops to 1 req/sec.

---

## Extraction Fallback Chain

| Field | Primary | Fallback 1 | Fallback 2 |
|---|---|---|---|
| name | JSON-LD | og:title | slug → title |
| description | JSON-LD | og:description | first 200 chars readme |
| githubUrl | JSON-LD codeRepository | `<a href="github.com">` | "" |
| readme | RSC stream chunks | GitHub raw fetch | "" |
| stars | RSC rendered HTML | 0 | — |
| categories | meta keywords | JSON-LD keywords | [] |
| installCommand | RSC rendered HTML | "" | — |

---

## Rate Limiting

- Token bucket: 1 token/sec, burst capacity 3
- Respects `Crawl-delay: 1` from robots.txt
- On HTTP 429: read `Retry-After` header, pause all workers
- On HTTP 5xx: exponential backoff 5s → 10s → 30s → fail (3 attempts)
- On HTTP 404: no retry, log to `failed.jsonl`

---

## Robustness

| Scenario | Recovery |
|---|---|
| Process crash | Restart reads `completed.txt`, skips existing `skills/{id}.json` files |
| Network outage | 15s timeout → retry queue → auto-resumes |
| Server 429 | Pause all workers, resume after backoff |
| Corrupt HTML | Store partial data, set `parseError`, flag for Phase 2 retry |
| Disk full | Monitor every 1K skills, pause + warn if < 1GB free |

---

## CLI

```bash
npx tsx scripts/scrape-skillsmp.ts              # start or resume
npx tsx scripts/scrape-skillsmp.ts --stats       # show live stats
npx tsx scripts/scrape-skillsmp.ts --discover-only  # build queue only
npx tsx scripts/scrape-skillsmp.ts --phase 2    # extended data pass
npx tsx scripts/scrape-skillsmp.ts --export     # push to Supabase
npx tsx scripts/scrape-skillsmp.ts --retry-failed  # retry failed URLs
npx tsx scripts/scrape-skillsmp.ts --rate 2     # override req/sec
```

Graceful shutdown on SIGINT/SIGTERM: flushes current batch + writes `progress.json`.

---

## Scale

- Discovery: ~5,000 creator pages at 10 concurrent ≈ 8 min
- Phase 1 scrape: 1.5M × 1.2s = ~20 days continuous
- Storage: ~3KB avg per skill × 1.5M = ~4.5GB
- Index: ~200 bytes per skill × 1.5M ≈ 300MB (`index.jsonl`)

Long-running process: run with PM2 (`pm2 start scripts/scrape-skillsmp.ts --interpreter tsx`).
