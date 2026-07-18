/* ============================================================
   HUEY2 — Normal Procedures: Engine Startup Checklist
   Interactive, tap-to-complete. Sourced verbatim from:
     BHT PUB-92-004-10 Ch 8 (Normal Procedures)
       8-21 BEFORE STARTING ENGINE
       8-22 STARTING ENGINE
       8-23 ENGINE RUNUP
       8-24 BEFORE TAKEOFF
     + Squadron SOP Training Guide (L/M/N/P) additions
   Steps are broken into tappable lines; callouts kept as
   WARNING / CAUTION / NOTE tags (bolded by boldStep()).
   ============================================================ */
const STARTUP_DATA = [
  {
    id: 'before-start',
    title: 'Before Starting Engine',
    src: 'BHT 8-21',
    steps: [
      'Seats, belt and pedals — Adjust.',
      'Seat belts and shoulder harness — Fasten and tighten.',
      'Shoulder harness locks — Check operation and leave unlocked.',
      'Control frictions and lock — OFF. Set friction as desired.',
      'Flight controls — Check for full travel. Center cyclic and pedals. Place collective full-down.',
      '(O) NVG Position Lights — As required.',
      'CABIN HEATING switches — OFF.',
      'CARGO REL switch — OFF.',
      'WIPERS switch — OFF.',
      'ANTI COLL switch — ON.',
      'POSITION lights switches — As required; STEADY or FLASH for night; OFF for day.',
      '(O) DOME LT switch — As required.',
      'PITOT HTR switch — OFF.',
      'DC circuit breakers — In except for special equipment.',
      'INST LTG switches — As required.',
      '(O) PHASE switch — AC.',
      'INVTR switch — OFF.',
      'MAIN GEN switch — ON and cover down.',
      'VM selector — ESS BUS.',
      'NON-ESS BUS switch — As required.',
      'START GEN switch — START.',
      'BAT switch — ON.',
      '(O) ROTOR BRAKE — Released (check light).',
      'Free air temperature (FAT) gage — Check FAT and condition.',
      'Avionics equipment — OFF; set on desired frequencies.',
      'Ground power unit (GPU) — Connect for GPU start.',
      'FIRE WARNING indicator light — Test (15 seconds maximum).',
      '(O) BAGGAGE FIRE/DOOR TEST (if installed) — Test. This also tests ENG OIL FILTER indicator light.',
      'RPM warning light — Check illuminated.',
      'Press to test CAUTION/WARNING lights — Check IFF Mode 4 and CODE HOLD, CARGO RELEASE and MARKER BEACON press-to-test lights.',
      'System instruments — Check fuel, engine, transmission and electrical systems for static indications, slippage marks and ranges.',
      'Avionics equipment — OFF; set as desired.',
      'External stores jettison handle — Check safetied.',
      'GOV AUTO/EMER switch — AUTO.',
      'DE-ICE and BLEED AIR switches — OFF.',
      'MAIN FUEL switch — ON.',
      'START FUEL switch — ON.',
      'AUX fuel switches — OFF.',
      'CAUTION panel lights — TEST and RESET.',
      'HYD CONT switch — ON.',
      'FORCE TRIM switch — ON.',
      'HOIST CABLE CUT cover — DOWN; safetied.',
      'CHIP DET switch — BOTH.',
      'COMPASS switch — As required. MAG for normal operation.',
      'Clock — Wound and running.',
      'Altimeters — Set to field elevation.'
    ]
  },
  {
    id: 'start-engine',
    title: 'Starting Engine',
    src: 'BHT 8-22',
    steps: [
      'CAUTION: If the engine has been motored with throttle open and igniters not energized, or may be flooded — set throttle FULL OFF, motor 30 seconds to clear fuel, allow to coast to a full stop before energizing igniters. Failure to clear fuel may result in engine damage.',
      'Fire guard — Posted (if available).',
      'Rotor blades — Check clear and untied.',
      '(O) Ignition KEYLOCK switch — ON.',
      'Throttle — Set for start. Check for full travel and return to idle stop. Check operation of engine idle stop, then close throttle.',
      'NOTE: A minimum of 24 volts should be indicated on DC voltmeter before attempting start. Battery starts may be made below 24 V providing voltage does not drop below 14 V with starter energized.',
      'START switch — Press and hold; start clock for starter timing. Note DC voltmeter indication.',
      'Main Rotor — CHECK turning as N1 reaches 15%. If rotor not turning, abort start.',
      'START fuel — OFF at 500°C (maximum).',
      'Release starter switch at 40% gas producer speed (N1) or after 35 seconds, whichever occurs first. See Chapter 5 starter limitations.',
      'Engine and transmission oil pressure — Check normal.',
      'Throttle — Slowly advance past engine idle stop to engine idle position. Manually check engine idle stop by attempting to close throttle.',
      'Gas producer (N1) — 68 to 72%. Hold a very slight pressure against engine idle stop during the check.',
      'WARNING: The pilot starting the aircraft must put the START FUEL switch OFF during the start sequence; keep one hand on the idle release switch and the other on the start fuel switch. Put start fuel OFF at 500°C. The left-seat pilot calls out "START FUEL OFF" at 500°C.',
      'Copilot attitude indicator — Cage and hold until inverter is on.',
      'INVTR switch — As required. SPARE for initial start, MAIN for thru-flight. INVERTER caution light should be out.',
      'GPU (GPU START) — Disconnect. External power caution light should go out when GPU access door is secured.'
    ]
  },
  {
    id: 'runup',
    title: 'Engine Runup',
    src: 'BHT 8-23',
    steps: [
      'Avionics / Radar Altimeter — On as desired.',
      'FORCE TRIM — Check: press force trim button (function); release; place FORCE TRIM switch OFF; check cyclic and pedals for freedom of movement and tip-path correlation.',
      'CAUTION: Full movement of cyclic at low rotor RPM may damage the main drive shaft.',
      'Hydraulic system — Place HYD CONT OFF; wait; HYD PRESSURE caution light should illuminate. Check controls freedom; collective full-down. Place HYD CONT ON; light out. Place FORCE TRIM switch ON.',
      'Fuel Boost Pumps — Pull RIGHT FUEL BOOST CB (RIGHT FUEL BOOST caution light illuminates, pressure normal); RESET MASTER CAUTION. Pull LEFT FUEL BOOST CB (light illuminates, pressure 0); RESET. Press RIGHT CB in (light out, pressure normal). Left CB IN. All cautions out.',
      'BLEED AIR switch — ON; check EGT/MGT increase, OFF; EGT/MGT decrease.',
      'DE-ICE switch — ON; check EGT/MGT increase, OFF; EGT/MGT decrease.',
      'LOW RPM AUDIO switch — AUDIO.',
      'Throttle — Slowly increase to full open. Low RPM audio and warning light go off above 6200 ±100 engine RPM and 300 ±5 rotor RPM. N2 stabilizes 6600 ±50 RPM. Throttle friction as desired.',
      'Engine and transmission instruments — Check readings within operational limits.',
      'Fuel quantity — Press FUEL GAGE TEST switch until gage drops ~200 lb, release, check gage returns to original indication.',
      'PITOT HTR — Check: place ON, note loadmeter increase, then OFF.',
      'AC voltmeter — Check each phase 115 ±3 volts, leave in AC.',
      'INVTR switch — OFF: check INST INVERTER caution light + AC voltmeter zero. Switch MAIN ON: caution light out.',
      'VM selector — Check all positions for DC voltage; leave NON-ESS BUS. Standby generator 1.0 V lower than main generator.',
      'STARTER GEN switch — STBY-GEN.',
      'MAIN GEN switch — OFF: main loadmeter zero, standby loadmeter load, DC GENERATOR caution light, DC voltage zero.',
      'NON-ESS BUS switch — MANUAL ON (note standby gen voltage), then NORMAL.',
      'VM selector — ESS BUS.',
      'MAIN GEN switch — ON and guard closed. DC GENERATOR caution light out. Main loadmeter load, standby loadmeter zero.',
      'Avionics — Operational check as necessary.',
      'Attitude indicators — Set.',
      'Heading indicators — Aligned with magnetic compass; set as required.',
      'FORCE TRIM switch — As desired.',
      'Doors — Secured.'
    ]
  },
  {
    id: 'before-takeoff',
    title: 'Before Takeoff',
    src: 'BHT 8-24',
    steps: [
      'Throttle full open — RPM 6600.',
      'Systems — engine, transmission, electrical, fuel indications within operational limits.',
      'Avionics — As required.',
      'Crew, passengers, and mission equipment — Check.',
      '(O) Cargo hook — If use anticipated: cargo secured, sling attached; ground personnel positioned; CARGO REL switch ARM (CARGO REL ARMED light illuminates).'
    ]
  }
];
