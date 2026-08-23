# HUEY2-web Performance & Security Audit
Date: 2026-08-23 · Target: D:\HUEY2-web (Vue 3 single-file PWA on GitHub Pages + Cloudflare Worker weather proxy)

## Summary
The app is a stateless client-side PWA (~265 KB of app code, no backend DB). There are no SQL/injection surfaces (no database at all), no auth/CSRF surface (no cookies or server-side sessions — all third-party calls are unauthenticated GETs). The real risks are XSS via `v-html`, an open CORS proxy, a hardcoded GitHub PAT in git history (already flagged in the DevOps audit), and repo hygiene issues that bloat load and cache.

---

## SECURITY FINDINGS

### S1 · XSS via v-html with user-controlled search term — MEDIUM
`index.html` uses `v-html="hlText(it.title,q)"`, `boldStep(s,q)`, and `v-html="briefText"` in 8 places.
`hlText(text,term)` escapes regex metacharacters in the search term but does NOT HTML-escape anything; the user's raw query is interpolated into HTML inside `<span class="hl">…</span>`. A query like `<img src=x onerror=alert(1)>` is rendered as live markup → stored nowhere, but reflected self-XSS / DOM-XSS in the search box.
Fix: HTML-escape `text` and `term` before building highlight output:
```js
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
```
Apply esc() to segments in `hlText()` and to `s` in `boldStep()` before inserting `<b>` tags. Severity drops to LOW once escaped (data is static/manual-entry otherwise).

### S2 · Cloudflare weather proxy: CORS `*`, unvalidated ids passthrough — LOW-MEDIUM
`weather-proxy/worker.js` returns `Access-Control-Allow-Origin: *` and forwards the `ids` query param straight into the NOAA URL (`${NOAA}/${kind}?ids=...`). It's GET-only and NOAA is public, so impact is limited to abuse of your worker as an open relay (quota burn, someone else's traffic on your workers.dev subdomain).
Fix: restrict CORS origin to `https://ramihoujeiry.github.io` (+ localhost for dev), validate `ids` against `/^[A-Z0-9,\s]{3,60}$/i`.

### S3 · Hardcoded GitHub PAT in git history — HIGH (already flagged)
Remote URL carries an embedded PAT with repo scope. Anyone with repo read access gets the token.
Fix: rotate/revoke the PAT, switch remote to credential-manager or SSH (`git remote set-url origin https://github.com/ramihoujeiry/<repo>.git`), scrub history if the repo is public.

### S4 · No Content-Security-Policy meta — LOW
No CSP in `<head>`. Given inline scripts everywhere, add at minimum:
`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://huey2-weather.ramihoujeiry.workers.dev https://metar.vatsim.net; img-src 'self' data:; style-src 'unsafe-inline'">`
This caps damage from any future injection (S1) by blocking exfil endpoints.

### S5 · Dependencies — PASS
No runtime npm dependencies (Vue vendored, vue.global.prod.js). node_modules only holds jsdom test tooling, not shipped. Third-party APIs (open-meteo geocoding/forecast, NOAA via worker, vatsim METAR) are all HTTPS. No known vulnerable runtime deps.

### Injection / CSRF — PASS (N/A)
No database, no cookies, no authenticated requests, all fetches use encodeURIComponent on inputs. Nothing to inject into; CSRF not applicable.

---

## PERFORMANCE FINDINGS

### P1 · Monolithic 76 KB index.html parsed+mounted in one pass — MEDIUM (perceived startup)
All 12 tabs' templates ship in one file; Vue compiles the entire template at mount even though one tab is visible. On low-end phones first paint lags.
Fix options: lazy-compile per tab using `v-if` (already?) — better: move rarely used tabs (Startup checklist, Briefing) into separate `<script type="text/x-template">` blocks compiled on first visit, or accept current size since total JS is only ~265 KB uncompressed. Priority: LOW-MED.

### P2 · Dead duplicate files still served/cached — LOW
- `weather.js` and `weather-data.js` are byte-identical duplicates, NOT referenced by index.html (weather code was inlined). They're stale but harmless; remove both to avoid confusion. Note sw.js does NOT precache them — good.
- Repo root carries ~800 KB of screenshots (`shot_*.png`, `live_shot.png`) and 600 KB of source text dumps (`bht_pub.txt`, `sqn_sop.txt`) deployed to Pages. Not fetched by the app, but they slow clones/deploys. Move to a `/docs` folder excluded from deploy or delete.

### P3 · Weather search fires a network call per Enter press, no debounce/dedup — LOW
`weatherSearch()` runs on every Enter with no minimum-interval guard; rapid re-submits can race (later response overwrites earlier — benign here since last-write-wins matches the input). Add a simple in-flight token check:
```js
const seq = ++this._wseq;
WeatherFetcher.searchAreas(q).then(list => { if (seq !== this._wseq) return; ... });
```

### P4 · Service worker cache-first for hashed-less assets — OK with caveat
sw.js v25: network-first HTML, cache-first assets — correct design. Caveat: static assets have NO version query strings, so after a deploy clients keep serving old `emergency.js` etc. until the CACHE const bumps. This already bit you before (stale-JS rule). Recommendation: append `?v=<deploy-hash>` when registering ASSETS, or keep the manual bump discipline.

### P5 · No compression concern — PASS
GitHub Pages serves gzip/brotli automatically; ~265 KB raw ≈ ~70 KB transferred. Fine.

### Database queries — N/A
Stateless client app; no DB anywhere in this project.

---

## PRIORITIZED FIX LIST
1. HIGH — Rotate the hardcoded GitHub PAT; clean remote URL (S3).
2. MED — HTML-escape in hlText/boldStep to close reflected XSS (S1); then add CSP meta (S4).
3. MED — Lock weather-proxy CORS to github.io origin + validate ids (S2).
4. LOW — Delete duplicate weather.js/weather-data.js; move screenshots/text dumps out of the deploy root (P2).
5. LOW — Add race-guard to weatherSearch (P3); consider asset versioning strategy in sw.js (P4).
