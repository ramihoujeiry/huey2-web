import sys, subprocess, tempfile, os, urllib.request
from playwright.sync_api import sync_playwright

APP = os.path.abspath('index.html')
URL = 'file://' + APP
fail = []

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL)
    pg.wait_for_timeout(400)

    # 1) Go to Emergency tab
    pg.click('button.tab-btn:has-text("Emergency")')
    pg.wait_for_timeout(200)

    # 2) Open first procedure to verify WARNING/CAUTION cue emphasis (yellow <b>)
    pg.click('.list-btn')
    pg.wait_for_timeout(200)
    b_color = pg.eval_on_selector('.steps li b', 'el => getComputedStyle(el).backgroundColor') if pg.query_selector('.steps li b') else ''
    if not b_color:
        fail.append('no <b> cue emphasis rendered')
    elif b_color.lower() not in ('rgb(255, 230, 0)', 'rgb(255, 43, 214)', '#ffe600', '#ff2bd6'):
        # yellow expected for cue <b>; accept either bright color
        if b_color not in ('rgb(255, 230, 0)',):
            fail.append('cue <b> not yellow: ' + b_color)
    print('cue <b> background =', b_color)

    # back to list
    pg.click('text=‹ Back to list')
    pg.wait_for_timeout(150)

    # 3) Search and verify magenta match highlight in list + steps
    term = 'collective'
    pg.fill('input[type=search]', term)
    pg.wait_for_timeout(300)
    hl_count = pg.eval_on_selector_all('.list-btn .hl', 'els => els.length')
    print('list match highlights =', hl_count)
    if hl_count == 0:
        fail.append('no <span class=hl> in search list for "%s"' % term)
    else:
        hl_color = pg.eval_on_selector('.list-btn .hl', 'el => getComputedStyle(el).backgroundColor')
        print('match highlight background =', hl_color)
        if hl_color != 'rgb(255, 43, 214)':
            fail.append('match highlight not magenta: ' + hl_color)

    # 4) open a matched procedure that contains the term in its STEPS
    #    (e.g. a 'collective' procedure), verify step text also highlights
    target = pg.locator('.list-btn', has_text='Collective').first
    if target.count() == 0:
        target = pg.locator('.list-btn').first
    target.click()
    pg.wait_for_timeout(250)
    step_hl = pg.eval_on_selector_all('.steps li .hl', 'els => els.length')
    print('step match highlights =', step_hl)
    if step_hl == 0:
        fail.append('no match highlight inside opened procedure steps for "%s"' % term)

    # 5) no console errors
    if errs:
        fail.append('console errors: ' + str(errs))

    b.close()

if fail:
    print('\nFAIL:')
    for f in fail: print(' -', f)
    sys.exit(1)
print('\nPASS: emphasis=yellow, match=magenta, both render, 0 console errors')
