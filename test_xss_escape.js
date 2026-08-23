// Regression test for the XSS-escape fix (R1/R10).
// Asserts hlText()/boldStep() escape HTML in both the searched text and the term,
// so a payload like <img src=x onerror=alert(1)> renders inert.
// Run: node test_xss_escape.js
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// Pull the methods block containing esc/hlText/boldStep out of index.html
const start = html.indexOf('    /* Emergency / SOP helpers */');
if (start < 0) { console.error('FAIL: helpers marker not found'); process.exit(1); }
// Find "esc(" — if removed, the test must fail.
const snippet = html.slice(start, start + 4000);
const mEsc = /esc\(s\)\{[\s\S]*?\n    \},/.exec(snippet);
const mHl = /hlText\(text,term\)\{[\s\S]*?\n    \},/.exec(snippet);
const mBs = /boldStep\(s,q\)\{[\s\S]*?\n    \},/.exec(snippet);
if (!mEsc) { console.error('FAIL: esc() missing from index.html — XSS fix was removed'); process.exit(1); }
if (!mHl || !mBs) { console.error('FAIL: hlText/boldStep not found'); process.exit(1); }

const ctx = {};
vm.createContext(ctx);
vm.runInContext('var self=null; var methods={' + mEsc[0] + mHl[0] + mBs[0] + '};', ctx);
const M = vm.runInContext('methods', ctx);

const payload = '<img src=x onerror=alert(1)>';
let failures = 0;
function check(name, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!cond) failures++;
}

// 1. Payload as the searched TEXT renders escaped
const r1 = M.hlText(payload + ' ENGINE FAILURE', '');
check('hlText escapes < > & " \' when no term', r1 === '&lt;img src=x onerror=alert(1)&gt; ENGINE FAILURE');

// 2. Payload as the TERM cannot inject markup
const r2 = M.hlText('ENGINE FAILURE', payload);
check('hlText escapes malicious search term', !/[<]"?|onerror=alert/.test(r2.replace(/&lt;/g, '')) && !r2.includes('<img'));

// 3. boldStep output has no executable tag from a payload step text
const r3 = M.boldStep(payload, '');
check('boldStep escapes payload step text', !/<img/i.test(r3));

// 4. Normal highlighting still works
const r4 = M.hlText('ENGINE FAILURE', 'failure');
check('normal match highlighting still bolds via span.hl', /<span class="hl">FAILURE<\/span>/i.test(r4));

// 5. boldStep verb bolding still works with a normal query
const r5 = M.boldStep('Establish autorotation', 'auto');
check('boldStep still bolds verbs and highlights matches', /<b>Establish<\/b>/.test(r5) && /class="hl"/.test(r5));

// 6. All v-html sinks route through hlText/boldStep/known-safe computed props
const sinks = [...html.matchAll(/v-html="([^"]+)"/g)].map(m => m[1]);
const safe = new Set(['hlText(it.title,q)', 'boldStep(s,q)', 'boldStep(s,\'\')', 'hlText(r.item.title,uq)', 'cgSvg', 'briefText']);
for (const s of sinks) {
  const bare = s.trim();
  check('v-html sink routes through safe path: ' + bare, safe.has(bare));
}

if (failures) { console.error(failures + ' test(s) FAILED'); process.exit(1); }
console.log('All XSS-escape regression tests passed.');
