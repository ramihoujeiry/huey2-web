// HUEY2 Weather Proxy — CORS-enabled bridge to NOAA Aviation Weather Center.
// Deployed as a Cloudflare Worker. No API key needed (NOAA is public).
// Adds Access-Control-Allow-Origin so the static github.io PWA can call it.
//
// Endpoints:
//   GET /weather?ids=OLBA   -> combined { station, metar, taf, qnh_inhg, wind_kt, wind_dir, temp_c, source, error }
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
  // US METAR: A#### = inches+hundredths, e.g. A2983 -> 29.83
  const a = raw && raw.match(/\bA(\d{4})\b/);
  if (a) return (parseInt(a[1], 10) / 100).toFixed(2);
  // Intl METAR: Q#### = hPa, e.g. Q1012 -> 1012 hPa -> 29.88 inHg
  const q = raw && raw.match(/\bQ(\d{4})\b/);
  if (q) return (parseInt(q[1], 10) / 33.8639).toFixed(2);
  return null;
}

function parseWind(raw) {
  // e.g. 26016KT or 19006G22KT or VRB03KT
  const m = raw && raw.match(/\b(\d{3}|VRB)(\d{2,3})(G\d{2,3})?KT\b/);
  if (m) {
    return { dir: m[1] === "VRB" ? "VRB" : m[1], kt: parseInt(m[2], 10) };
  }
  return null;
}

function parseTemp(raw) {
  // e.g. 21/14  or  M02/M12  (temp/dewpoint)
  const m = raw && raw.match(/\b(M?\d{2})\/(M?\d{2})\b/);
  if (m) {
    const v = parseInt(m[1].replace("M", "-"), 10);
    if (!isNaN(v)) return v;
  }
  return null;
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

    const wind = metar ? parseWind(metar) : null;
    const out = {
      station: ids,
      metar: metar || null,
      taf: taf || null,
      qnh_inhg: metar ? parseQnhInHg(metar) : null,
      wind_kt: wind ? wind.kt : null,
      wind_dir: wind ? wind.dir : null,
      temp_c: metar ? parseTemp(metar) : null,
      source: metar ? "noaa-metar" : (taf ? "noaa-taf" : ""),
      error: metar || taf ? "" : "No METAR or TAF available for this station.",
    };
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8" },
    });
  },
};
