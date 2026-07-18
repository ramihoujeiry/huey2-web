from playwright.sync_api import sync_playwright
import os, sys

HTML = os.path.abspath('D:/HUEY2-web/index.html')
URL = f'file://{HTML}'

# Expected values computed independently from the published formulas:
# L1201: basic weight 5682, moment 836039
# PPC with fuel=1400, load=600 lbs, QNH=29.92 inHg, FAT=20, IA=0
#   PA = 0 + (29.92 - 29.92/1)*1000 = 0
#   DA = 0 + 120*(20 - (15 - 0)) = 120*5 = 600
#   maxTQ = min(Fat0(20),100) ; Fat0(20)=0.0095*400 -2.1571*20 +166.05 = 126.708 -> capped 100.0
EXPECTED = {
    'basic': '5682',
    'pa': '0',
    'da': '600',
    'maxTQ': '100.0',
}

fails = []
def check(name, got, want):
    ok = (str(got).strip() == str(want).strip())
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got='{got}' want='{want}'")
    if not ok: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    # mobile viewport (iPhone-ish)
    page = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('text=HUEY2', timeout=5000)
    check('app title present', page.locator('header.app h1').inner_text(), 'HUEY2 · UH-1 PERFORMANCE & BALANCE')

    # ---- PPC ----
    page.select_option('select:has(option[value="L1201"])', 'L1201')  # aircraft dropdown (first one = PPC)
    page.wait_for_timeout(150)
    check('PPC basic weight', page.locator('.result .val').first.inner_text(), EXPECTED['basic'])

    page.fill('input[type=number]', '1400')  # fuel (first number input)
    page.wait_for_timeout(80)
    # load field is 2nd number input in PPC
    page.locator('section:has-text("PPC") input[type=number]').nth(1).fill('600')
    page.wait_for_timeout(80)
    # QNH (3rd), FAT (4th), IA (5th)
    inp = page.locator('section:has-text("PPC") input[type=number]')
    inp.nth(2).fill('29.92'); inp.nth(3).fill('20'); inp.nth(4).fill('0')
    page.wait_for_timeout(250)

    results = page.locator('section:has-text("PPC") .result .val').all_inner_texts()
    # results order: basic, togw, pa, da, maxTQ, tq2, tq4, tq30, tq100
    def find(label_sub):
        labels = page.locator('section:has-text("PPC") .result .lab').all_inner_texts()
        for i, l in enumerate(labels):
            if label_sub.lower() in l.lower():
                return page.locator('section:has-text("PPC") .result .val').nth(i).inner_text()
        return None
    check('PPC pressure altitude', find('Pressure altitude'), EXPECTED['pa'])
    check('PPC density altitude', find('Density altitude'), EXPECTED['da'])
    check('PPC max TQ', find('Max TQ available'), EXPECTED['maxTQ'])
    tq2 = find('hover TQ @ 2 ft')
    check('PPC hover TQ 2ft populated', (tq2 is not None and tq2 not in ('—','')), 'True')

    # validation: fuel out of range
    inp.nth(0).fill('100')
    page.wait_for_timeout(150)
    err_visible = page.locator('section:has-text("PPC") .err').first.is_visible()
    check('PPC fuel out-of-range error shows', err_visible, True)
    inp.nth(0).fill('1400'); page.wait_for_timeout(100)

    page.screenshot(path='D:/HUEY2-web/shot_ppc.png', full_page=True)

    # ---- POWER ASSURANCE ----
    page.click('text=Power')
    page.wait_for_timeout(150)
    pa_in = page.locator('section:has-text("Power Assurance") input[type=number]')
    pa_in.nth(0).fill('29.92')   # QNH
    pa_in.nth(1).fill('20')      # FAT
    pa_in.nth(2).fill('0')       # IA
    pa_in.nth(3).fill('600')     # MGT
    pa_in.nth(4).fill('95')      # actual torque
    page.wait_for_timeout(250)
    pa_lab = page.locator('section:has-text("Power Assurance") .result .lab').all_inner_texts()
    pa_val = page.locator('section:has-text("Power Assurance") .result .val').all_inner_texts()
    def pa_find(sub):
        for i,l in enumerate(pa_lab):
            if sub.lower() in l.lower(): return pa_val[i]
        return None
    mrt = pa_find('Minimum required torque')
    diff = pa_find('Difference')
    check('PA MRT populated', (mrt not in (None,'—','')), 'True')
    check('PA diff populated', (diff not in (None,'—','')), 'True')
    page.screenshot(path='D:/HUEY2-web/shot_pa.png', full_page=True)

    # ---- W&B / FUEL ----
    page.click('text=W&B / Fuel')
    page.wait_for_timeout(150)
    cg_selects = page.locator('section:has-text("Weight & Balance") select')
    cg_selects.first.select_option('L1201')  # aircraft
    page.wait_for_timeout(150)
    cg_basic = page.locator('section:has-text("Weight & Balance") .result .val').first.inner_text()
    check('CG basic weight', cg_basic, EXPECTED['basic'])
    cg_in = page.locator('section:has-text("Weight & Balance") input[type=number]')
    cg_in.nth(0).fill('920')   # fuel
    cg_in.nth(1).fill('90')    # pilot1
    cg_in.nth(2).fill('90')    # pilot2
    cg_in.nth(3).fill('0')     # crew chief
    page.wait_for_timeout(250)
    cg_lab = page.locator('section:has-text("Weight & Balance") .result .lab').all_inner_texts()
    cg_val = page.locator('section:has-text("Weight & Balance") .result .val').all_inner_texts()
    def cg_find(sub):
        for i,l in enumerate(cg_lab):
            if sub.lower() in l.lower(): return cg_val[i]
        return None
    cg = cg_find('Calculated longitudinal CG')
    check('CG longitudinal computed', (cg not in (None,'—','Select an Aircraft')), 'True')
    page.screenshot(path='D:/HUEY2-web/shot_cg.png', full_page=True)

    # ---- CONVERTER ----
    page.click('text=Convert')
    page.wait_for_timeout(150)
    cv_in = page.locator('section:has-text("Pressure unit converter") input[type=number]')
    cv_in.fill('1013')
    page.wait_for_timeout(150)
    cv_out = page.locator('section:has-text("Pressure unit converter") .result .val').inner_text()
    # 1013 * 0.02953 = 29.91 inHg (approx)
    check('Converter 1013 hPa -> ~29.91 inHg', (cv_out.startswith('29.9')), 'True')
    page.screenshot(path='D:/HUEY2-web/shot_cv.png', full_page=True)

    if errors:
        print("\nBrowser console/page errors:")
        for e in errors: print("  -", e)
        # Vue dev warnings are acceptable; only fail on hard errors
        hard = [e for e in errors if 'Vue warn' not in e]
        if hard: fails.append('console_errors')

    b.close()

print(f"\nCONSOLE ERRORS: {errors}")
print(f"TOTAL FAILS: {len(fails)}")
sys.exit(1 if fails else 0)
