from playwright.sync_api import sync_playwright
import os, subprocess, sys, time
HERE='D:/HUEY2-web'; BASE='http://127.0.0.1:8137'
fails=[]
def check(n,g,w):
    ok=(g==w); print(f"[{'PASS' if ok else 'FAIL'}] {n}: {g!r}")
    if not ok: fails.append(n)

srv=subprocess.Popen(['py','serve.py'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.5)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE+'/index.html', wait_until='networkidle'); pg.wait_for_selector('header.app h1')

    # Task 1: bold verbs
    pg.click("button.tab-btn:has-text('Emergency')")
    pg.wait_for_selector('#sec-em .list-btn')
    pg.fill('#sec-em input[type=search]','engine failure'); pg.wait_for_timeout(200)
    pg.click('#sec-em .list-btn')
    pg.wait_for_selector('#sec-em ol.steps li')
    check('step1 bold verb', '<b>' in pg.locator('#sec-em ol.steps li').first.inner_html(), True)

    # Task 5: converter
    pg.click("button.tab-btn:has-text('Convert')"); pg.wait_for_selector('#sec-cv')
    def conv(cat,frm,to,val):
        pg.select_option('#sec-cv select[name=cvcat]', label=cat); pg.wait_for_timeout(120)
        pg.select_option('#sec-cv select[name=cvfrom]', label=frm)
        pg.select_option('#sec-cv select[name=cvto]', label=to)
        pg.fill('#sec-cv input[type=number]', str(val)); pg.wait_for_timeout(150)
        return pg.locator('#sec-cv .result .val').inner_text()
    def num(s): return float(s.split()[0])
    check('pressure 1013 hPa->inHg~29.9', abs(num(conv('Pressure','hPa','inHg',1013))-29.92)<0.1, True)
    check('temp 100C->212F', abs(num(conv('Temperature','°C','°F',100))-212)<0.5, True)
    check('temp 0C->273.15K', abs(num(conv('Temperature','°C','K',0))-273.15)<0.1, True)
    check('weight 2204.62lbs->1000Kg', abs(num(conv('Weight','lbs','Kg',2204.62))-1000)<1, True)
    check('dist 1NM->1.852km', abs(num(conv('Distance','NM','km',1))-1.852)<0.01, True)
    check('dist 1000m->3280.8ft', abs(num(conv('Distance','m','ft',1000))-3280.84)<1, True)

    check('console errors', len(errs), 0)
    if errs: print('ERRS', errs[:3])
    b.close()
srv.terminate()
print('\nFAILS:', fails if fails else 'NONE')
sys.exit(1 if fails else 0)
