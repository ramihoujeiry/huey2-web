from playwright.sync_api import sync_playwright
import sys
URL = 'https://ramihoujeiry.github.io/huey2-web/'
fails=[]
def check(n,g,w):
    ok=(g==w); print(f"[{'PASS' if ok else 'FAIL'}] {n}: {g!r}"); 
    if not ok: fails.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until='networkidle')
    pg.wait_for_selector('header.app h1', timeout=8000)
    check('live title', pg.locator('header.app h1').inner_text(), 'HUEY2 · UH-1 PERFORMANCE & BALANCE')
    pg.select_option('section:has-text("PPC") select','L1201'); pg.wait_for_timeout(150)
    check('live PPC basic weight', pg.locator('section:has-text("PPC") .result .val').first.inner_text(),'5682')
    # service worker on real https host
    pg.wait_for_timeout(500)
    sw=pg.evaluate("() => navigator.serviceWorker.getRegistration().then(r => { if(!r) return 'none'; return r.active ? 'active' : 'reg'; })");
    check('live service worker', sw in ('active','reg'), True)
    print('   sw state:', sw)
    check('no page errors', len(errs), 0)
    pg.screenshot(path='D:/HUEY2-web/live_shot.png', full_page=True)
    b.close()
print(f"\nTOTAL FAILS: {len(fails)}")
sys.exit(1 if fails else 0)
