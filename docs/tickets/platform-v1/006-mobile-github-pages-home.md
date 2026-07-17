# Ticket 006: Mobile GitHub Pages Home

## Context

The live GitHub Pages home page should provide a mobile-compatible browser experience for users landing from phones. It currently has a desktop-first fixed nav and dense hero layout.

## Status

Approved for implementation under `docs/specs/mobile-home-v1.md`.

## Files allowed to touch

- `docs/index.html`
- `docs/styles.css`
- `scripts/pages-mobile-smoke.test.mjs`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/specs/mobile-home-v1.md`
- `docs/tickets/platform-v1/006-mobile-github-pages-home.md`

## Requirements

- Add mobile menu state and a touch-safe menu button.
- Add mobile drawer/panel links to primary destinations.
- Add responsive CSS for nav, hero, stats, CTA, horizontal content, and footer.
- Add static smoke test for required mobile markup/CSS.

## Tests required

```bash
npm run test:agentic-delivery
npm run test:pages-mobile
npm run typecheck
npm run build
```

## Acceptance criteria

- 390px browser viewport has no horizontal overflow.
- Menu button exposes `aria-expanded` and toggles a mobile drawer.
- Mobile drawer contains Skills, Market, Loops, Community, MCPs, Vault, Hubs, Studio, Safety.
- CI passes.

## Rollback plan

Revert this ticket's PR; desktop static page remains unchanged on `main` before merge.
