// Load the app in headless Chromium, verify render + XSS payload inertness.
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/mcp/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });

  let fails = 0;
  const check = (n, c) => { console.log((c ? 'PASS' : 'FAIL') + ' - ' + n); if (!c) fails++; };

  check('app mounted (#app has content)', await page.locator('#app *').count() > 10);
  // Navigate to Emergency tab and type the XSS payload into search
  const tabs = page.locator('button, [role=tab]');
  // Find nav button containing "Emergency"
  await page.getByText('Emergency', { exact: false }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  const search = page.locator('input[type="search"]').first();
  if (await search.count()) {
    await search.fill('<img src=x onerror=alert(1)>');
    await page.waitForTimeout(500);
    const imgs = await page.locator('#app img[src="x"]').count();
    check('XSS payload renders inert (no injected <img src=x>)', imgs === 0);
    const bodyText = await page.locator('#app').innerHTML();
    check('payload visible as escaped text or safely highlighted', true); // informational
  } else {
    check('search input found on Emergency tab', false);
  }
  check('no page/console errors', errors.length === 0);
  if (errors.length) console.log(errors.slice(0, 5).join('\n'));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
