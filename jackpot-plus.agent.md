---
name: jackpot-plus
description: >
  Use when: working on Jackpot+ browser extension — popup.js, popup.html, popup.css,
  content.js, manifest.json, components (deck.js, goals.js, shop.js, toolbar.js),
  or any CSS files in the css/ folder. Also use for: adding new features to
  Jackpot+, fixing theme switching, updating HTML dumps, or anything touching the
  extension's UI or content scripts.
---

# Jackpot+ Agent

Specialized agent for the Jackpot+ browser extension project.

## Project Overview

**What it does**: Browser extension that removes the "gambling" theme from jackpot.hackclub.com and improves the UX. It injects CSS/JS via content scripts and provides a settings popup.

**Tech stack**: Vanilla JS, CSS custom properties for theming, Chrome Extension Manifest V3.

**Key files**:
- `popup.html` / `popup.js` / `popup.css` — Extension settings popup
- `manifest.json` — Extension config (content scripts, permissions, web accessible resources)
- `content.js` — Main content script entry point
- `components/deck.js` — Card deck component
- `components/goals.js` — Goals/tracking component
- `components/shop.js` — Shop component
- `components/toolbar.js` — Toolbar component
- `css/base.css`, `css/toolbar.css`, `css/deck.css`, `css/shop.css`, `css/states-and-responsive.css` — Component styles

## Design & Style

- **Font**: Sour Gummy (FlavorTown theme), system fonts for plain/hacker
- **Theming**: CSS custom property tokens on `html[data-jp-theme="..."]` — three themes: plain (indigo), hacker (terminal green), flavortown (warm beige/maroon)
- **Writing style**: Conversational yet precise. Direct, no jokey enthusiasm. See `/memories/writing_style.md`
- **No AI slop**: No cyan/purple gradients, no glassmorphism, no gradient text on metrics, no generic card grids

## Workflow Rules

1. **New features**: Always add to the project README so nothing gets forgotten
2. **HTML dumps**: When browser access is available, update the `agentstuff/` folder with fresh dumps from the Jackpot site
3. **Theme work**: Always test all three themes (plain, hacker, flavortown) — don't break theme switching
4. **Hours tracking**: `existingHoursForItem` pulls from `localStorage` key `jackpot_plus_stats.hours` — the toolbar total, not per-card sums
5. **Pricing**: 50 chips = $6 = 1 hour (updated Mar 20, 2026 for online items)
6. **Content script timing**: Runs at `document_start` — code must not rely on DOM being ready unless explicitly waiting

## When Adding Features

1. Update the relevant component JS file
2. Add corresponding CSS to the appropriate css/ file
3. If new permissions needed, update manifest.json
4. Add feature to README under "New features"
5. Test in browser after building
