# HUEY2 Web App — Project Notes

A mobile-web, offline-capable PWA that turns the **Bell UH-1H-II** performance &
weight-and-balance calculator (originally the `chiidzzz/HUEY2` Vue web app) into a
field tool usable on Android + iOS, plus an Emergency / SQN XII SOP / Operating-Limits
reference built from the flight manual and SQN training guide.

## Live site
- **URL:** https://ramihoujeiry.github.io/huey2-web/
- **Repo:** https://github.com/ramihoujeiry/huey2-web  (public; user = ramihoujeiry)
- Deploy = GitHub Pages, `main` branch root. Push to deploy.
- PWA: installable to home screen (Android Chrome/Edge, iOS Safari → Add to Home Screen);
  works offline once loaded.

## Source documents (in Downloads; PDFs extracted to .txt in this folder)
- `BHT PUB-92-004-10` — UH-1H-II Operator's Manual, Rev 10 (21 Aug 2017). Ch 5 =
  Operating Limits, Ch 7 = Performance (Fig 7-2 torque, 7-3 hover), Ch 8 = Normal
  Procedures (adverse-environment emergencies), Ch 9 = Emergency Procedures.
- `SQN XII SOP Training Guide` — kept as a SEPARATE tab (user decision), not merged
  into Emergency.
- Origin repo: github.com/chiidzzz/HUEY2 (Vue 3 client-side; 4 tools PPC/PA/CG/Converter).

## Architecture (D:\HUEY2-web\)
- `index.html` — single-file Vue 3.5.40 app (Vue vendored locally as `vue.global.prod.js`,
  NO CDN, so it works offline/air-gapped). Tabs: PPC, Power Assurance, W&B/Fuel,
  Convert, Emergency, SQN XII SOP, Limits.
- `emergency.js` — `EMERGENCY_DATA` (BHT Ch9, trimmed checklist + W/C/N callout tags),
  `SOP_DATA` (SQN XII SOP, separate), `LIMITS_DATA` (BHT Ch5). Loaded via `<script>`.
- `sw.js` — service worker. **Cache name `huey2-v2`** (bump this to invalidate stale
  client caches after any deploy). `index.html` = network-first (fresh deploys show
  immediately); static assets = cache-first (offline). On `activate`, old caches deleted.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — PWA.
- `AI_STUDIO_PROMPT.md` — Gemini (aistudio.google.com) chat-layer system prompt.
  **Safety rule: Gemini must NEVER compute torque/CG itself — only explain/guide and
  point to the calculator (deterministic formulas do the math).**
- `verify.js`, `test_dom.js`, `test_app.py`, `test_pwa.py`, `test_emergency.py`,
  `test_search.py`, `test_live*.py`, `test_sw.py` — regression/verification harnesses
  (Playwright + chromium; node for verify.js).

## Key formulas / data (faithful to origin repo; verified 0 mismatches vs repo)
- PPC hover torque: `PPCEngine` (Fat* + virtual X/Y interpolation).
- Power Assurance: `PAEngine` (F* polynomials → min required torque; diff = actual−req).
- W&B/CG: `CGEngine` (fuel moment curve; min-fuel optimization).
- Aircraft data: 29 tail numbers in `HUEY2_AIRCRAFT_DATA` (basic weight/moment).
  NOTE: origin `L-1107` had a typo — key `solid` used instead of `moment` (801400);
  corrected to `moment` in this build.

## Gotchas / lessons learned
- **Stale PWA cache was the #1 support issue.** First deploy used fixed SW cache
  `huey2-v1` + cache-first → installed PWAs served the OLD shell forever, even after
  incognito/clear-data on the page (the SW intercepts at browser level). FIX: bump SW
  cache version + network-first for index.html. After any deploy, tell the user to
  **reload twice** (1st installs new SW, 2nd takes control) or clear site data.
- GitHub deploy needs a token (no `gh` CLI, no Netlify/Vercel token in env). User
  provided a fine-grained PAT (repo scope); created repo + enabled Pages via API.
  Token is NOT committed; recommend revoking after use.
- `nul` file keeps reappearing from `cmd.exe` redirects in this shell — exclude from git.
- search_files tool mis-resolves `/d/` MSYS paths; use `cmd.exe /c` + `findstr`, or
  `py` scripts, for file ops. Inline `py -c "..."` quoting fights bash — write a script.
- Playwright + chromium installed via `py` launcher (Python 3.13.1); Hermes venv has
  no pip/playwright.

## Verification (before declaring done)
- Local: `py test_search.py` (10/10) and `test_live_em.py` (5/5) — 0 console errors.
- Live: headless-Chromium load of the public URL, confirm search filters + 0 errors;
  `urllib` fetch to confirm served bytes/MD5 match local.
- Vision-analyze screenshots (390×844) for mobile UI polish.

## Possible future improvements
- Auto-bold action verbs in procedure steps (currently plain text).
- "Favorites / most-used" pinned emergencies.
- Index the BHT figures (Fig 7-2 etc.) as images for reference.
- Add a unit converter beyond pressure (temp, weight, distance).
- Save this workflow as a Hermes skill (HUEY2→mobile-web PWA + emergency data).
- Add a README to the repo with usage + safety disclaimer.
