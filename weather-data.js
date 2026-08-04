// Weather tab add-on for HUEY2.
// Data + fetch helpers for area weather + METAR for ICAO stations.
// Loaded as weather.js, referenced from index.html data/computed/methods fragment.

const WEATHER_STATE = {
  query: '',
  airports: [],
  selected: null,
  loading: false,
  rawMetar: null,
  areaWeather: null,
  lastFetch: null,
  error: ''
};

const WeatherFetcher = {
  async searchAreas(query) {
    if (!query || query.trim().length < 2) return [];
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query.trim()) + '&count=10&language=en&format=json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const out = [];
    if (data && data.results) {
      for (const r of data.results) {
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
    return out;
  },

  async fetchWeather(location) {
    const out = { rawMetar: null, areaWeather: null, error: '', station: '' };
    const station = (location && location.icao) ? location.icao : ((location && location.iata) ? location.iata : '');
    if (station) {
      out.station = station;
      try {
        const metarUrl = 'https://metar.vatsim.net/' + encodeURIComponent(station);
        const mRes = await fetch(metarUrl);
        if (mRes.ok) {
          const txt = (await mRes.text()).trim();
          if (txt && !txt.toLowerCase().includes('no metar')) out.rawMetar = txt;
        }
      } catch (e) { /* non-fatal */ }
    }

    if (location && location.lat != null && location.lon != null) {
      try {
        const owUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + location.lat + '&longitude=' + location.lon + '&current_weather=true&timezone=auto&hourly=surface_pressure,relativehumidity_2m&forecast_hours=1';
        const owRes = await fetch(owUrl);
        if (owRes.ok) {
          const ow = await owRes.json();
          const cw = ow.current_weather || null;
          if (cw) {
            const codeMap = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Slight rain',63:'Rain',65:'Heavy rain',71:'Slight snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Heavy showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm + hail'};
            const desc = codeMap[cw.weathercode] !== undefined ? codeMap[cw.weathercode] : ('Weather code ' + cw.weathercode);
            const hourly = ow.hourly || {};
            const pressure = Array.isArray(hourly.surface_pressure) && hourly.surface_pressure[0] != null ? Number(hourly.surface_pressure[0]) : null;
            const humidity = Array.isArray(hourly.relativehumidity_2m) && hourly.relativehumidity_2m[0] != null ? Number(hourly.relativehumidity_2m[0]) : null;
            out.areaWeather = {
              desc,
              temp: cw.temperature,
              wind: cw.windspeed,
              windDir: cw.winddirection,
              pressure,
              humidity,
              elev: location.elevation || '',
              source: 'open-meteo'
            };
          }
        }
      } catch (e) { /* non-fatal */ }
    }

    if (!out.rawMetar && !out.areaWeather) out.error = 'No weather data available for this location.';
    return out;
  }
};
