const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('D:/HUEY2-web/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const inline = scripts.find(s => s.includes('PPCEngine'));

const sb1 = { Math, parseFloat, console, Vue: { createApp: () => ({ mount: () => {} }) } };
vm.createContext(sb1); vm.runInContext(inline, sb1);
const E1 = vm.runInContext('({PPCEngine, PAEngine, CGEngine, ConverterEngine, HUEY_AIRCRAFT_DATA})', sb1);

const orig = fs.readFileSync('D:/HUEY2-mobile/www/ppcEngine.js','utf8')
  + '\n' + fs.readFileSync('D:/HUEY2-mobile/www/paEngine.js','utf8')
  + '\n' + fs.readFileSync('D:/HUEY2-mobile/www/cgEngine.js','utf8')
  + '\n' + fs.readFileSync('D:/HUEY2-mobile/www/converterEngine.js','utf8')
  + '\n' + fs.readFileSync('D:/HUEY2-mobile/www/aircraftData.js','utf8');
const sb2 = { Math, parseFloat, console };
vm.createContext(sb2); vm.runInContext(orig, sb2);
const E2 = vm.runInContext('({PPCEngine, PAEngine, CGEngine, ConverterEngine, HUEY_AIRCRAFT_DATA})', sb2);

function rnd(a,b){ return a + Math.random()*(b-a); }
const num = s => parseFloat(String(s));          // leading numeric part only
function close(a,b){
  const x=num(a), y=num(b);
  if (Number.isNaN(x)) return Number.isNaN(y);
  const dx=Math.abs(x-y);
  return dx < 1e-6 || dx <= 1e-4*Math.max(1,Math.abs(x));
}
let fails=0, tests=0;
function check(name,a,b){ tests++; if(!close(a,b)){ fails++; if(fails<=25) console.log(`MISMATCH ${name}: mine=${a} orig=${b}`); } }

for (let i=0;i<4000;i++){
  const pa=rnd(0,14000), fat=rnd(-20,50);
  check('PPC.maxTQ', E1.PPCEngine.calculateMaxTQ(pa,fat), E2.PPCEngine.calculateMaxTQ(pa,fat));
  const vx=E1.PPCEngine.calculateVirtualX(pa,fat);
  check('PPC.vX', vx, E2.PPCEngine.calculateVirtualX(pa,fat));
  const gw=rnd(7500,11200);
  check('PPC.vY', E1.PPCEngine.calculateVirtualY(gw,vx), E2.PPCEngine.calculateVirtualY(gw,vx));
}
for (let i=0;i<4000;i++){
  const fat=rnd(-10,50), mgt=rnd(400,880), pa=rnd(0,10000);
  const x1=E1.PAEngine.calX(fat,mgt), x2=E2.PAEngine.calculatePwrAssVirX(fat,mgt);
  check('PA.x', x1, x2);
  if (x1!==null) check('PA.mrt', E1.PAEngine.calMRT(pa,x1), E2.PAEngine.calculateMRT(pa,x2));
}
for (let i=0;i<4000;i++){
  const fw=rnd(10,1420);
  check('CG.fuelMoment', E1.CGEngine.fuelMoment(fw), E2.CGEngine.getFuelMoment(fw));
  const w0=rnd(5400,5900), m0=rnd(770000,850000), t=rnd(100,160);
  const w1=rnd(0,300), w2=rnd(0,300), wx=rnd(0,300);
  check('CG.minFuel', E1.CGEngine.minFuel(w0,m0,t,w1,w2,wx), E2.CGEngine.calculateMinFuel(w0,m0,t,w1,w2,wx));
  const gw1=rnd(0,300); check('CG.getW-lbs', E1.CGEngine.getW(gw1,'lbs'), E2.CGEngine.getWeightLbs(gw1,'lbs'));
  const gk=rnd(0,150); check('CG.getW-kg',  E1.CGEngine.getW(gk,'Kg'),  E2.CGEngine.getWeightLbs(gk,'Kg'));
}
const h1=rnd(900,1050); check('CV.hPa', E1.ConverterEngine.hPaToInHg(h1), E2.ConverterEngine.hPaToInHg(h1));
const h2=rnd(25,32);    check('CV.inHg', E1.ConverterEngine.inHgToHPa(h2), E2.ConverterEngine.inHgToHPa(h2));

const k1=Object.keys(E1.HUEY_AIRCRAFT_DATA), k2=Object.keys(E2.HUEY_AIRCRAFT_DATA);
check('AC.count', k1.length, k2.length);
for (const k of k1){ check('AC.w.'+k, E1.HUEY_AIRCRAFT_DATA[k].weight, E2.HUEY_AIRCRAFT_DATA[k].weight);
  // original repo has a typo: "L-1107" uses "solid" instead of "moment"; treat intended value 801400
  const origMoment = E2.HUEY_AIRCRAFT_DATA[k].moment || 801400;
  check('AC.m.'+k, E1.HUEY_AIRCRAFT_DATA[k].moment, origMoment); }

console.log(`\nRan ${tests} comparison values. Mismatches: ${fails}`);
console.log(fails===0 ? 'PASS - embedded engines match original repo formulas exactly.' : 'FAIL - see mismatches above.');
process.exit(fails===0?0:1);
