# Spec: Mobile GitHub Pages Home V1

## Objective

Make the live GitHub Pages home page at `https://skillscalex.github.io/skillscale/` work well in mobile browsers while preserving the desktop liquid-glass experience.

## Scope

- Static GitHub Pages home page: `docs/index.html`.
- Shared static design system CSS: `docs/styles.css`.
- Mobile validation smoke checks.

## Requirements

1. Mobile users get a compact top bar with a reachable 44px+ hamburger/menu button.
2. Primary navigation is accessible from a mobile drawer/menu without horizontal overflow.
3. Hero content fits 320px–430px widths without clipping, oversized cards, or cramped CTAs.
4. Feature/stat/footer layouts collapse to single-column or horizontal scroll patterns appropriate for mobile.
5. Touch targets are at least 44px where practical.
6. The menu uses semantic buttons/links and `aria-expanded`/`aria-label`.
7. Desktop layout remains unchanged above tablet breakpoints.

## Non-goals

- Do not redesign the full brand or rewrite the static page stack.
- Do not convert the CDN React page into a compiled bundle in this ticket.
- Do not change backend APIs or Supabase behavior.

## Commands

```bash
npm run test:agentic-delivery
npm run test:pages-mobile
npm run typecheck
npm run build
```

## Success criteria

- Static tests prove the mobile nav/drawer contract exists.
- Playwright/browser smoke at a 390px viewport shows no horizontal overflow.
- GitHub CI passes after PR.
