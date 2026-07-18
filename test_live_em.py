from playwright.sync_api import sync_playwright
import sys
URL='https://ramihoujeiry.github.io/huey2-web/'
fails=[]
def check(n,g,w):
    ok=(g==w); print(f"[{'PASS' if ok else 'FAIL'}] {n}: {g!r}")
    if not ok: fails.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until='networkidle'); pg.wait_for_selector('header.app h1', timeout=10000)
    pg.click("button.tab-btn:has-text('Emergency')"); pg.wait_for_selector('.list-btn', timeout=5000)
    check('em buttons', pg.locator('.list-btn').count()>30, True)
    pg.locator('.list-btn', has_text='Engine Failure').first.click(); pg.wait_for_selector('.steps li', timeout=5000)
    check('em steps', pg.locator('.steps li').count()>0, True)
    pg.click("button:has-text('Back to list')")
    pg.click("button.tab-btn:has-text('SQN XII SOP')")
    pg.wait_for_selector("#sec-sop .list-btn", timeout=5000)
    check('sop buttons', pg.locator("#sec-sop .list-btn").count()>5, True)
    pg.click("button.tab-btn:has-text('Limits')"); pg.wait_for_selector('table.lim', timeout=5000)
    check('limits rows', pg.locator('table.lim tr').count()>20, True)
    check('no errors', len(errs), 0)
    if errs: print('ERR', errs[:3])
    b.close()
print('\nFAILS:', fails if fails else 'NONE'); sys.exit(1 if fails else 0)
