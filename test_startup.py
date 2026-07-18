import os, tempfile, sys
from playwright.sync_api import sync_playwright

APP = r'D:\HUEY2-web\index.html'
URL = 'file://' + APP
out = os.path.join(tempfile.gettempdir(), 'hermes-verify-startup.txt')
L = []
def log(s): L.append(str(s)); print(s)
def itxt(pg, sel, i=0):
    loc = pg.locator(sel).nth(i)
    return loc.inner_text() if loc.count() else '(missing)'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
    pg.goto(URL); pg.wait_for_timeout(500)

    pg.click('button.tab-btn:has-text("Startup")'); pg.wait_for_timeout(300)
    titles = pg.locator('.phase-card .phase-title').all_inner_texts()
    log('phases (%d): %s' % (len(titles), titles))
    phase_ok = len(titles) == 4 and titles[0]=='Before Starting Engine' and titles[1]=='Starting Engine'

    overall0 = itxt(pg, '.overall-txt')
    log('overall before: %s' % overall0)
    start_ok = '0 /' in overall0 and '93' in overall0

    # open "Starting Engine" by exact index
    se_idx = titles.index('Starting Engine')
    pg.locator('.phase-card').nth(se_idx).click(); pg.wait_for_timeout(300)
    se_steps = pg.locator('.chk li').count()
    log('Starting Engine steps: %d' % se_steps)
    step_ok = 13 <= se_steps <= 20

    # tap first step -> done
    li0 = pg.locator('.chk li').first
    li0.click(); pg.wait_for_timeout(200)
    is_done = li0.evaluate('e=>e.classList.contains("done")')
    done_now = pg.locator('.chk li.done').count()
    log('after 1 tap: firstDone=%s doneInView=%d' % (is_done, done_now))
    tap_ok = is_done and done_now == 1

    # mark all REMAINING (not-done) in this phase -> phase complete banner
    for li in pg.locator('.chk li').all():
        if not li.evaluate('e=>e.classList.contains("done")'):
            li.click()
    pg.wait_for_timeout(250)
    banner = pg.locator('.complete-banner').all_inner_texts()
    log('banner after full phase: %s' % banner)
    phase_complete_ok = any('Starting Engine complete' in x for x in banner)

    # back + check phase pct 100
    pg.click('button.btn.ghost:has-text("All phases")'); pg.wait_for_timeout(300)
    pcts = pg.locator('.phase-pct').all_inner_texts()
    log('phase pcts: %s' % pcts)
    pct_ok = len(pcts) >= 2 and pcts[1] == '100%'

    # complete EVERYTHING across all phases by fixed index
    for i in range(pg.locator('.phase-card').count()):
        pg.locator('.phase-card').nth(i).click(); pg.wait_for_timeout(200)
        for li in pg.locator('.chk li').all():
            if not li.evaluate('e=>e.classList.contains("done")'):
                li.click()
        pg.wait_for_timeout(150)
        pg.click('button.btn.ghost:has-text("All phases")'); pg.wait_for_timeout(250)
    final = pg.locator('.complete-banner').all_inner_texts()
    log('final banner: %s' % final)
    all_ok = any('STARTUP COMPLETE' in x for x in final)

    # reset clears
    if pg.locator('button.btn.ghost:has-text("Reset checklist")').count():
        pg.locator('button.btn.ghost:has-text("Reset checklist")').first.click(); pg.wait_for_timeout(200)
        reset_overall = itxt(pg, '.overall-txt')
        log('after reset: %s' % reset_overall)
        reset_ok = '0 /' in reset_overall
    else:
        reset_ok = False
        log('reset button missing')

    log('console errors: %d' % len(errs))
    if errs: log('ERR: '+str(errs[:3]))
    b.close()

    ok = phase_ok and start_ok and step_ok and tap_ok and phase_complete_ok and pct_ok and all_ok and reset_ok and not errs
    log('--- STARTUP TAB VERIFY: %s' % ('PASS' if ok else 'FAIL'))
    open(out,'w').write('\n'.join(L))
    print('--- written', out)
    sys.exit(0 if ok else 1)
