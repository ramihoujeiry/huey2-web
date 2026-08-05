// HUEY2 Weather Proxy — CORS-enabled bridge to NOAA Aviation Weather Center.
// Deployed as a Cloudflare Worker. No API key needed (NOAA is public).
// Adds Access-Control-Allow-Origin so the static github.io PWA can call it.
//
// Endpoints:
//   GET /weather?ids=OLBA   -> combined { station, metar, taf, qnh_inhg, error }
//   GET /metar?ids=OLBA     -> raw METAR text
//   GET /taf?ids=OLBA       -> raw TAF text

const NOAA = "https://aviationweather.gov/api/data";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "no-store",
  };
}

function parseQnhInHg(raw) {
  // METAR encodes altimeter as A#### where #### is inches+hundredths, e.g. A2983 -> 29.83
  if (!raw) return null;
  const m = raw.match(/\bA(\d{4})\b/);
  if (!m) return null;
  const v = parseInt(m[1], 10);
  return (v / 100).toFixed(2);
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "huey2-weather-proxy" } });
    if (r.status === 204) return "";
    if (!r.ok) return "";
    return (await r.text()).trim();
  } catch (e) {
    return "";
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const ids = (url.searchParams.get("ids") || "").toUpperCase().trim();
    if (!ids) {
      return new Response(JSON.stringify({ error: "Missing ids parameter" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const path = url.pathname;

    if (path === "/metar" || path === "/taf") {
      const kind = path === "/metar" ? "metar" : "taf";
      const txt = await fetchText(`${NOAA}/${kind}?ids=${encodeURIComponent(ids)}&format=raw`);
      return new Response(txt, { status: 200, headers: { ...corsHeaders(), "Content-Type": "text/plain; charset=utf-8" } });
    }

    // default: combined /weather
    const [metar, taf] = await Promise.all([
      fetchText(`${NOAA}/metar?ids=${encodeURIComponent(ids)}&format=raw&mostRecent=true`),
      fetchText(`${NOAA}/taf?ids=${encodeURIComponent(ids)}&format=raw`),
    ]);

    const out = {
      station: ids,
      metar: metar || null,
      taf: taf || null,
      qnh_inhg: parseQnhInHg(metar),
      error: metar || taf ? "" : "No METAR or TAF available for this station.",
    };
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8" },
    });
  },
};
