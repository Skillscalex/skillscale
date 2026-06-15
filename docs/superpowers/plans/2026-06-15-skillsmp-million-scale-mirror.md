# SkillsMP Million-Scale Mirror Plan

Date: 2026-06-15

## Goal

Make `docs/skills.html` represent the full SkillsMP occupation catalog accurately while keeping GitHub Pages fast and repository updates manageable.

SkillsMP currently reports:

- 23 major occupation groups
- 867 SOC occupations
- 93% classified
- 1,199,690 skills for `# 01 Computer and Mathematical`
- 1,605,833 skills across the 23 major groups

The static site must treat those numbers as the authoritative indexed totals. The repo-local `docs/data/skills-catalog.json` is a mirrored sample until a paginated export/API can safely populate sharded data.

## Current Implementation

- `docs/data/occupation-counts.json` is generated from `https://skillsmp.com/occupations`.
- Each occupation group includes:
  - `count`: upstream SkillsMP indexed total
  - `displayCount`: compact sidebar count
  - `sourceUrl`: full SkillsMP group URL
  - `localCount`: number currently mirrored into `skills-catalog.json`
  - `coveragePercent`: local mirror coverage
  - `mirrorStatus`: `sampled`, `partial`, or `complete`
- `docs/skills.html` displays upstream totals as the primary group size and local mirror coverage as secondary metadata.
- `docs/data/skills-index/` is generated from the current local mirror using the same manifest/shard layout planned for the full corpus.
- `docs/skills.html` lazy-loads the selected occupation's first shard when present, then falls back to the featured catalog sample.
- `.github/workflows/agentic-skill-catalog.yml` refreshes both `skills-catalog.json` and `occupation-counts.json` every six hours.

## Full Mirror Architecture

Do not put one million skills into `skills-catalog.json`. Use sharded static data:

```text
docs/data/
  occupation-counts.json
  skills-catalog.json              # featured/trending/sample cards only
  skills-index/
    manifest.json                  # implemented: shard list, versions, total counts
    01/
      manifest.json                # implemented: group-level shard manifest
      page-000001.json             # implemented: up to 500 normalized skills
      page-000002.json
    02/
      manifest.json
      page-000001.json
```

Each shard should contain stable, compressed-card fields only:

```json
{
  "id": "github-owner-repo-skill",
  "name": "skill name",
  "description": "short text",
  "author": "owner",
  "stars": 123,
  "tags": ["agent-skill"],
  "occupationId": "01",
  "source": "skillsmp",
  "sourceUrl": "https://skillsmp.com/skills/...",
  "githubUrl": "https://github.com/owner/repo",
  "updatedAt": "1781500000"
}
```

## Autonomous Update Loop

1. Fetch `https://skillsmp.com/occupations`.
2. Parse and write `occupation-counts.json`.
3. For each major group, fetch its SkillsMP group URL.
4. Discover paginated skill URLs/API cursors from the group page or official API.
5. Fetch pages with checkpointing:
   - checkpoint key: occupation group ID
   - page/cursor
   - content hash
   - last success timestamp
6. Normalize records to the compact shard schema.
7. Write shard files only when their content hash changes.
8. Update `skills-index/manifest.json`.
9. Recompute local coverage in `occupation-counts.json`.
10. Commit changed manifests/shards in the scheduled workflow.

## GitHub Pages UI Behavior

- Initial load:
  - load `occupation-counts.json`
  - load `skills-catalog.json` sample
- Occupation click:
  - show upstream indexed count immediately
  - show mirrored shard count
  - lazy-load the first shard for that occupation if present
  - fall back to the SkillsMP group link if shards are absent
- Search:
  - search local shards when loaded
  - for global search across the full corpus, route to SkillsMP until a server-side index exists

## Safety And Scale Limits

- Keep individual shard files below 500 KB when possible.
- Do not execute scraped install commands.
- Preserve robots/rate-limit checks.
- Keep generated files deterministic so workflow commits stay small.
- If full mirroring exceeds repository size, move shards to object storage and keep only manifests in GitHub Pages.

## Completion Criteria

The full mirror can be marked complete only when:

- Every one of the 23 major groups has a shard manifest.
- The sum of shard item counts equals the corresponding SkillsMP group count or documents a precise upstream delta.
- `# 01 Computer and Mathematical` has approximately 1,199,690 mirrored records or a newer verified SkillsMP total.
- `docs/skills.html` can browse lazy-loaded shards for every group.
- Scheduled workflow resumes from checkpoints and updates only changed shards.
