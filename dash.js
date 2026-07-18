/* ===== Go/No-Go dashboard static reference limits ===== */
/* Sourced from BHT PUB-92-004-10 Ch 5 (Operating Limits & Restrictions). */
const DASH_LIMITS = [
  { label:'Max gross weight — internal', value:'10,500 lbs', src:'BHT 5-2' },
  { label:'Max gross weight — external', value:'11,200 lbs', src:'BHT 5-2' },
  { label:'Torque — 5 min (transient)', value:'100 %',       src:'BHT 5-3' },
  { label:'Torque — continuous',        value:'88 %',        src:'BHT 5-3' },
  { label:'Vne (never-exceed speed)',   value:'120 kts',     src:'BHT 5-4' },
  { label:'Max density altitude',       value:'14,000 ft',   src:'BHT 5-5' }
];
