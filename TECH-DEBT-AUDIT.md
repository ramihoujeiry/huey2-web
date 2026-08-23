# HUEY2-web — Tech Debt & Dependency Audit
Date: 2026-08-23 · Scope: D:\HUEY2-web (git-tracked sources)

## 1. Stack snapshot
| Component | Current | Latest stable | Status |
|---|---|---|---|
| Vue | 3.5.40 (vendored vue.global.prod.js) | 3.5.x current line | ✅ Current — no action |
| Service worker / PWA | hand-written SW, manifest v3-compliant | — | ✅ OK pattern (network-first shell) |
| wrangler (weather-proxy) | ^4.118.0 | 4.x current | ✅ Current; run `npm outdated` occasionally |
| Build tooling | NONE (no root package.json, no bundler, no linter) | Vite 7 optional | ⚠ Deliberate zero-build choice — see debt D1 |

No npm dependencies exist at app level; Vue is vendored intentionally for offline/air-gapped use. **There are no meaningfully "outdated dependencies"** except routine wrangler minor bumps. The real debt is structural.

## 2. Technical debt items

### HIGH severity
- **D1 · Monolithic index.html (~1,441 lines: CSS + 7-tab template + all app JS).**
  Every feature edit touches one file → merge-collision hotspot and hard-to-review diffs.
  Fix (incremental): extract per-tab templates/components into ES modules (`ppc.js`, `weather.js`…) loaded via `<script type="module">`; keep vendored Vue. SW already caches separate files fine.
- **D2 · Duplicate/divergent weather implementations.**
  `weather.js` + `weather-data.js` on disk are DEAD CODE — `index.html` inlines its own `WEATHER_STATE`/`WeatherFetcher`/`AIRPORTS`. The standalone copies have drifted (older state shape, no TAF/QNH fields, different fetch path). Anyone editing `weather.js` wastes effort or reintroduces bugs.
  Fix: delete `weather.js`, `weather-data.js` from repo (and SW ASSETS list if ever referenced), or make index.html load them again — pick one source of truth.

### MEDIUM severity
- **D3 · Documentation drift — PROJECT.md is stale.**
  Says SW cache is `huey2-v2`; actual is `huey2-v25`. Says tabs are "PPC…Limits" but Startup/Brief/Dash/Weather tabs now exist. Misleads future maintenance.
  Fix: update PROJECT.md architecture section; add "bump CACHE on every deploy" to a deploy checklist.
- **D4 · Repo litter / hygiene.**
  Untracked `_frag_*.txt`, `live_shot.png`, `shot_*.png`, `shot_css.py`, `shot_em.py`, dev screenshots, `nul` file noted in PROJECT.md as recurring. `.gitignore` covers some (*.png blocked globally yet icons are tracked via force-add — fragile).
  Fix: ignore `shot_*`, `_frag_*`, `*.png` with explicit `!icon-*.png` exception; delete stale shots/frags.
- **D5 · `v-html` used in ~8 places (search highlighting, brief text).**
  Safe today because data is static manual text and highlight functions escape the query — but there is no test asserting query terms are HTML-escaped. One refactor of `hlText()` away from an XSS.
  Fix: add a regression test that searching `<img src=x onerror=alert(1)>` renders escaped; prefer splitting text nodes over innerHTML long-term.

### LOW severity
- **D6 · Test harness sprawl:** 9+ ad-hoc scripts (`test_app.py`, `test_dom.js`, `verify.js`, `test_live*.py`…) with no single runner or CI. Fine for solo dev; consider one `run_tests.py` entrypoint so nothing gets skipped before deploys.
- **D7 · Hardcoded airport table inline in index.html** (18 entries with coords/keywords) — belongs in a data file like `emergency.js`.
- **D8 · Weather-proxy worker has no tests** despite containing METAR parsing regexes (QNH/wind/temp) — pure functions, trivially unit-testable.
- **D9 · `compatibility_date = "2024-09-23"`** in wrangler.toml is old; bump on next worker deploy to pick up current runtime behavior.

## 3. Architectural assessment
The deliberate choices are sound for the mission: zero-build single-page PWA, vendored Vue for offline/air-gapped use, network-first HTML + cache-first assets, static data split into plain script files. Do NOT introduce Vite/npm build pipeline unless multi-file pain becomes acute — it would break the air-gapped simplicity that is the project's core constraint.

Recommended evolution order:
1. Delete dead `weather.js` / `weather-data.js` (30 min, removes D2).
2. Sync PROJECT.md + .gitignore cleanup (1 h, D3/D4).
3. Add v-html escape regression test (D5).
4. Extract tab components into ES modules incrementally, one tab per change (D1) — only when a merge collision actually bites.

## 4. Dependency action list
- wrangler: `npm install wrangler@latest` in weather-proxy when convenient (currently only ~minor versions behind).
- Vue 3.5.40 vendored: refresh vendored file roughly each Vue minor release (security fixes do land in patch releases); currently fine.
