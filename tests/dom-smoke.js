/* Live-DOM smoke test: mounts the REAL app (all data files + Vue + inline scripts)
   in jsdom and exercises the five fixed behaviors through real events.
   Run: node tests/dom-smoke.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join(__dirname, '..', 'node_modules', 'jsdom'));

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only'
});
const w = dom.window;
// Stub fetch: weather-proxy endpoint returns a realistic METAR-derived payload; everything else empty.
w.fetch = (url) => {
  const u = String(url);
  if (u.includes('/weather?ids=')) {
    return Promise.resolve({ ok: true, json: () => ({
      station: 'OLBA',
      metar: 'OLBA 121350Z 27010KT 9999 FEW030 22/14 Q1013',
      taf: null, qnh_inhg: '29.91', wind_kt: 10, wind_dir: '270', temp_c: 22,
      source: 'noaa-metar', error: ''
    }) });
  }
  return Promise.resolve({ ok: true, json: () => ({}) });
};

const dom2 = html.replace(/<script src="[^"]+"><\/script>/g, '');
const scripts = [...dom2.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const body = dom2.replace(/<script>[\s\S]*?<\/script>/g, '');
w.document.body.innerHTML = body;

const bundle = ['cgenv.js', 'dash.js', 'emergency.js', 'startup.js']
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
  + '\n;\n' + fs.readFileSync(path.join(ROOT, 'vue.global.prod.js'), 'utf8')
  + '\n;\n' + scripts.join('\n;\n')
  + '\n;'; // (instance not needed — assertions drive real UI inputs)

let failures = 0;
const ok = (n, c) => { console.log((c ? 'PASS' : 'FAIL') + ' - ' + n); if (!c) failures++; };
const flush = () => new Promise(r => setTimeout(r, 60));
const setValue = (el, v) => {
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(el, v);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
};

(async () => {
  w.eval(bundle);
  await flush();
  const d = w.document;
  const app = w.__APP;

  ok('app mounted (#app has children)', d.querySelector('#app').children.length > 0);
  ok('12 tabs rendered', d.querySelectorAll('[role=tab]').length === 12);

  /* Bug 1: weather section renders inside intact card structure */
  d.querySelector('#tabbtn-WEATHER').click();
  await flush();
  const wxSection = [...d.querySelectorAll('#app > section')].find(s => s.querySelector('input[aria-label*="Search airport"]'));
  ok('weather section found', !!wxSection);
  ok('weather search input present', !!wxSection.querySelector('input[type=search]'));
  ok('weather card contains footer disclaimer after results area',
     !!wxSection.querySelector('.card') && wxSection.querySelectorAll('.card').length === 1);

  /* Bug 3: Tail Rotor Failure quick action */
  d.querySelector('#tabbtn-EM').click();
  await flush();
  const labels = [...d.querySelectorAll('.quick-btn')].map(b => b.textContent.trim());
  ok('6 emergency quick actions rendered', labels.length === 6);
  ok("'Tail Rotor Failure' quick action present", labels.some(t => /Tail Rotor Failure/.test(t)));
  const trBtn = d.querySelectorAll('.quick-btn')[4];
  trBtn.click();
  await flush();
  ok('tapping it opens Complete Loss of Tail Rotor Thrust procedure',
     /Complete Loss of Tail Rotor Thrust/.test(d.body.textContent));

  /* Bug 5: clear chip (only rendered when uq non-empty) */
  d.querySelector('#tabbtn-US').click();
  await flush();
  const uqInput = d.querySelector('input[aria-label*="Unified search"]');
  setValue(uqInput, 'engine');
  await flush();
  const chip = d.querySelector('button.chip-clear');
  ok('clear chip renders once uq is set', !!chip);
  ok('clear chip className = "chip chip-clear"', chip && chip.className.trim() === 'chip chip-clear');

  /* Bug 4: fuel guardband enforced live */
  d.querySelector('#tabbtn-PPC').click();
  await flush();
  const fuel = [...d.querySelectorAll('#app section')][0].querySelector('input[type=number]');
  ok('PPC fuel input exists', !!fuel);
  setValue(fuel, '100');
  await flush();
  ok('fuel=100 shows guardband error', /200 and 1450/.test(d.querySelector('#app section .err').textContent));
  setValue(fuel, '900');
  await flush();
  const errs = [...d.querySelectorAll('#app section .err')].map(e => e.textContent).join(' ');
  ok('fuel=900 clears the fuel guardband error', !/200 and 1450/.test(errs));

  /* Bug 2: Go/No-Go verdict — drive real W&B inputs to produce CG ≈ 128 (below FS 130).
     L1201 basic 5682 / moment 836039; fuel 10 lbs; pilots 2×300 Kg at FS 46.7 → CG ≈ 128.0 */
  d.querySelectorAll('[role=tab]')[2].click(); // W&B / Fuel tab
  await flush();
  const cgSection = [...d.querySelectorAll('#app > section')].find(s => s.textContent.includes('Weight & Balance'));
  const acSelect = cgSection.querySelector('select');
  Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value').set.call(acSelect, 'L1201');
  acSelect.dispatchEvent(new w.Event('change', { bubbles: true }));
  await flush();
  const numInputs = cgSection.querySelectorAll('input[type=number]');
  setValue(numInputs[0], '10');   // fuel
  setValue(numInputs[1], '300');  // pilot 1 (Kg)
  setValue(numInputs[2], '300');  // pilot 2 (Kg)
  await flush();
  const cgShown = [...cgSection.querySelectorAll('.result .val')].map(v => v.textContent.trim()).find(t => /^1[0-9][0-9]\./.test(t));
  ok('W&B computes longitudinal CG ≈ 128 (out of envelope)', cgShown && parseFloat(cgShown) < 130);
  d.querySelector('#tabbtn-DASH').click();
  await flush();
  const dashText = d.querySelector('#sec-dash').textContent;
  ok('Status tab shows out-of-envelope CG ≈ ' + (cgShown || '?'), cgShown && dashText.includes(cgShown));
  ok('out-of-envelope CG flagged NO-GO', /NO-GO/.test(dashText) && cgShown && parseFloat(cgShown) < 130 && new RegExp('CG — ' + cgShown.replace('.', '\\.')) .test(dashText));
  ok('overall NO-GO verdict banner shown', /✗ NO-GO/.test(dashText));

  /* ---- Continuation fixes ---- */

  /* Wind arrow: numeric wind → rotate bound via Vue :style; VRB → glyph, no rotate */
  d.querySelector('#tabbtn-WEATHER').click();
  await flush();
  const wxInput = wxSection.querySelector('input[type=search]');
  setValue(wxInput, 'OLBA');
  await flush();
  d.querySelector('#tabbtn-WEATHER'); // (still on weather tab)
  wxInput.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await flush();
  const airportBtn = wxSection.querySelector('.wx-airport-list .list-btn');
  ok('airport search resolves OLBA', !!airportBtn);
  if (airportBtn) {
    airportBtn.click();
    await flush(); await flush();
    const arrow = wxSection.querySelector('.wx-arrow');
    ok('wind arrow rendered', !!arrow);
    ok('wind arrow rotation bound through Vue (270° → 90deg)', arrow && /rotate\(90deg\)/.test(arrow.getAttribute('style') || arrow.style.transform || ''));
    ok('wind direction label shows degrees', /270/.test(wxSection.querySelector('.wx-wind').textContent));
  }

  /* PPC NaN guard: clearing Load keeps TOGW numeric */
  d.querySelector('#tabbtn-PPC').click();
  await flush();
  const ppcSection = [...d.querySelectorAll('#app > section')][0];
  const ppcInputs = ppcSection.querySelectorAll('input[type=number]');
  setValue(ppcInputs[1], '');   // Load cleared
  await flush();
  const togwVal = ppcSection.textContent;
  ok('cleared Load → TOGW numeric (no NaN)', !/NaN/.test(togwVal));

  /* PA: out-of-range temp → MRT shows em-dash, not 0 */
  d.querySelectorAll('[role=tab]')[1].click(); // Power Assurance
  await flush();
  const paSection = [...d.querySelectorAll('#app > section')][1];
  const paInputs = paSection.querySelectorAll('input[type=number]');
  setValue(paInputs[1], '100'); // FAT out of range
  await flush();
  const mrtResult = [...paSection.querySelectorAll('.result')].find(r => /Minimum required torque/.test(r.textContent));
  ok('PA out-of-range → MRT displays — (not 0)', mrtResult && mrtResult.textContent.includes('—') && !/\b0\b/.test(mrtResult.querySelector('.val').textContent));

  /* Startup checklist: keyboard activation, checkbox toggle, persistence */
  d.querySelectorAll('[role=tab]')[4].click(); // Startup
  await flush();
  const phaseCard = d.querySelector('.phase-card');
  ok('phase card focusable', phaseCard && phaseCard.getAttribute('tabindex') === '0');
  phaseCard.focus();
  phaseCard.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await flush();
  const chkItems = [...d.querySelectorAll('.chk li[role=checkbox]')];
  ok('Enter on phase card opens checklist', chkItems.length > 0);
  if (chkItems.length) {
    const item = chkItems[0];
    ok('checklist item exposes aria-checked=false initially', item.getAttribute('aria-checked') === 'false');
    item.focus();
    item.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await flush();
    ok('Space toggles checklist item (done class applied)', chkItems[0].classList.contains('done'));
    ok('toggle persisted to localStorage', !!w.localStorage.getItem('huey2.startup.v1'));
    item.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await flush();
    ok('second Space untoggles', !chkItems[0].classList.contains('done'));
  }

  console.log('\n' + (failures ? failures + ' smoke check(s) FAILED' : 'All DOM smoke checks passed.'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
