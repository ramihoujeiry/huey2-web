// Weather tab add-on for HUEY2.
// Data + fetch helpers for METAR/TAF via public endpoints.
// Loaded as weather.js, referenced from index.html data/computed/methods fragment.

// Sources (no key required):
// - METAR: https://metar.vatsim.net/{STATION}  (plain text, CORS-enabled)
// - TAF:   https://aviationweather.gov/api/data/taf?ids={STATION}&format=raw  (attempt; may CORS-fail)
// - Geocoding: https://geocoding-api.open-meteo.com/v1/search?name={QUERY}

const WEATHER_STATE = {
  query: '',
  airports: [],
  selected: null,
  loading: false,
  rawMetar: null,
  rawTaf: null,
  lastFetch: null,
  error: ''
};

const WeatherFetcher = {
  async searchAirports(query) {
    if (!query || query.trim().length < 2) return [];
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query.trim()) + '&count=6&language=en&format=json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const out = [];
    if (data && data.results) {
      for (const r of data.results) {
        if (r.airport || r.iata || r.icao) {
          out.push({
            name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
            icao: r.icao || '',
            iata: r.iata || '',
            lat: r.latitude,
            lon: r.longitude,
            country: r.country_code || ''
          });
        }
      }
    }
    return out;
  },

  async fetchWeather(station) {
    const s = String(station).trim().toUpperCase();
    if (!s) return;
    const out = { rawMetar: null, rawTaf: null, error: '', station: s };
    try {
      const metarUrl = 'https://metar.vatsim.net/' + encodeURIComponent(s);
      const mRes = await fetch(metarUrl);
      if (mRes.ok) {
        const txt = (await mRes.text()).trim();
        if (txt && !txt.toLowerCase().includes('no metar')) out.rawMetar = txt;
      }
    } catch (e) {
      // network/CORS on METAR source
    }

    try {
      const tafUrl = 'https://aviationweather.gov/api/data/taf?ids=' + encodeURIComponent(s) + '&format=raw';
      const tRes = await fetch(tafUrl, { mode: 'cors' });
      if (tRes.ok) {
        const txt = (await tRes.text()).trim();
        if (txt && !/no (taf|data)/i.test(txt)) out.rawTaf = txt;
      }
    } catch (e) {
      // CORS or network failure on TAF source — non-fatal
      out.error = out.error ? out.error : 'TAF not available from this network.';
    }

    if (!out.rawMetar && !out.rawTaf) out.error = 'No weather found for ' + s + '.';
    return out;
  }
};
