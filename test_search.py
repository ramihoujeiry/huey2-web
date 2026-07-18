from playwright.sync_api import sync_playwright
import os, sys
HERE='D:/HUEY2-web'; BASE='http://127.0.0.1:8137'
fails=[]
def check(n,g,w):
    ok=(g==w); print(f"[{'PASS' if ok else 'FAIL'}] {n}: {g!r}")
    if not ok: fails.append(n)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE+'/index.html', wait_until='networkidle'); pg.wait_for_selector('header.app h1')

    # Emergency tab: search 'engine'
    pg.click("button.tab-btn:has-text('Emergency')")
    pg.wait_for_selector('#sec-em .list-btn')
    total0=pg.locator('#sec-em .list-btn').count(); check('em total > 30', total0>30, True)
    pg.fill('#sec-em input[type=search]', 'engine'); pg.wait_for_timeout(200)
    n_eng=pg.locator('#sec-em .list-btn').count()
    check('search engine narrows', n_eng>0 and n_eng<total0, True)
    check('engine shows Engine Failure', pg.locator('#sec-em .list-btn', has_text='Engine Failure').count()>0, True)
    pg.fill('#sec-em input[type=search]', 'zzzzz'); pg.wait_for_timeout(200)
    check('em no-match hint', pg.locator('#sec-em').locator('text=No procedures match').count()>0, True)
    pg.fill('#sec-em input[type=search]', ''); pg.wait_for_timeout(150)

    # SOP tab: type 'torque' -> surfaces SOP Over-Torque
    pg.click("button.tab-btn:has-text('SQN XII SOP')")
    pg.wait_for_selector('#sec-sop .list-btn')
    s_total=pg.locator('#sec-sop .list-btn').count()
    pg.fill('#sec-sop input[type=search]', 'torque'); pg.wait_for_timeout(200)
    s_f=pg.locator('#sec-sop .list-btn').count()
    check('sop search torque narrows', s_f>0 and s_f<s_total, True)
    check('sop shows Over-Torque', pg.locator('#sec-sop .list-btn', has_text='Over-Torque').count()>0, True)
    # 'engine' on SOP tab -> unified search also matches SOP items containing 'engine'
    pg.fill('#sec-sop input[type=search]', 'engine'); pg.wait_for_timeout(200)
    s_eng=pg.locator('#sec-sop .list-btn').count()
    check('sop engine -> shows SOP matches', s_eng>0, True)
    check('sop engine no no-match hint', pg.locator('#sec-sop').locator('text=No procedures match').count()==0, True)

    # Limits still ok
    pg.click("button.tab-btn:has-text('Limits')"); pg.wait_for_selector('table.lim')
    check('limits rows', pg.locator('table.lim tr').count()>20, True)

    check('no console errors', len(errs), 0)
    if errs: print('ERR', errs[:3])
    b.close()
print('\nFAILS:', fails if fails else 'NONE'); sys.exit(1 if fails else 0)
