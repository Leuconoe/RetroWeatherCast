/**
 * WeatherService — OpenWeatherMap API Integration (Extended)
 * Supports: Current, 5-day Forecast, Hourly data, Moon Phase, City comparisons
 */
(function () {
  'use strict';

  var CACHE_PREFIX = 'rwc_';
  var CACHE_TTL = 15 * 60 * 1000;

  /* --- Inline SVG Icons (WeatherStar 4000+ retro style) --- */
  var ICONS = {
    clear: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="12" fill="#ffcc00"/><g stroke="#ffcc00" stroke-width="3" stroke-linecap="round"><line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/><line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/><line x1="13.6" y1="13.6" x2="19.3" y2="19.3"/><line x1="44.7" y1="44.7" x2="50.4" y2="50.4"/><line x1="13.6" y1="50.4" x2="19.3" y2="44.7"/><line x1="44.7" y1="19.3" x2="50.4" y2="13.6"/></g></svg>',
    'partly-cloudy': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="22" r="10" fill="#ffcc00"/><g stroke="#ffcc00" stroke-width="2" stroke-linecap="round"><line x1="24" y1="6" x2="24" y2="10"/><line x1="8" y1="22" x2="12" y2="22"/><line x1="12.7" y1="10.7" x2="15.5" y2="13.5"/><line x1="12.7" y1="33.3" x2="15.5" y2="30.5"/><line x1="35.3" y1="10.7" x2="32.5" y2="13.5"/></g><path d="M20 44 Q20 36 28 36 Q28 28 38 28 Q48 28 48 36 Q56 36 56 44 Z" fill="#00ccff"/></svg>',
    cloudy: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 46 Q16 38 24 38 Q24 28 36 28 Q48 28 48 36 Q56 36 56 46 Z" fill="#00ccff"/><path d="M10 52 Q10 46 16 46 Q16 40 24 40 Q32 40 32 46 Q38 46 38 52 Z" fill="#5566aa" opacity="0.6"/></svg>',
    rain: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 36 Q16 28 24 28 Q24 18 36 18 Q48 18 48 28 Q56 28 56 36 Z" fill="#00ccff"/><g stroke="#00ccff" stroke-width="2" stroke-linecap="round"><line x1="22" y1="42" x2="20" y2="52"/><line x1="32" y1="42" x2="30" y2="54"/><line x1="42" y1="42" x2="40" y2="52"/></g></svg>',
    drizzle: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 36 Q16 28 24 28 Q24 18 36 18 Q48 18 48 28 Q56 28 56 36 Z" fill="#00ccff"/><g fill="#00ccff"><circle cx="22" cy="44" r="1.5"/><circle cx="32" cy="48" r="1.5"/><circle cx="42" cy="44" r="1.5"/><circle cx="27" cy="52" r="1.5"/><circle cx="37" cy="52" r="1.5"/></g></svg>',
    thunderstorm: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 30 Q16 22 24 22 Q24 12 36 12 Q48 12 48 22 Q56 22 56 30 Z" fill="#5566aa"/><polygon points="30,32 24,44 32,44 28,56 40,40 32,40 36,32" fill="#ffcc00"/></svg>',
    snow: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M16 36 Q16 28 24 28 Q24 18 36 18 Q48 18 48 28 Q56 28 56 36 Z" fill="#00ccff"/><g fill="#e8e8ff"><circle cx="22" cy="44" r="2"/><circle cx="32" cy="48" r="2"/><circle cx="42" cy="44" r="2"/><circle cx="27" cy="54" r="2"/><circle cx="37" cy="54" r="2"/></g></svg>',
    mist: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g stroke="#00ccff" stroke-width="3" stroke-linecap="round" opacity="0.7"><line x1="10" y1="24" x2="54" y2="24"/><line x1="14" y1="32" x2="50" y2="32"/><line x1="10" y1="40" x2="54" y2="40"/><line x1="18" y1="48" x2="46" y2="48"/></g></svg>',
    'moon-new': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="none" stroke="#ffcc00" stroke-width="1" stroke-dasharray="3 3"/></svg>',
    'moon-first': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 16 A16 16 0 0 1 32 48 Z" fill="#ffcc00"/><circle cx="32" cy="32" r="16" fill="none" stroke="#ffcc00" stroke-width="1"/></svg>',
    'moon-full': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="16" fill="#ffcc00"/><circle cx="26" cy="26" r="3" fill="#ddaa00"/><circle cx="38" cy="34" r="2" fill="#ddaa00"/><circle cx="30" cy="40" r="2.5" fill="#ddaa00"/></svg>',
    'moon-last': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 16 A16 16 0 0 0 32 48 Z" fill="#ffcc00"/><circle cx="32" cy="32" r="16" fill="none" stroke="#ffcc00" stroke-width="1"/></svg>'
  };

  function getIconKey(code) {
    if (code >= 200 && code < 300) return 'thunderstorm';
    if (code >= 300 && code < 400) return 'drizzle';
    if (code >= 500 && code < 600) return 'rain';
    if (code >= 600 && code < 700) return 'snow';
    if (code >= 700 && code < 800) return 'mist';
    if (code === 800) return 'clear';
    if (code >= 801 && code <= 802) return 'partly-cloudy';
    return 'cloudy';
  }

  function getWeatherIcon(code) { return ICONS[getIconKey(code)] || ICONS.cloudy; }

  function getMoonPhaseInfo(phase) {
    if (phase < 0.0625 || phase >= 0.9375) return { icon: ICONS['moon-new'], label: 'New Moon' };
    if (phase < 0.1875) return { icon: ICONS['moon-first'], label: 'Waxing Crescent' };
    if (phase < 0.3125) return { icon: ICONS['moon-first'], label: 'First Quarter' };
    if (phase < 0.4375) return { icon: ICONS['moon-full'], label: 'Waxing Gibbous' };
    if (phase < 0.5625) return { icon: ICONS['moon-full'], label: 'Full Moon' };
    if (phase < 0.6875) return { icon: ICONS['moon-last'], label: 'Waning Gibbous' };
    if (phase < 0.8125) return { icon: ICONS['moon-last'], label: 'Last Quarter' };
    return { icon: ICONS['moon-new'], label: 'Waning Crescent' };
  }

  function calculateMoonPhase(date) {
    var known = new Date('2024-01-11').getTime();
    var diff = date.getTime() - known;
    var cycle = 29.53 * 24 * 60 * 60 * 1000;
    return ((diff % cycle) + cycle) % cycle / cycle;
  }

  /* --- Cache --- */
  function getCache(key) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data.timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
      return data.value;
    } catch (e) { return null; }
  }
  function setCache(key, value) {
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), value: value })); } catch (e) {}
  }

  /* --- API Calls --- */
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) {
        if (r.status === 401) throw new Error('INVALID_API_KEY');
        if (r.status === 404) throw new Error('CITY_NOT_FOUND');
        if (r.status === 429) throw new Error('RATE_LIMIT');
        throw new Error('API_ERROR_' + r.status);
      }
      return r.json();
    });
  }

  function fetchCurrentWeather(city, apiKey, unit) {
    var cached = getCache('current_' + city);
    if (cached) return Promise.resolve(cached);
    var url = 'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=' + unit + '&lang=en';
    return fetchJSON(url).then(function (data) {
      var parsed = parseCurrentData(data, unit);
      setCache('current_' + city, parsed);
      return parsed;
    });
  }

  function fetchForecast(city, apiKey, unit) {
    var cached = getCache('forecast_' + city);
    if (cached) return Promise.resolve(cached);
    var url = 'https://api.openweathermap.org/data/2.5/forecast?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=' + unit + '&lang=en';
    return fetchJSON(url).then(function (data) {
      var parsed = parseForecastData(data);
      setCache('forecast_' + city, parsed);
      return parsed;
    });
  }

  function fetchHourlyData(city, apiKey, unit) {
    var cached = getCache('hourly_' + city);
    if (cached) return Promise.resolve(cached);
    var url = 'https://api.openweathermap.org/data/2.5/forecast?q=' + encodeURIComponent(city) + '&appid=' + apiKey + '&units=' + unit + '&lang=en';
    return fetchJSON(url).then(function (data) {
      var parsed = parseHourlyData(data);
      setCache('hourly_' + city, parsed);
      return parsed;
    });
  }

  /* --- Parsers --- */
  function parseCurrentData(response, unit) {
    var w = response.weather && response.weather[0] ? response.weather[0] : {};
    return {
      city: response.name || 'Unknown',
      temp: Math.round(response.main.temp),
      feelsLike: Math.round(response.main.feels_like),
      humidity: response.main.humidity,
      pressure: (response.main.pressure * 0.02953).toFixed(2),
      pressureHpa: response.main.pressure,
      windSpeed: response.wind.speed,
      windDeg: response.wind.deg,
      weatherCode: w.id || 800,
      weatherMain: w.main || 'Unknown',
      weatherDesc: w.description || '',
      sunrise: response.sys.sunrise,
      sunset: response.sys.sunset,
      dt: response.dt,
      unit: unit
    };
  }

  function parseForecastData(response) {
    if (!response.list || !response.list.length) return [];
    var dailyMap = {};
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    response.list.forEach(function (item) {
      var date = new Date(item.dt * 1000);
      var key = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
      if (!dailyMap[key]) {
        dailyMap[key] = { day: dayNames[date.getDay()], date: date, high: -Infinity, low: Infinity, noonItems: [] };
      }
      var e = dailyMap[key];
      if (item.main.temp_max > e.high) e.high = item.main.temp_max;
      if (item.main.temp_min < e.low) e.low = item.main.temp_min;
      if (date.getHours() >= 9 && date.getHours() <= 15) e.noonItems.push(item);
    });
    return Object.keys(dailyMap).sort().slice(0, 7).map(function (key) {
      var d = dailyMap[key];
      var rep = d.noonItems.length > 0 ? d.noonItems[0] : response.list.find(function (i) {
        var dd = new Date(i.dt * 1000);
        return dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + dd.getDate() === key;
      });
      var wc = 800, wm = 'Clear', wd = '';
      if (rep && rep.weather && rep.weather[0]) { wc = rep.weather[0].id; wm = rep.weather[0].main; wd = rep.weather[0].description; }
      return { day: d.day, date: d.date, high: Math.round(d.high), low: Math.round(d.low), weatherCode: wc, weatherMain: wm, weatherDesc: wd };
    });
  }

  function parseHourlyData(response) {
    if (!response.list || !response.list.length) return [];
    return response.list.slice(0, 8).map(function (item) {
      var date = new Date(item.dt * 1000);
      var h = date.getHours();
      var ampm = h >= 12 ? 'PM' : 'AM';
      var hr = h % 12 || 12;
      return {
        time: hr + ' ' + ampm,
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        windSpeed: item.wind.speed,
        humidity: item.main.humidity,
        pop: Math.round((item.pop || 0) * 100),
        weatherCode: item.weather && item.weather[0] ? item.weather[0].id : 800,
        cloudiness: item.clouds && item.clouds.all ? item.clouds.all : 0,
        dt: item.dt
      };
    });
  }

  function getWindDirection(deg) {
    var dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function formatTime(timestamp) {
    var d = new Date(timestamp * 1000);
    var h = d.getHours(), m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
  }

  window.WeatherService = {
    getWeatherIcon: getWeatherIcon,
    getMoonPhaseInfo: getMoonPhaseInfo,
    calculateMoonPhase: calculateMoonPhase,
    fetchCurrentWeather: fetchCurrentWeather,
    fetchForecast: fetchForecast,
    fetchHourlyData: fetchHourlyData,
    getWindDirection: getWindDirection,
    formatTime: formatTime,
    getCache: getCache,
    setCache: setCache,
    ICONS: ICONS
  };
})();
