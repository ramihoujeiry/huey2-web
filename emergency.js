/* ============================================================
   HUEY2 — Emergency & Limitations data
   Trimmed pilot-checklist style, derived from:
     BHT PUB-92-004-10 (UH-1H-II Operator's Manual, Rev 10, 21 Aug 2017)
     Squadron SOP Training Guide
   Callout tags: W = WARNING, C = CAUTION, N = NOTE
   For planning reference only — always cross-check the manual.
   ============================================================ */

/* ---------------- EMERGENCY PROCEDURES (BHT Ch 9) ---------------- */
const EMERGENCY_DATA = [
  { cat: "Engine", items: [
    { id: "engfail", title: "Engine Failure / Autorotation",
      tags: ["W:Helicopter control is the primary consideration; all procedures are subordinate to it."],
      steps: [
        "Confirm engine malfunction via LEFT YAW, drop in RPM, low-RPM audio, RPM warning light, or change in engine noise — do NOT close throttle solely on RPM warning/light (could be tach generator failure).",
        "Decrease collective immediately and apply right pedal to maintain rotor RPM / constant heading.",
        "AUTOROTATE — adjust controls for autorotational descent.",
        "If partial power with roughness/surging: close throttle and autorotate.",
        "If smooth partial power: may descend gradually to a favorable area, but be ready for complete failure.",
        "EMER SHUTDOWN after landing (throttle CLOSED, fuel OFF, battery OFF)."
      ] },
    { id: "engmalfhover", title: "Engine Malfunction — Hover",
      steps: [ "AUTOROTATE.", "EMER SHUTDOWN." ] },
    { id: "engmalfcruise", title: "Engine Malfunction — Low Alt / Low Speed / Cruise",
      steps: [ "AUTOROTATE.", "EMER GOV OPNS (GOV AUTO/EMER switch → EMER; throttle adjust to control RPM; land ASAP)." ] },
    { id: "compstall", title: "Engine Compressor Stall (Surge)",
      tags: ["C:Avoid maneuvers requiring rapid/max power.", "N:Do not continue flight after a compressor stall (maintenance)."],
      steps: [ "REDUCE COLLECTIVE.", "DE-ICE and BLEED AIR switches → OFF.", "LAND AS SOON AS POSSIBLE.", "After landing: normal shutdown." ] },
    { id: "partial", title: "Partial Power — Inlet Guide Vane Failure",
      steps: [
        "IGV fails CLOSED: only 35–40% torque available; EMER gov adds NO power and risks N1 overspeed/overtemp. Accomplish a shallow approach.",
        "IGV fails OPEN: no evident indication; expect increased acceleration times." ] },
    { id: "oiltemp", title: "Engine Oil Temperature High",
      steps: [ "Oil temp exceeds limits → LAND AS SOON AS POSSIBLE." ] },
    { id: "droop", title: "Droop Compensator Failure",
      tags: ["C:RPM fluctuates with collective; engine overspeeds as collective decreased, underspeeds as increased."],
      steps: [ "Make minimum collective movements; shallow approach.", "If unable to hold RPM within limits: EMER GOV OPNS." ] },
    { id: "overspd", title: "Engine Overspeed",
      tags: ["W:LAND even if manual throttle corrects it — debris from initial N2 failure may cause impending failure."],
      steps: [ "COLLECTIVE → INCREASE to load rotor, keep RPM below max limit.", "THROTTLE → REDUCE until normal RPM; continue manual control.", "If no reduction: EMER GOV OPNS." ] },
    { id: "underspd", title: "Engine Underspeed",
      tags: ["C:At low alt/low speed treat as engine failure (insufficient time for EMER gov)."],
      steps: [ "AUTOROTATE.", "EMER GOV OPNS." ] },
    { id: "estart", title: "Emergency Start (engine won't start normally)",
      tags: ["C:Advance/reduce throttle SLOWLY; monitor EGT/MGT closely in EMER to avoid exceeding limits or flameout."],
      steps: [ "Normal before-starting checks complete.", "THROTTLE → CLOSED.", "GOV AUTO/EMER → EMER.", "STARTER → PRESS.", "Throttle open slowly to idle when N1 passes 8%.", "STARTER release at 40% N1.", "Throttle open slowly to 80% N1, then decrease to idle.", "GOV AUTO/EMER → AUTO as N1 decreases to idle." ] },
    { id: "erestart", title: "Engine Restart — In Flight",
      tags: ["C:Smooth throttle in EMER; ~1 min to regain powered flight."],
      steps: [ "THROTTLE → CLOSED.", "STARTER GEN → START.", "FUEL switches → ON.", "GOV AUTO/EMER → EMER.", "STARTER → PRESS; throttle open slowly to 6600 RPM after N1>8% (control rate to avoid EGT/MGT limits).", "STARTER release at 40% N1; return STARTER GEN to STBY GEN.", "LAND AS SOON AS POSSIBLE." ] },
    { id: "hotstart", title: "Hot Start — Emergency Shutdown",
      tags: ["C:Flames from tailpipe or EGT/MGT exceeded during start."],
      steps: [ "STARTER → PRESS (hold until EGT/MGT normal).", "THROTTLE → CLOSED immediately.", "FUEL switches → OFF." ] }
  ]},

  { cat: "Rotor / Drive", items: [
    { id: "drivefail", title: "Main Driveshaft Failure",
      tags: ["C:Left yaw, engine RPM up, rotor RPM down, low-RPM audio — complete loss of power to rotor, possible engine overspeed."],
      steps: [ "AUTOROTATE.", "EMER SHUTDOWN." ] },
    { id: "clutchdis", title: "Clutch Fails to Disengage",
      tags: ["C:Rotor RPM decays WITH engine RPM on throttle close → total loss of autorotational capability."],
      steps: [ "THROTTLE → OPEN.", "LAND AS SOON AS POSSIBLE." ] },
    { id: "clutcheng", title: "Clutch Fails to Re-engage",
      tags: ["C:Reverse needle split (engine RPM > rotor RPM) during recovery from autos."],
      steps: [ "AUTOROTATE.", "EMER SHUTDOWN." ] },
    { id: "colbounce", title: "Collective Bounce",
      steps: [ "RELAX pressure on collective (do not stiff-arm).", "Make a significant collective application (up or down).", "INCREASE collective friction." ] },
    { id: "xmsn", title: "Transmission Oil — Hot or Low Pressure",
      tags: ["W:Maintain engine power through approach/landing to prevent gear seizure."],
      steps: [ "LAND AS SOON AS POSSIBLE.", "EMERGENCY SHUTDOWN after landing." ] },
    { id: "chip", title: "Chip Detectors (main xmsn / engine / 42° / 90° gearbox)",
      tags: ["W:Do NOT restart engine until cause corrected.", "C:Perform POWER-ON approach and landing."],
      steps: [ "LAND AS SOON AS POSSIBLE — power-on approach/landing." ] },
    { id: "mrotor", title: "Flight Control / Main Rotor Malfunction",
      tags: ["W:Main rotor may collapse/separate after landing — decide to exit BEFORE shutdown."],
      steps: [ "LAND AS SOON AS POSSIBLE.", "EMER SHUTDOWN after landing." ] },
    { id: "mastbump", title: "Mast Bumping",
      steps: [ "REDUCE SEVERITY OF MANEUVER.", "LAND AS SOON AS POSSIBLE." ] }
  ]},

  { id: "tail", cat: "Tail Rotor / Antitorque", items: [
    { id: "trtotal", title: "Complete Loss of Tail Rotor Thrust (hover/flight)",
      tags: ["C:Right nose turn + left roll; below ~30–40 kt sideslip may become uncontrollable."],
      steps: [ "Powered flight: vary airspeed/power to manage sideslip & roll (neither eliminates it).", "In autorotation: maintain 40–70 kt to nearly eliminate sideslip/roll.", "AUTOROTATE when possible; full autorotative landing.", "Touchdown: rapid collective pull just prior to touchdown, level attitude, min ground roll." ] },
    { id: "trfixed", title: "Tail Rotor Fixed Pitch (binding)",
      tags: ["C:If fixed in LEFT-pedal (thrust left) position, do NOT attempt autorotative landing."],
      steps: [
        "Fixed during approach/reduced power (right pedal): nose turns right on power; assess — may be better to NOT autorotate immediately.",
        "Fixed during takeoff/increased power (left pedal): nose turns left on power reduction; powered landing likely best.",
        "Fixed in left-pedal position: return to powered level flight, run-on landing with power, touchdown 20–30 kt; do NOT autorotate." ] },
    { id: "trloss", title: "Loss of Tail Rotor Components (hover/flight)",
      tags: ["C:Small loss ≈ complete loss of thrust; larger loss → immediate autorotation may be only option; forward CG shift → aft cyclic."],
      steps: [ "AUTOROTATE.", "Correct forward CG shift with aft cyclic." ] },
    { id: "ltre", title: "Loss of Tail Rotor Effectiveness (LTRE)",
      tags: ["C:Most likely OGE hover / low speed from: high PA/high temp, adverse wind, RPM<6600/324, improperly rigged TR, high GW."],
      steps: [ "First indication: slow right turn not stopped by full left pedal, gradually increasing.", "Lower collective to regain control; accelerate if possible.", "As recovery effected, adjust controls for normal flight." ] },
    { id: "atinflight", title: "Antitorque Malfunction — In Flight",
      steps: [ "Regain control in cruise; changing collective (power) may aid trim: increase pitch → nose right, decrease → nose left; rolling off power → nose left.", "If safe area available: autorotational descent & landing.", "If not: continue powered flight 40–70 kt to suitable area, then full autorotative landing.", "Paved surface: run-on landing, touchdown 15–25 kt.", "Unprepared: decelerate from ~75 ft so forward groundspeed min at 10–20 ft; level attitude, rapid collective pull just prior to touchdown." ] },
    { id: "athover", title: "Antitorque Malfunction — Hover",
      steps: [ "Fixed left-pedal: gradually decrease collective and land.", "Total loss of TR thrust: close throttle immediately and AUTOROTATE." ] }
  ]},

  { cat: "Fire / Electrical", items: [
    { id: "firegrd", title: "Fuselage Fire — Ground",
      steps: [ "EMER SHUTDOWN.", "Clear all passengers & crew immediately." ] },
    { id: "fireflt", title: "Fire — Flight",
      tags: ["C:Consider VFR/IMC/night/altitude/landing areas to choose power-on or power-off."],
      steps: [ "POWER ON: LAND AS SOON AS POSSIBLE; EMER SHUTDOWN after landing.", "POWER OFF: AUTOROTATE; EMER SHUTDOWN." ] },
    { id: "efireflt", title: "Electrical Fire — Flight",
      tags: ["C:Consider essential equipment (flight instruments, fuel boost pumps) before killing power."],
      steps: [ "BAT, STBY, MAIN GEN → OFF.", "LAND AS SOON AS POSSIBLE.", "If must continue: GEN BUS RESET first, then MAIN GEN ON, STARTER GEN STBY GEN, BAT ON; pull malfunctioning circuit breaker." ] },
    { id: "efiregrd", title: "Electrical Fire — Ground",
      steps: [ "EMER SHUTDOWN.", "Clear passengers & crew immediately." ] },
    { id: "battery", title: "Overheated Battery",
      tags: ["W:Do NOT open compartment or disconnect; fluid causes burns, may explode."],
      steps: [ "BAT → OFF.", "LAND AS SOON AS POSSIBLE.", "EMER SHUTDOWN after landing." ] },
    { id: "smoke", title: "Smoke / Fume Elimination",
      tags: ["C:Do NOT jettison doors in flight."],
      steps: [ "Doors, windows, vents → OPEN." ] },
    { id: "maingen", title: "Main Generator Malfunction",
      steps: [ "GEN & BUS RESET → IN.", "MAIN GEN → RESET then ON (do not hold in RESET).", "If off line again: MAIN GEN → OFF; continue on standby generator." ] },
    { id: "throttlefail", title: "Throttle Failure — Emergency Shutdown",
      tags: ["N:If throttle can't close, FUEL switch OFF (engine may run 1.5–2 min after)."],
      steps: [ "FUEL switch → OFF.", "EMER SHUTDOWN." ] }
  ]},

  { cat: "Fuel System", items: [
    { id: "boost1", title: "Fuel Boost Pump Failure — One Pump",
      steps: [ "Flight may continue to a facility for correction (pressure drop / one caution light)." ] },
    { id: "boost2", title: "Fuel Boost Pump Failure — Both Pumps",
      tags: ["C:Zero pressure / both caution lights."],
      steps: [ "DESCEND to ≤4600 ft pressure altitude if possible.", "LAND AS SOON AS PRACTICAL.", "Both boost pumps must operate before next flight." ] },
    { id: "ffilter", title: "Fuel Filter Contamination",
      steps: [ "FILTER caution light → LAND AS SOON AS PRACTICAL; correct before next flight." ] },
    { id: "efpump", title: "Engine Fuel Pump Malfunction",
      tags: ["C:Perform POWER-ON approach and landing."],
      steps: [ "LAND AS SOON AS POSSIBLE — power-on." ] },
    { id: "cargorel", title: "Cargo Fails to Release Electrically",
      steps: [ "Cargo release pedal → PUSH." ] }
  ]},

  { cat: "Hydraulic / Flight Controls", items: [
    { id: "hydfail", title: "Hydraulic Power Failure",
      tags: ["W:Do NOT move HYD CONT switch or pull CB during takeoff/NOTAP/approach/landing or out of level flight.", "W:Do NOT return HYD CONT to ON for remainder of flight."],
      steps: [ "AIRSPEED → adjust for comfortable control.", "HYD CONT CB → OUT (if not restored).", "HYD CONT CB → IN.", "HYD CONT → OFF.", "LAND AS SOON AS PRACTICAL — run-on landing with power; maintain ≥ translation-lift speed at touchdown." ] },
    { id: "stiff", title: "Control Stiffness",
      tags: ["W:Both pilots keep hand on respective cyclic when switching HYD CONT.", "W:Do NOT return HYD CONT to ON for remainder of flight."],
      steps: [ "HYD CONT → OFF then ON; check restoration; repeat if needed.", "If not restored: HYD CONT → OFF.", "LAND AS SOON AS PRACTICAL — run-on landing with power." ] },
    { id: "hardover", title: "Flight Control Servo Hardover",
      tags: ["W:Both pilots keep hand on respective cyclic when switching HYD CONT."],
      steps: [ "HYD CONT → SELECT opposite position.", "LAND AS SOON AS POSSIBLE — run-on landing with power; maintain ≥ translation-lift speed at touchdown." ] }
  ]},

  { cat: "Ditching / Egress", items: [
    { id: "trees", title: "Landing in Trees",
      tags: ["C:Only when no other area available."],
      steps: [ "Select area with fewest/minimum-height trees.", "Decelerate to zero groundspeed at tree-top level; descend vertically applying collective as needed.", "Before blades enter trees: THROTTLE → CLOSED; apply remaining collective." ] },
    { id: "ditchon", title: "Ditching — Power On",
      steps: [ "Approach to ~3-ft hover above water.", "COCKPIT DOORS → JETTISON.", "CABIN DOORS → OPEN.", "Crew (except pilot) & passengers → EXIT.", "HOVER clear of personnel.", "THROTTLE → CLOSED; autorotate into water; full collective to cushion; rotor brake to stop.", "PILOT exits when rotor stopped." ] },
    { id: "ditchoff", title: "Ditching — Power Off",
      steps: [ "Engine malfunction emergency procedures; decelerate to zero forward speed near water.", "Apply all collective as helicopter enters water; level attitude until begins to roll, then cyclic toward roll.", "Rotor brake to stop; exit when rotor stopped.", "COCKPIT DOORS → JETTISON; CABIN DOORS → OPEN before entering water; EXIT when rotor stopped." ] },
    { id: "exits", title: "Emergency Exits / Equipment",
      steps: [ "Cockpit doors: pull handle, push door out.", "Cabin door windows: pull handle, lift inward.", "Fire extinguisher: remove from bracket, pull safety pin, aim at base of fire, depress handle.", "W:Extinguisher agent toxic; liquid may cause frostbite." ] }
  ]}
];

/* ---------------- Squadron SOP (separate tab) ---------------- */
const SOP_DATA = [
  { cat: "Engine / Monitoring", items: [
    { id: "sop-overtorque", title: "Over-Torque Recovery",
      tags: ["N:>88% for >5 min = land ASAP; >100% = gauge flashes (5-min limit exceeded)."],
      steps: [ "If torque >88% sustained >5 min: LAND AS SOON AS POSSIBLE.", "If torque >100%: reduce power below 100%; if unavoidable, land ASAP and log over-torque event." ] },
    { id: "sop-pac", title: "Power Assurance Check (PAC)",
      tags: ["N:Required before takeoff and before hover taxi."],
      steps: [ "Establish stable hover at known PA/temp.", "Record MGT and measured torque.", "Compare to Fig 7-1 minimum required torque.", "If actual < required → engine degraded; investigate before flight." ] },
    { id: "sop-ibf", title: "Inlet Barrier Filter (IBF)",
      tags: ["N:Reduces hover ceiling vs basic inlet — use correct chart (Fig 7-6/7-7 vs 7-8/7-9)."],
      steps: [ "Confirm IBF installed/config when selecting hover-ceiling charts.", "Account for heater ON/OFF and particle-separator configuration in planning." ] }
  ]},
  { cat: "Adverse Aerodynamic Conditions", items: [
    { id: "sop-vrs", title: "Settling With Power (Vortex Ring State)",
      tags: ["C:Low-speed descent >300 fpm near hover with power applied."],
      steps: [ "Increase airspeed or forward cyclic to escape.", "If developed: lower collective, gain airspeed, then re-establish." ] },
    { id: "sop-ltre", title: "Loss of Tail Rotor Effectiveness",
      steps: [ "Maintain ≥40 kt in gusty/confined areas.", "Lower collective, accelerate to regain yaw control." ] },
    { id: "sop-rbs", title: "Retreating Blade Stall",
      tags: ["C:High speed / high GW / high DA / abrupt maneuvers."],
      steps: [ "Reduce airspeed and/or bank angle.", "Lower collective / reduce G to recover." ] },
    { id: "sop-mast", title: "Mast Bumping",
      steps: [ "Avoid low-G / abrupt cyclic at low rotor loading.", "If occurs: reduce maneuver severity, level wings, land ASAP." ] },
    { id: "sop-ground", title: "Dynamic Rollover / Ground Resonance",
      tags: ["C:Wheeled/confined; blade-induced oscillation on ground."],
      steps: [ "Dynamic rollover: counter roll prompt, reduce throttle/collective if safe.", "Ground resonance: gently lift into hover or set down smoothly; reduce rotor RPM if on ground." ] },
    { id: "sop-sail", title: "Blade Sailing",
      tags: ["C:High wind on ground with rotor stopped/low RPM."],
      steps: [ "Secure rotor brake; avoid personnel near disc area in high wind.", "Do not spin up with sails/loose items on blades." ] }
  ]},
  { cat: "Training / NVG", items: [
    { id: "sop-nvg", title: "NVG Failure (single/partial)",
      tags: ["N:Squadron requires immediate actions for NVG-equipped night ops."],
      steps: [ "If one tube fails: continue on good tube / monocular if briefed.", "If total NVG failure: remove goggles, transition to ambient/unaided or instruments per brief.", "Maintain aircraft control; climb/route to better ambient or abort NVG segment." ] },
    { id: "sop-config", title: "Simulated Max GW Training Configs",
      tags: ["N:Configuration A = 900 lb; Configuration B = 1440 lb added; crew FS 46.7 / NCM FS 85."],
      steps: [ "Use PPC to confirm TOGW ≤ limits for training area PA/temp.", "Maintain PPC currency; update for GW/CG/temp/PA changes (esp. mountain).", "Brief abort/emergency landing areas before max-GW profiles." ] }
  ]}
];

/* ---------------- OPERATING LIMITS (BHT Ch 5) ---------------- */
const LIMITS_DATA = [
  { group: "Weight", rows: [
    ["Max gross weight — internal", "10,500 lb"],
    ["Max gross weight — external", "11,200 lb"],
    ["Max external cargo", "5,000 lb"],
    ["Towing max GW (rough surface)", "9,500 lb (permanent set risk >9,500)"],
    ["Floor loading", "100 lb/ft² (SF 3.0)"]
  ]},
  { group: "Center of Gravity", rows: [
    ["Longitudinal CG (flight)", "FS 130 – 144"],
    ["Lateral CG", "± 7.5 in"],
    ["Aft CG note", "Station 140–144: terminate approach ≥5-ft hover before landing"],
    ["CG aft of 140", "Practice touchdown autos NOT authorized"]
  ]},
  { group: "Rotor / Engine", rows: [
    ["Rotor RPM — power ON (continuous)", "314 – 324 RPM"],
    ["Rotor RPM — power ON (min / max)", "314 / 324 RPM"],
    ["Rotor RPM — power OFF", "295 – 339 RPM"],
    ["Autorotation RPM limit", "≤ 339 RPM"],
    ["N2 max (≤91% N1)", "6,840 RPM"],
    ["N2 max (>91% N1)", "6,700 RPM"],
    ["N2 transient (max 3 s)", "6,910 RPM"],
    ["Engine rating (6600 RPM)", "TOP 1800 SHP / MCP 1500 SHP"],
    ["Torque — 5-min (TOP)", "100%"],
    ["Torque — continuous (MCP)", "88%"],
    ["Rotor brake apply limit", "≤ 130 rotor RPM"],
    ["Starter", "3 energized periods/hr; 35 s ON / 3 min OFF"]
  ]},
  { group: "Airspeed / Maneuver", rows: [
    ["Vne (above 88% torque)", "80 KIAS"],
    ["Sideward flight", "35 kt"],
    ["Rearward flight", "30 kt"],
    ["Cargo door open (modified)", "120 KIAS"],
    ["Slope landing (cross / nose-up)", "10°"],
    ["Slope landing (nose-down)", "7°"],
    ["Prohibited", "Abrupt control → negative G; intentional severe/t-storm flight"],
    ["Wind — start limit", "30 kt, gust spread ≤ 15 kt"]
  ]},
  { group: "Height-Velocity", rows: [
    ["AVOID area", "Combos of height/airspeed from which safe landing not assured"],
    ["Valid when", "WAT limits not exceeded; 10,500 lb to 3,600 ft DA (reduce GW above)"]
  ]}
];
