/* Regression tests for the five bug fixes:
   1. Weather-tab div nesting balanced
   2. Go/No-Go CG envelope = FS 130–144
   3. 'Tail Rotor Failure' quick action resolves id 'trtotal'
   4. validateFuel() wired to the PPC fuel input
   5. Clear chip has a single merged class="chip chip-clear"
   Runs the REAL inline app script in a VM with a Vue stub — no browser needed.
   Run: node tests/bugfix-regression.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let failures = 0;
const check = (name, cond) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!cond) failures++;
};

/* ---------- Run the real app in a VM ---------- */
const ctx = {
  console,
  navigator: { onLine: true },
  window: { addEventListener() {} },
  document: { querySelectorAll: () => [], querySelector: () => null },
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
  Vue: { createApp: (opts) => { ctx.__app = opts; return { mount() {} }; } }
};
vm.createContext(ctx);
for (const f of ['cgenv.js', 'dash.js', 'emergency.js', 'startup.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!inlineScripts.some(s => s.includes('Vue.createApp'))) {
  console.error('FATAL: inline app script not found'); process.exit(1);
}
// Run every inline script in document order (weather block defines WEATHER_STATE/WeatherFetcher).
inlineScripts.forEach((s, i) => vm.runInContext(s, ctx, { filename: 'inline-' + i }));
const app = ctx.__app;

/* ---------- Build a reactive-ish instance state ---------- */
const state = app.data();

/* --- Bug 2: CG envelope 130–144 --- */
function goItemForCg(cgVal) {
  state.cg.ac = 'L1201';
  state.cg.cg = cgVal;
  state.cg.tgt = 140;
  state.cg.minFuel = '920 lbs';
  state.ppc.maxTQ = '95.0';
  state.pa.diff = null;
  return app.computed.goItems.call(state).find(it => it.label.startsWith('CG'));
}
const cgLow = goItemForCg('120.00');   // below FS 130 → must be NO-GO
const cgOk = goItemForCg('135.00');    // inside 130–144 → GO
const cgAft = goItemForCg('146.00');   // above FS 144 → NO-GO
check('CG 120 flagged NO-GO (was wrongly GO with old 100–140 band)', cgLow.status === 'bad');
check('CG 135 flagged GO', cgOk.status === 'ok');
check('CG 146 flagged NO-GO', cgAft.status === 'bad');
check('source now uses 130/144 bounds', /cgNum<130 \|\| cgNum>144/.test(html) && !/cgNum<100 \|\| cgNum>140/.test(html));

/* --- Bug 3: Tail Rotor Failure quick action --- */
const quick = app.computed.emQuickActions.call(state);
check('six emergency quick actions defined', quick.length === 6);
check("quick actions include item with id 'trtotal'", quick.some(q => q.item && q.item.id === 'trtotal'));
check("no quick action references dead id 'tail'", !quick.some(q => q.id === 'tail'));

/* --- Bug 4: fuel guardband wired + active --- */
check('fuel input binds @input to validateFuel', /v-model\.number="ppc\.fuel" @input="validateFuel"/.test(html));
check('PPC fuel input no longer calls ppcCalc directly', !/v-model\.number="ppc\.fuel" @input="ppcCalc"/.test(html));
check('validateFuel method exists', typeof app.methods.validateFuel === 'function');
// Vue binds all methods onto the instance; simulate that by merging methods into state.
const inst = Object.assign({}, state, app.methods);
state.ppc.fuel = 100;                       // below 200 lbs floor
app.methods.validateFuel.call(inst);
check('validateFuel flags 100 lbs as out of guardband', /200 and 1450/.test(state.ppc.fuelErr || ''));
state.ppc.fuel = 1500;                      // above 1450 lbs ceiling
app.methods.validateFuel.call(inst);
check('validateFuel flags 1500 lbs as out of guardband', /200 and 1450/.test(state.ppc.fuelErr || ''));
state.ppc.fuel = 900;
app.methods.validateFuel.call(inst);
check('validateFuel clears error for 900 lbs', state.ppc.fuelErr === '');

/* --- Bug 5: clear chip single class attribute --- */
const chipTag = (html.match(/<button[^>]*chip-clear[^>]*>/) || [''])[0];
check('clear chip tag found', chipTag.length > 0);
check('clear chip has exactly one class attribute', (chipTag.match(/class=/g) || []).length === 1);
check('clear chip merges both classes: class="chip chip-clear"', /class="chip chip-clear"/.test(chipTag));

/* --- Bug 1: weather section div nesting balanced --- */
const wStart = html.indexOf('<!-- ================= WEATHER');
const wEnd = html.indexOf('</section>', wStart);
const weather = html.slice(wStart, wEnd);
const opens = (weather.match(/<div[\s>]/g) || []).length;
const closes = (weather.match(/<\/div[\s>]/g) || []).length;
check(`weather section div open/close balanced (${opens}/${closes})`, opens === closes && opens > 0);

/* whole app template div balance (weather was the only offender) */
const tStart = html.indexOf('<div id="app"');
const tEnd = html.indexOf('<script src="vue.global.prod.js"');
const tmpl = html.slice(tStart, tEnd);
const tOpens = (tmpl.match(/<div[\s>]/g) || []).length;
const tCloses = (tmpl.match(/<\/div[\s>]/g) || []).length;
check(`whole template div balance (${tOpens}/${tCloses})`, tOpens === tCloses);

/* ---------- Continuation fixes ---------- */
const inst2 = Object.assign({}, state, app.methods);

/* --- wind arrow rotation (VRB-safe) --- */
check('wxWindRotate computed defined', typeof app.computed.wxWindRotate === 'function');
state.weather.windDir = 270;
check('wxWindRotate 270 → 90 (arrow points from wind toward heading)', app.computed.wxWindRotate.call(state) === 90);
state.weather.windDir = 'VRB';
check('wxWindRotate VRB → null (no invalid rotate())', app.computed.wxWindRotate.call(state) === null);
check('template binds wx-arrow via :style (Vue-interpolated)', /class="wx-arrow" v-if="wxWindRotate !== null" :style=/.test(html));
check('template no longer uses un-interpolated {{}} inside style attr', !/style="[^"]*\{\{/.test(html));

/* --- PPC NaN guard --- */
state.ppc.load = ''; state.ppc.ac = '';
app.methods.ppcCalc.call(inst2);
check('cleared Load no longer produces NaN TOGW', !/NaN/.test(String(state.ppc.togw)));
check('NaN guard present in ppcCalc', /loadLbs = isNaN\(rawLoad\) \? 0 : rawLoad/.test(html));

/* --- PA em-dash instead of 0 --- */
state.pa.fat = 100;
app.methods.paTemp.call(inst2);
check('PA out-of-range temp → mrt null (displays —, was 0)', state.pa.mrt === null && /between -20 and 50/.test(state.pa.tempErr));
check('PA sources use null for out-of-range mrt/diff', (html.match(/a\.mrt=a\.diff=null/g) || []).length >= 3);

/* --- checklist persistence (methods) --- */
state.done = {};
app.methods.toggleStep.call(inst2, 'pre', 0);
const savedRaw = ctx.localStorage.getItem('huey2.startup.v1');
check('toggleStep persists progress to localStorage', !!savedRaw && JSON.parse(savedRaw).done['pre:0'] === true);
app.methods.resetChecks.call(inst2);
check('resetChecks clears persisted progress', Object.keys(JSON.parse(ctx.localStorage.getItem('huey2.startup.v1')).done).length === 0);

/* --- checklist persistence (restore paths, fresh VM each) --- */
function freshApp(storageData) {
  const c2 = {
    console, navigator: { onLine: true }, window: { addEventListener() {} },
    document: { querySelectorAll: () => [], querySelector: () => null },
    localStorage: { _d: storageData || {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
    Vue: { createApp: (opts) => { c2.__app = opts; return { mount() {} }; } }
  };
  vm.createContext(c2);
  for (const f of ['cgenv.js', 'dash.js', 'emergency.js', 'startup.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c2, { filename: f });
  inlineScripts.forEach((s, i) => vm.runInContext(s, c2, { filename: 'r2-' + i }));
  return c2.__app;
}
const seeded = freshApp({ 'huey2.startup.v1': JSON.stringify({ v: 1, done: { 'pre:0': true } }) });
check('checklist progress restored from localStorage on load', seeded.data().done['pre:0'] === true);
const futureSchema = freshApp({ 'huey2.startup.v1': JSON.stringify({ v: 99, done: { 'pre:0': true } }) });
check('future-schema progress ignored (version guard)', Object.keys(futureSchema.data().done).length === 0);
const junk = freshApp({ 'huey2.startup.v1': 'not-json{{' });
check('corrupt progress ignored without crashing', Object.keys(junk.data().done).length === 0);

/* --- keyboard accessibility wiring --- */
check('phase cards keyboard-activatable (role=button + tabindex + Enter/Space)',
  /role="button" tabindex="0"\s+@click="phaseSel=p\.id" @keydown\.enter\.prevent="phaseSel=p\.id" @keydown\.space\.prevent="phaseSel=p\.id"/.test(html.replace(/\n\s+/g, ' ')));
check('checklist items are ARIA checkboxes with keyboard toggle',
  /role="checkbox" :aria-checked="isDone\(currentPhase\.id,i\)" tabindex="0"/.test(html.replace(/\n\s+/g, ' ')));

console.log('\n' + (failures ? failures + ' test(s) FAILED' : 'All bugfix regression tests passed.'));
process.exit(failures ? 1 : 0);
