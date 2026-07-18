const fs = require('fs');
const { JSDOM } = require('jsdom');

// Use the vendored Vue build + the very index.html the user will ship.
const htmlPath = 'D:/HUEY2-web/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'file://' + htmlPath,
});
const { window } = dom;

// jsdom doesn't load external <script src> from file:// automatically unless resources:'usable'
// and the file is resolvable. Vue is referenced as vue.global.prod.js next to index.html.
// Wait for scripts to run, then inspect.
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async () => {
  // give Vue + app time to mount
  await wait(800);

  const doc = window.document;
  const app = window.document.querySelector('#app');
  const fails = [];
  const log = (name, got, want) => {
    const ok = String(got).trim() === String(want).trim();
    console.log(`[${ok?'PASS':'FAIL'}] ${name}: got='${got}' want='${want}'`);
    if(!ok) fails.push(name);
  };

  // Basic mount
  const h1 = doc.querySelector('header.app h1');
  log('app mounted (title)', h1 ? h1.textContent.trim() : '(none)', 'HUEY2 · UH-1 PERFORMANCE & BALANCE');

  // helper to set a number input and dispatch events Vue listens to
  function setNum(el, val){
    el.value = String(val);
    el.dispatchEvent(new window.Event('input', {bubbles:true}));
  }
  function setSel(el, val){
    el.value = val;
    el.dispatchEvent(new window.Event('change', {bubbles:true}));
  }

  // ---- PPC ----
  const ppc = doc.querySelector('section[v-show]'); // first section = PPC (v-show keeps it in DOM)
  // Vue uses v-show (display:none) not v-if, so all sections are in the DOM. Find PPC by its heading text.
  const sections = [...doc.querySelectorAll('section')];
  const ppcSec = sections.find(s => /PPC — Performance/.test(s.textContent));
  const paSec  = sections.find(s => /Power Assurance/.test(s.textContent));
  const cgSec  = sections.find(s => /Weight & Balance/.test(s.textContent));
  const cvSec  = sections.find(s => /Pressure unit converter/.test(s.textContent));

  log('PPC section present', !!ppcSec, 'true');
  log('PA section present', !!paSec, 'true');
  log('CG section present', !!cgSec, 'true');
  log('Converter section present', !!cvSec, 'true');

  if (ppcSec) {
    const sel = ppcSec.querySelector('select');
    setSel(sel, 'L1201');
    await wait(120);
    const basic = ppcSec.querySelector('.result .val').textContent.trim();
    log('PPC basic weight (L1201)', basic, '5682');

    const nums = ppcSec.querySelectorAll('input[type=number]');
    // order in PPC: fuel, load, qnh, fat, indicatedAltitude
    setNum(nums[0], 1400);  // fuel
    setNum(nums[1], 600);   // load
    setNum(nums[3], 20);    // fat  (index 2 is load unit select? no—units are selects, not number inputs)
    // recompute: number inputs are fuel, load, qnh, fat, IA -> 5 of them
    setNum(nums[2], 29.92); // qnh
    setNum(nums[3], 20);    // fat
    setNum(nums[4], 0);     // IA
    await wait(250);

    const labs = [...ppcSec.querySelectorAll('.result .lab')].map(e=>e.textContent.trim());
    const vals = [...ppcSec.querySelectorAll('.result .val')].map(e=>e.textContent.trim());
    const get = (sub) => vals[labs.findIndex(l=>l.toLowerCase().includes(sub.toLowerCase()))];
    log('PPC pressure altitude', get('Pressure altitude'), '0');
    log('PPC density altitude', get('Density altitude'), '600');
    log('PPC max TQ', get('Max TQ available'), '100.0');
    const tq2 = get('hover TQ @ 2 ft');
    log('PPC hover TQ 2ft computed', (tq2 && tq2!=='—'), 'true');

    // out-of-range fuel validation
    setNum(nums[0], 100);
    await wait(150);
    const err = ppcSec.querySelector('.err');
    log('PPC fuel error shows on out-of-range', err ? 'visible' : 'hidden', 'visible');
    setNum(nums[0], 1400); await wait(100);
  }

  // ---- PA ----
  if (paSec) {
    const nums = paSec.querySelectorAll('input[type=number]');
    // order: qnh, fat, ia, mgt, actual
    setNum(nums[0], 29.92);
    setNum(nums[1], 20);
    setNum(nums[2], 0);
    setNum(nums[3], 600);
    setNum(nums[4], 95);
    await wait(250);
    const labs = [...paSec.querySelectorAll('.result .lab')].map(e=>e.textContent.trim());
    const vals = [...paSec.querySelectorAll('.result .val')].map(e=>e.textContent.trim());
    const get = (sub) => vals[labs.findIndex(l=>l.toLowerCase().includes(sub.toLowerCase()))];
    log('PA MRT computed', (get('Minimum required torque') && get('Minimum required torque')!=='—'), 'true');
    log('PA diff computed', (get('Difference') && get('Difference')!=='—'), 'true');
  }

  // ---- CG ----
  if (cgSec) {
    const sel = cgSec.querySelector('select');
    setSel(sel, 'L1201');
    await wait(150);
    const basic = cgSec.querySelector('.result .val').textContent.trim();
    log('CG basic weight (L1201)', basic, '5682');
    const nums = cgSec.querySelectorAll('input[type=number]');
    // order: fuel, p1, p2, crew, tgt, m1, m2, mx  (8 inputs)
    setNum(nums[0], 920);
    setNum(nums[1], 90);
    setNum(nums[2], 90);
    setNum(nums[3], 0);
    setNum(nums[4], 140);  // desired CG
    setNum(nums[5], 90);
    setNum(nums[6], 90);
    setNum(nums[7], 0);
    await wait(250);
    const labs = [...cgSec.querySelectorAll('.result .lab')].map(e=>e.textContent.trim());
    const vals = [...cgSec.querySelectorAll('.result .val')].map(e=>e.textContent.trim());
    const get = (sub) => vals[labs.findIndex(l=>l.toLowerCase().includes(sub.toLowerCase()))];
    log('CG total weight computed', (get('Total weight') && get('Total weight')!=='—'), 'true');
    log('CG longitudinal CG computed', (get('Calculated longitudinal CG') && get('Calculated longitudinal CG')!=='Select an Aircraft'), 'true');
    log('CG min-fuel computed', (get('Maximum allowed fuel weight') && get('Maximum allowed fuel weight')!=='—'), 'true');
  }

  // ---- Converter ----
  if (cvSec) {
    const nums = cvSec.querySelectorAll('input[type=number]');
    setNum(nums[0], 1013);
    await wait(150);
    const out = cvSec.querySelector('.result .val').textContent.trim();
    log('Converter 1013 hPa -> ~29.9 inHg', out.startsWith('29.9'), 'true');
  }

  console.log(`\nTOTAL FAILS: ${fails.length}`);
  if (fails.length) { console.log('Failed:', fails.join(', ')); process.exit(1); }
  console.log('ALL UI CHECKS PASSED');
  process.exit(0);
})().catch(e => { console.error('TEST ERROR', e); process.exit(2); });
