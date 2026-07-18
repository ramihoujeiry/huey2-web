/* CG envelope trial-feature constants.
   Loaded BEFORE the Vue app (e.g. <script src="cgenv.js"></script>)
   so that `const CGENV` is a top-level const the app can read. */
const CGENV = {
  fsMin: 130,        // longitudinal CG envelope forward limit (FS)
  fsMax: 144,        // longitudinal CG envelope aft limit (FS)
  fsAxisMin: 120,    // SVG x-axis left edge (FS) — keeps 130..144 centered
  fsAxisMax: 150,    // SVG x-axis right edge (FS)
  latMax: 7.5        // lateral CG limit (in) each side of centerline
};
