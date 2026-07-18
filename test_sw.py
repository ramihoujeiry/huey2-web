from playwright.sync_api import sync_playwright
import os
URL='https://ramihoujeiry.github.io/huey2-web/'
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':390,'height':844})
    pg=c.new_page()
    errs=[]
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until='networkidle'); pg.wait_for_selector('header.app h1', timeout=15000)
    # wait for service worker to register + activate new version
    pg.wait_for_timeout(2500)
    reg = pg.evaluate("""async () => {
      if(!('serviceWorker' in navigator)) return 'no-sw';
      const r = await navigator.serviceWorker.getRegistration();
      if(!r) return 'no-reg';
      return (r.active ? r.active.scriptURL.split('/').pop()+'|'+r.active.state : 'reg-no-active');
    }""")
    # confirm search box rendered (new version)
    has = pg.locator("section#sec-em input[type=search]").count()
    pg.click("button.tab-btn:has-text('Emergency')"); pg.wait_for_selector('#sec-em .list-btn')
    total0=pg.locator('#sec-em .list-btn').count()
    pg.fill('#sec-em input[type=search]','engine'); pg.wait_for_timeout(250)
    n=pg.locator('#sec-em .list-btn').count()
    print('SW active script/state:', reg)
    print('search box rendered:', has)
    print('list before/after engine:', total0, n, 'filtered=', n<total0)
    print('console errors:', len(errs), errs[:2])
    b.close()
