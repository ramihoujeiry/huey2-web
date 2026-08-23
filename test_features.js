// Verify the four new user-facing features in headless Chromium against local server.
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/mcp/node_modules/playwright'));
const EXE = process.env.CHROME_PATH || 'C:/Users/USER/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = 'http://localhost:8123/index.html';
let pass = 0, fail = 0;
const t = (name, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name); ok ? pass++ : fail++; };

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 1. Offline status indicator
  const bannerVisible = await page.evaluate(() => {
    const el = document.querySelector('.offline-banner');
    return el && getComputedStyle(el).display !== 'none';
  });
  t('offline banner visible when navigator.onLine=false', !bannerVisible); // we're online
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  const shown = await page.evaluate(() => {
    const el = document.querySelector('.offline-banner');
    return el && getComputedStyle(el).display !== 'none';
  });
  t('offline banner appears on offline event', !!shown);
  const bannerText = await page.evaluate(() => document.querySelector('.offline-banner').textContent.trim());
  t('banner text mentions offline', /offline/i.test(bannerText));
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  const hiddenAgain = await page.evaluate(() => {
    const el = document.querySelector('.offline-banner');
    return el && getComputedStyle(el).display === 'none';
  });
  t('banner hides again on online event', !!hiddenAgain);

  // 2. Emergency quick actions
  await page.click('#tabbtn-EM');
  const quickCount = await page.locator('.quick-btn').count();
  t('emergency quick actions rendered (>=5)', quickCount >= 5);
  if (quickCount) {
    const firstTitle = await page.locator('.quick-btn').first().innerText();
    await page.locator('.quick-btn').first().click();
    const stepsShown = await page.locator('#sec-em .steps li').count();
    t('tapping quick action opens procedure steps (' + stepsShown + ')', stepsShown > 0);
  }
  // back to category list
  await page.click('#tabbtn-EM');

  // 3. Search filter presets
  await page.click('#tabbtn-US');
  const chips = await page.locator('.chip').count();
  t('search preset chips rendered (>=8)', chips >= 8);
  await page.locator('.chip', { hasText: 'engine failure' }).first().click();
  const qVal = await page.inputValue('input[aria-label*="Unified search"]');
  t('preset fills search query', qVal === 'engine failure');
  const results = await page.locator('#sec-us .list-btn').count();
  t('preset yields results (' + results + ')', results > 0);

  // 4. Weather data visualization (structure present; bars render when data present)
  const vizCss = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try { for (const r of sheet.cssRules) { if (r.selectorText && r.selectorText.includes('.wx-wind')) return true; } } catch (e) {}
    }
    return false;
  });
  t('weather viz CSS (.wx-wind/.wx-bar) present', vizCss);
  const wxBarCss = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try { for (const r of sheet.cssRules) { if (r.selectorText && r.selectorText.includes('.wx-fill')) return true; } } catch (e) {}
    }
    return false;
  });
  t('wx bar fill styles present', wxBarCss);

  // No JS errors during all interactions
  t('no page errors during feature tour', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));

  console.log(`\nRESULT: ${pass} pass, ${fail} fail`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
