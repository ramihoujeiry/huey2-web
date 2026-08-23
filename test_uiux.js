// Live UI/UX verification: ARIA tabs, keyboard nav, focus outline, responsive layout, busy state.
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/mcp/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  let fails = 0;
  const check = (n, c) => { console.log((c ? 'PASS' : 'FAIL') + ' - ' + n); if (!c) fails++; };

  for (const vp of [{width:390,height:844}, {width:768,height:1024}, {width:1280,height:800}]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });

    check(`[${vp.width}px] tablist role present`, await page.locator('[role="tablist"]').count() === 1);
    check(`[${vp.width}px] 12 tab buttons with aria-selected`, await page.locator('[role="tab"][aria-selected]').count() === 12);
    check(`[${vp.width}px] one tab selected initially`, await page.locator('[role="tab"][aria-selected="true"]').count() === 1);

    // keyboard nav: focus first tab, ArrowRight should move + activate next
    await page.locator('[role="tab"]').first().focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const activeText = await page.locator('[role="tab"][aria-selected="true"]').first().textContent();
    check(`[${vp.width}px] ArrowRight activates Power Assurance tab`, /Power Assurance/i.test(activeText));
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    check(`[${vp.width}px] End key activates Weather tab`, /Weather/i.test(await page.locator('[role="tab"][aria-selected="true"]').textContent()));

    // horizontal overflow check
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`[${vp.width}px] no horizontal overflow (${overflow}px)`, overflow <= 1);

    // focus-visible outline computed style on a tab
    const outline = await page.evaluate(() => {
      const b = document.querySelector('[role="tab"]');
      b.focus();
      return getComputedStyle(b).outlineWidth;
    });
    console.log(`[${vp.width}px] tab outline-width on focus: ${outline} (focus-visible may not trigger programmatically)`);

    // navigate through every tab and confirm each section renders content without errors
    for (const t of await page.locator('[role="tab"]').all()) {
      await t.click();
      await page.waitForTimeout(80);
    }
    check(`[${vp.width}px] no page errors after touring all 12 tabs`, errors.length === 0);
    if (errors.length) console.log(errors.join('\n'));
    await page.close();
  }

  // screenshot mobile viewport for record
  const p2 = await browser.newPage({ viewport: {width:390,height:844} });
  await p2.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });
  await p2.screenshot({ path: 'ux_mobile_390.png', fullPage: false });
  const p3 = await browser.newPage({ viewport: {width:1280,height:800} });
  await p3.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });
  await p3.screenshot({ path: 'ux_desktop_1280.png', fullPage: false });
  console.log('screenshots saved');

  await browser.close();
  process.exit(fails ? 1 : 0);
})();
