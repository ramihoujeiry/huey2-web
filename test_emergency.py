from playwright.sync_api import sync_playwright
import os, sys
HERE='D:/HUEY2-web'
BASE='http://127.0.0.1:8137'

fails=[]
def check(n,g,w):
    ok=(g==w); print(f"[{'PASS' if ok else 'FAIL'}] {n}: {g!r}"); 
    if not ok: fails.append(n)

with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE+'/index.html', wait_until='networkidle')
    pg.wait_for_selector('header.app h1', timeout=8000)

    # background server has no SW over http? service worker needs https; ignore SW.
    check('title', pg.title(), 'HUEY2 — UH-1 Performance & Balance')

    # Emergency tab
    pg.click("button.tab-btn:has-text('Emergency')")
    pg.wait_for_selector("section:has-text('Emergency Procedures')", timeout=5000)
    n_btns = pg.locator('.list-btn').count()
    check('em list buttons > 30', n_btns>30, True)
    # click first engine procedure
    pg.locator('.list-btn', has_text='Engine Failure').first.click()
    pg.wait_for_selector('.steps li', timeout=5000)
    n_steps = pg.locator('.steps li').count()
    check('em steps > 0', n_steps>0, True)
    # back
    pg.click("button:has-text('Back to list')")
    pg.wait_for_selector('.list-btn', timeout=5000)

    # SOP tab
    pg.click("button.tab-btn:has-text('SQN XII SOP')")
    pg.wait_for_selector("section:has-text('SQN XII SOP')", timeout=5000)
    n_sop = pg.locator('.list-btn').count()
    check('sop list buttons > 5', n_sop>5, True)
    pg.locator('.list-btn', has_text='Over-Torque').first.click()
    pg.wait_for_selector('.steps li', timeout=5000)
    check('sop has tags', pg.locator('.tag').count()>0, True)
    pg.click("button:has-text('Back to list')")

    # Limits tab
    pg.click("button.tab-btn:has-text('Limits')")
    pg.wait_for_selector('table.lim', timeout=5000)
    n_rows = pg.locator('table.lim tr').count()
    check('limits rows > 20', n_rows>20, True)
    check('limits has 10500', '10,500 lb' in pg.content(), True)

    # PPC still works (regression)
    pg.click("button.tab-btn:has-text('PPC')")
    pg.select_option("section:has-text('PPC') select", 'L1201')
    pg.wait_for_timeout(400)
    bw = pg.locator("section:has-text('PPC') .result .val").first.inner_text()
    check('PPC basic weight', bw, '5682')

    check('no console errors', len(errs), 0)
    if errs: print('CONSOLE ERRORS:', errs[:5])

    b.close()

print('\nFAILS:', fails if fails else 'NONE')
sys.exit(1 if fails else 0)
