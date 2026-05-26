# Frontend Mobile Designer Notes

## Assumptions

- The discovery experience should preserve a premium SaaS feel while becoming usable on narrow mobile screens.
- Navigation below 768px should use a hamburger trigger and side drawer.
- Discovery cards should avoid horizontal overflow and reflow from one column on narrow screens to wider grids on tablet and desktop.
- Detail content should be available without navigating away from search results.

## Implementation Choices

- Use responsive tabs for component groups: All, Plugins, Skills, Agents, Commands, Hooks, MCP Servers, LSP Servers, Templates, Marketplaces, Themes / Styles, and More.
- Use a sticky safe-area-aware top bar with 44px minimum tap targets.
- Use mobile-first grid rules with one column on narrow screens, two columns on larger mobile/tablet, and multi-column desktop layouts.
- Put provenance, source links, install commands, tags, timestamps, and risk notes in a detail drawer or modal.
- Keep filters compact on mobile by using drawer controls for type, category, source, and sort.

## Risks

- Dense source metadata can overflow cards if not truncated and moved into detail views.
- Drawer stacking with sticky nav can create focus or scroll traps if not tested.
- Existing desktop marketplace behavior may regress if responsive rules are too broad.

## Validation Results

- Pending. Do not ship UI changes until breakpoints are checked at 360px, 390px, 430px, 768px, 1024px, and desktop.
- Pending. Add Playwright or equivalent viewport tests for mobile navigation, filters, grid, and detail drawer.
