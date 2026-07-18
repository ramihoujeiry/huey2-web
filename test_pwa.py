from playwright.sync_api import sync_playwright
import os, sys

BASE = 'http://127.0.0.1:8137'
URL = BASE + '/index.html'

fails = []
def check(name, got, want):
    ok = (got == want)
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got={got!r} want={want!r}")
    if not ok: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto(URL, wait_until='networkidle')
    page.wait_for_selector('header.app h1', timeout=5000)

    # manifest link
    man_href = page.eval_on_selector('link[rel=manifest]', 'el => el.getAttribute("href")')
    check('manifest link present', man_href, 'manifest.webmanifest')

    # manifest parses
    manifest = page.evaluate("async () => { const r = await fetch('manifest.webmanifest'); return await r.json(); }")
    check('manifest name', bool(manifest.get('name')), True)
    check('manifest display', manifest.get('display'), 'standalone')
    check('manifest 192 icon', any('192' in i.get('sizes','') for i in manifest.get('icons',[])), True)
    check('manifest 512 icon', any('512' in i.get('sizes','') for i in manifest.get('icons',[])), True)

    # sw.js reachable & valid JS
    sw_txt = page.evaluate("async () => (await fetch('sw.js')).text()")
    check('sw.js reachable', 'addEventListener' in sw_txt, True)

    # icons reachable + png
    for ic in ['icon-192.png','icon-512.png']:
        ok = page.evaluate(f"async () => {{ const r = await fetch('{ic}'); return r.ok && (r.headers.get('content-type')||'').includes('image/png'); }}")
        check(f'icon {ic} reachable+png', ok, True)

    # service worker actually registered (secure context over http://localhost)
    page.wait_for_timeout(400)
    sw_state = page.evaluate("() => navigator.serviceWorker.getRegistration().then(r => r ? r.active ? 'active' : 'registered' : 'none')")
    check('service worker registered', sw_state in ('active','registered'), True)
    print(f"   [info] service worker state: {sw_state}")

    # offline: reload with context offline, expect app shell served from cache
    try:
        page.context.set_offline(True)
        page.reload(wait_until='domcontentloaded', timeout=8000)
        page.wait_for_selector('header.app h1', timeout=8000)
        # offline shell loads; now exercise it like a user would (all logic is client-side)
        page.select_option('section:has-text("PPC") select', 'L1201')
        page.wait_for_timeout(200)
        bw = page.locator('section:has-text("PPC") .result .val').first.inner_text()
        check('offline PPC basic weight', bw, '5682')
    except Exception as e:
        check('offline app shell loads', False, True)
        print('   offline error:', e)
    finally:
        page.context.set_offline(False)

    # regression: online compute
    page.goto(URL, wait_until='networkidle')
    page.select_option('section:has-text("PPC") select', 'L1201')
    page.wait_for_timeout(150)
    bw = page.locator('section:has-text("PPC") .result .val').first.inner_text()
    check('PPC basic weight (L1201)', bw, '5682')

    hard = [e for e in errors if 'Vue warn' not in e]
    check('no hard console errors', len(hard), 0)
    if hard:
        for e in hard: print('   ERR:', e)

    b.close()

print(f"\nTOTAL FAILS: {len(fails)}")
sys.exit(1 if fails else 0)
