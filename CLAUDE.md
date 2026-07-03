# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**catatan-pengeluaran** is a household expense tracker web app (UI text in Indonesian). It is a fully client-side PWA built with **vanilla HTML/CSS/JavaScript — no framework, no build step, no dependencies, no backend**. All data lives in the browser's localStorage.

## Running & Verifying

There is no `npm`, no test suite, and no linter. To run the app:

```powershell
.\server.ps1   # static server on http://localhost:8000
```

A static server is required for the service worker (it won't register via `file://`). Verify changes by driving the app in a browser; note that the delete-expense and category-management flows use native `confirm()`/`prompt()` dialogs, which block browser automation — avoid triggering them in automated checks (newer features deliberately use inline panels instead).

## Architecture

```
index.html      # single page; all sections live here
js/app.js       # all application logic in one classic script (globals, no modules)
css/style.css   # all styling; design tokens as CSS variables in :root
manifest.json   # PWA manifest
sw.js           # service worker, cache-first with versioned cache name
icons/icon.svg  # app icon (also favicon)
server.ps1      # Windows dev server (update its content-type map when adding new file types)
```

### Data model (localStorage)

| Key | Content |
|---|---|
| `catatan-pengeluaran-data` | array of `{id, date: 'YYYY-MM-DD', category, amount, note}` sorted date-desc |
| `catatan-pengeluaran-categories` | array of custom category names (defaults live in `DEFAULT_CATEGORIES` in app.js) |
| `catatan-pengeluaran-budgets` | `{total: number\|null, categories: {[name]: number}}` |

### Key patterns in app.js

- **Single render pipeline**: mutate state → `save*()` → `refreshViews()` (re-renders month nav, list, summary, category stats, trend, budget list). Never render piecemeal.
- **`activeMonth`** (`'YYYY-MM'`) drives summary, category stats, and the expense list; the trend chart always shows the last 6 calendar months.
- All list interactions use **event delegation** with `data-*` attributes on the container.
- HTML built with template strings; user input goes through `escapeHtml()`.
- Currency/date formatting via `Intl` with the `id-ID` locale.

## Important Conventions

- **Bump `CACHE_NAME` in `sw.js`** (e.g. `catatan-pengeluaran-v1` → `-v2`) whenever `app.js`, `style.css`, or `index.html` changes — the service worker is cache-first, so users keep the old version otherwise.
- Commit messages are in Indonesian, imperative mood (see `git log`).
- UI copy is Indonesian; keep new UI text consistent.
- New destructive/confirm flows should use inline confirmation panels (like the import Gabungkan/Ganti Semua flow), not `confirm()`/`prompt()`.
- This app handles household financial data: validate all imported/parsed data defensively (see `validateImportData`) and never let a bad file corrupt stored data.
