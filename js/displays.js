/**
 * Displays — WeatherSTAR 4000 Authentic Style Renderers
 * Each function renders one display screen into the display area.
 * Based on: TWC Classics archive screenshots (1990-2002)
 * Reference: https://twcclassics.com/information/weatherstar-4000-flavors.html
 */
(function () {
  'use strict';

  var WS = window.WeatherService;

  /**
   * Get unit symbols based on current settings
   */
  function getUnits() {
    var tempUnit = 'celsius';
    var distUnit = 'metric';
    if (typeof window.LOCAL_CONFIG !== 'undefined') {
      if (window.LOCAL_CONFIG.temperatureUnit) tempUnit = window.LOCAL_CONFIG.temperatureUnit;
      if (window.LOCAL_CONFIG.distanceUnit) distUnit = window.LOCAL_CONFIG.distanceUnit;
    }
    return {
      tempSymbol: tempUnit === 'fahrenheit' ? '°F' : '°C',
      speedUnit: distUnit === 'imperial' ? 'mph' : 'm/s',
      distUnit: distUnit === 'imperial' ? 'mi' : 'km',
      pressUnit: distUnit === 'imperial' ? ' inHg' : ' hPa',
      tempUnit: tempUnit,
      distUnit: distUnit
    };
  }

  /* ============================================================
     DISPLAY: Intro (15-second intro screen)
     ============================================================ */
  function renderIntro(container) {
    container.innerHTML =
      '<div class="display-intro">' +
        '<div class="intro-logo-box">' +
          '<span class="intro-logo-line1">The Weather</span>' +
          '<span class="intro-logo-line2">Channel</span>' +
        '</div>' +
        '<div class="intro-tagline">WeatherSTAR 4000</div>' +
        '<div class="intro-city" id="introCity">Loading...</div>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Current Conditions (Authentic WeatherSTAR 4000)
     Left: large temp + icon + wind | Right: city + data column
     ============================================================ */
  function renderCurrent(data, container) {
    var u = getUnits();
    var pressureVal = u.distUnit === 'imperial' ? data.pressure : data.pressureHpa;

    container.innerHTML =
      '<div class="display-current">' +
        '<div class="current-main-row">' +
          '<div class="current-left">' +
            '<div class="current-temp">' + data.temp + u.tempSymbol + '</div>' +
            '<div class="current-condition">' + data.weatherMain + '</div>' +
            '<div class="current-icon">' + WS.getWeatherIcon(data.weatherCode) + '</div>' +
            '<div class="current-wind">Wind: ' + WS.getWindDirection(data.windDeg) + ' ' + Math.round(data.windSpeed) + '</div>' +
          '</div>' +
          '<div class="current-right">' +
            '<div class="current-city-label">' + data.city + '</div>' +
            '<div class="current-detail-row">' +
              '<span class="current-detail-label">Humidity:</span>' +
              '<span class="current-detail-value">' + data.humidity + '%</span>' +
            '</div>' +
            '<div class="current-detail-row">' +
              '<span class="current-detail-label">Dewpoint:</span>' +
              '<span class="current-detail-value">' + Math.round(data.temp - ((100 - data.humidity) / 5)) + u.tempSymbol + '</span>' +
            '</div>' +
            '<div class="current-detail-row">' +
              '<span class="current-detail-label">Ceiling:</span>' +
              '<span class="current-detail-value">7500 ft.</span>' +
            '</div>' +
            '<div class="current-detail-row">' +
              '<span class="current-detail-label">Visibility:</span>' +
              '<span class="current-detail-value">6 ' + u.distUnit + '.</span>' +
            '</div>' +
            '<div class="current-detail-row">' +
              '<span class="current-detail-label">Pressure:</span>' +
              '<span class="current-detail-value">' + pressureVal + u.pressUnit + '↑</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Latest Observations (4-column table)
     Location | °F | Weather | Wind
     ============================================================ */
  function renderLatestObservations(data, container) {
    var u = getUnits();
    var cities = [];
    if (typeof window.MockData !== 'undefined') {
      cities = window.MockData.generateCityComparisons(data);
    }

    if (!cities.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No observation data available</div>';
      return;
    }

    var rows = cities.map(function (c) {
      return '<tr>' +
        '<td class="col-city">' + c.name + '</td>' +
        '<td class="col-temp">' + c.temp + u.tempSymbol + '</td>' +
        '<td class="col-center">' + c.weatherMain + '</td>' +
        '<td class="col-center">' + WS.getWindDirection(c.windDeg) + ' ' + Math.round(c.windSpeed) + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="display-observations">' +
        '<table class="ws-table">' +
          '<thead><tr><th>Location</th><th>' + u.tempSymbol + '</th><th>Weather</th><th>Wind</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div style="margin-top:1vh;padding-top:0.5vh;border-top:1px solid var(--ws-panel-highlight);display:flex;gap:2vw;font-size:clamp(1rem,1.5vw,1.3rem);color:var(--ws-white);text-shadow:1px 1px 3px var(--ws-shadow);">' +
          '<span>HUMIDITY: ' + data.humidity + '%</span>' +
          '<span>DEWPOINT: ' + Math.round(data.temp - ((100 - data.humidity) / 5)) + u.tempSymbol + '</span>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Regional Observations (map-style, simplified as table)
     ============================================================ */
  function renderRegionalObservations(data, container) {
    var u = getUnits();
    var cities = [];
    if (typeof window.MockData !== 'undefined') {
      cities = window.MockData.generateCityComparisons(data);
    }

    if (!cities.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No regional data available</div>';
      return;
    }

    var rows = cities.map(function (c) {
      return '<tr>' +
        '<td class="col-city">' + c.name + '</td>' +
        '<td class="col-temp">' + c.temp + u.tempSymbol + '</td>' +
        '<td class="col-center">' + c.weatherMain + '</td>' +
        '<td class="col-center">' + WS.getWindDirection(c.windDeg) + ' ' + Math.round(c.windSpeed) + '</td>' +
        '<td class="col-center">' + c.humidity + '%</td>' +
        '<td class="col-center">' + c.pressure + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="display-observations">' +
        '<table class="ws-table">' +
          '<thead><tr><th>City</th><th>Temp</th><th>Weather</th><th>Wind</th><th>Humidity</th><th>Pressure</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Extended Forecast (3 vertical panels per row)
     Day | Icon | Condition | Lo / Hi
     ============================================================ */
  function renderExtended(forecastData, container) {
    if (!forecastData || !forecastData.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No forecast data</div>';
      return;
    }

    var u = getUnits();

    // Show first 6 days in 2 rows of 3
    var days = forecastData.slice(0, 6);
    var panels = days.map(function (d) {
      return '<div class="extended-panel">' +
        '<div class="extended-day-label">' + d.day + '</div>' +
        '<div class="extended-icon">' + WS.getWeatherIcon(d.weatherCode) + '</div>' +
        '<div class="extended-condition">' + d.weatherMain + '</div>' +
        '<div class="extended-temps">' +
          '<div><div class="extended-lo-label">Lo</div><div class="extended-lo-value">' + d.low + u.tempSymbol + '</div></div>' +
          '<div><div class="extended-hi-label">Hi</div><div class="extended-hi-value">' + d.high + u.tempSymbol + '</div></div>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="display-extended">' +
        '<div class="extended-panels">' + panels + '</div>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Almanac (Sunrise/Sunset + Moon Phases)
     Reference: Two-column sun comparison + 4 moon phase icons
     ============================================================ */
  function renderAlmanac(data, container) {
    var moonPhase = WS.calculateMoonPhase(new Date());
    var moonInfo = WS.getMoonPhaseInfo(moonPhase);
    var illumination = Math.round((1 - Math.cos(2 * Math.PI * moonPhase)) / 2 * 100);

    // Calculate next moon phases
    var now = new Date();
    var knownNew = new Date('2024-01-11');
    var daysSinceKnown = Math.floor((now - knownNew) / (24 * 60 * 60 * 1000));
    var currentPhase = (daysSinceKnown % 29.53) / 29.53;

    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var today = dayNames[now.getDay()];
    var tomorrow = dayNames[(now.getDay() + 1) % 7];

    var moonPhases = [
      { name: 'New', date: addDays(now, Math.ceil((0 - currentPhase + 1) % 1 * 29.53)) },
      { name: 'First', date: addDays(now, Math.ceil((0.25 - currentPhase + 1) % 1 * 29.53)) },
      { name: 'Full', date: addDays(now, Math.ceil((0.5 - currentPhase + 1) % 1 * 29.53)) },
      { name: 'Last', date: addDays(now, Math.ceil((0.75 - currentPhase + 1) % 1 * 29.53)) }
    ];

    var moonItems = moonPhases.map(function (mp) {
      var phaseVal = mp.name === 'New' ? 0 : mp.name === 'First' ? 0.25 : mp.name === 'Full' ? 0.5 : 0.75;
      var mi = WS.getMoonPhaseInfo(phaseVal);
      var dateStr = (mp.date.getMonth() + 1) + '/' + mp.date.getDate();
      return '<div class="moon-phase-item">' +
        mi.icon +
        '<span class="moon-phase-label">' + mp.name + '</span>' +
        '<span class="moon-phase-date">' + dateStr + '</span>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="display-almanac">' +
        '<div class="almanac-panel sun-panel">' +
          '<div class="almanac-panel-title">Sun Data</div>' +
          '<div class="sun-compare-row">' +
            '<div class="sun-col">' +
              '<div class="sun-col-day">' + today + '</div>' +
              '<div class="sun-col-time">' + WS.formatTime(data.sunrise) + '</div>' +
              '<div class="sun-col-time">' + WS.formatTime(data.sunset) + '</div>' +
            '</div>' +
            '<div class="sun-col">' +
              '<div class="sun-col-day">' + tomorrow + '</div>' +
              '<div class="sun-col-time">' + WS.formatTime(data.sunrise + 86400) + '</div>' +
              '<div class="sun-col-time">' + WS.formatTime(data.sunset + 86400) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="sun-labels-row">' +
            '<span class="sun-label-item">Sunrise</span>' +
            '<span class="sun-label-item">Sunset</span>' +
          '</div>' +
        '</div>' +
        '<div class="almanac-panel moon-panel">' +
          '<div class="almanac-panel-title">Moon Data</div>' +
          '<div class="moon-current-row">' +
            '<div class="moon-current-icon">' + moonInfo.icon + '</div>' +
            '<div class="moon-current-info">' +
              '<div class="moon-current-phase">' + moonInfo.label + '</div>' +
              '<div class="moon-current-illum">Illumination: ' + illumination + '%</div>' +
            '</div>' +
          '</div>' +
          '<div class="moon-phases-row">' + moonItems + '</div>' +
        '</div>' +
      '</div>';
  }

  function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + Math.max(1, Math.floor(days)));
    return result;
  }

  function calcDaylight(sunrise, sunset) {
    var diff = (sunset - sunrise) / 1000;
    var h = Math.floor(diff / 3600);
    var m = Math.floor((diff % 3600) / 60);
    return h + 'h ' + m + 'm';
  }

  /* ============================================================
     DISPLAY: Travel Cities Forecast (table)
     City | Lo | Hi | Condition
     ============================================================ */
  function renderTravel(current, container) {
    if (typeof window.MockData === 'undefined') {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">Travel Forecast requires multi-city API</div>';
      return;
    }
    var cities = window.MockData.generateCityComparisons(current);
    var u = getUnits();

    var rows = cities.map(function (c) {
      return '<tr>' +
        '<td class="col-city">' + c.name + '</td>' +
        '<td class="col-temp">' + (c.temp - 8) + u.tempSymbol + '</td>' +
        '<td class="col-temp">' + (c.temp + 3) + u.tempSymbol + '</td>' +
        '<td class="col-center">' + c.weatherMain + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="display-travel">' +
        '<table class="ws-table">' +
          '<thead><tr><th>City</th><th>Lo</th><th>Hi</th><th>Condition</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: 36 Hour Forecast (text panel)
     ============================================================ */
  function render36Hour(forecastData, container) {
    if (!forecastData || !forecastData.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No forecast data</div>';
      return;
    }

    var u = getUnits();
    var today = forecastData[0];
    var tomorrow = forecastData[1] || {};

    var textLines = [
      today.weatherMain.toUpperCase() + ' SKIES EXPECTED.',
      'TEMPERATURES ' + (today.high > today.low ? 'RISING TO ' + today.high + u.tempSymbol : 'NEAR ' + today.high + u.tempSymbol) + '.',
      'WINDS ' + (Math.random() > 0.5 ? 'NORTH' : 'SOUTH') + ' ' + Math.round(5 + Math.random() * 15) + ' ' + u.speedUnit + '.'
    ];

    var nextPeriod = tomorrow.day ?
      tomorrow.day.toUpperCase() + '... ' + (tomorrow.weatherMain || 'PARTLY CLOUDY').toUpperCase() + '.' :
      '';

    container.innerHTML =
      '<div class="display-36hour">' +
        '<div class="forecast-text-block">' +
          textLines.map(function (line) {
            return '<div class="forecast-text-line">' + line + '</div>';
          }).join('') +
        '</div>' +
        (nextPeriod ? '<div class="forecast-next-period">' + nextPeriod + '</div>' : '') +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Regional Forecast (text panel)
     ============================================================ */
  function renderRegionalForecast(data, container) {
    var u = getUnits();
    var lines = [
      'REGIONAL CONDITIONS REMAIN STEADY.',
      data.weatherMain.toUpperCase() + ' ACROSS THE AREA.',
      'TEMPERATURES HOLDING NEAR ' + data.temp + u.tempSymbol + '.',
      'WINDS LIGHT AND VARIABLE.'
    ];

    container.innerHTML =
      '<div class="display-regional-forecast">' +
        '<div class="forecast-text-block">' +
          lines.map(function (line) {
            return '<div class="forecast-text-line">' + line + '</div>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Local Radar (canvas-based simulated radar)
     ============================================================ */
  function renderRadar(container) {
    container.innerHTML =
      '<div class="display-radar">' +
        '<div class="radar-label">Local Radar</div>' +
        '<div class="radar-canvas-container"><canvas id="radarCanvas"></canvas></div>' +
      '</div>';

    // Draw radar after DOM update
    requestAnimationFrame(function () {
      var canvas = document.getElementById('radarCanvas');
      if (!canvas) return;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      var ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      var W = rect.width, H = rect.height;
      var cx = W / 2, cy = H / 2;
      var radius = Math.min(W, H) / 2 - 10;

      // Simulated precipitation echoes (green/yellow/red blobs)
      var echoes = [
        { x: cx - 30, y: cy - 40, r: 35, color: 'rgba(0,200,0,0.4)' },
        { x: cx + 20, y: cy + 30, r: 25, color: 'rgba(255,200,0,0.4)' },
        { x: cx - 50, y: cy + 50, r: 20, color: 'rgba(0,150,0,0.3)' },
        { x: cx + 60, y: cy - 20, r: 30, color: 'rgba(255,100,0,0.3)' },
        { x: cx, y: cy - 60, r: 15, color: 'rgba(0,255,0,0.3)' },
      ];

      // Continue sweep animation
      function animateSweep() {
        if (!document.getElementById('radarCanvas')) return;
        var now = Date.now();
        var angle = (now % 4000) / 4000 * Math.PI * 2;

        // Redraw background
        ctx.fillStyle = '#0a1a4a';
        ctx.fillRect(0, 0, W, H);

        // Range rings
        ctx.strokeStyle = 'rgba(76,114,217,0.3)';
        ctx.lineWidth = 1;
        for (var k = 1; k <= 4; k++) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius * k / 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy + radius);
        ctx.stroke();

        // Precipitation echoes
        echoes.forEach(function (e) {
          var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
          grad.addColorStop(0, e.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Center dot
        ctx.fillStyle = '#f2f2f2';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Sweep line
        ctx.strokeStyle = 'rgba(0,255,136,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();

        // Sweep trail
        ctx.strokeStyle = 'rgba(0,255,136,0.1)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle - 0.3) * radius, cy + Math.sin(angle - 0.3) * radius);
        ctx.stroke();

        // Border
        ctx.strokeStyle = 'rgba(76,114,217,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Cardinal directions
        ctx.fillStyle = '#f0b13a';
        ctx.font = 'bold 14px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - radius - 5);
        ctx.fillText('S', cx, cy + radius + 15);
        ctx.fillText('E', cx + radius + 12, cy + 5);
        ctx.fillText('W', cx - radius - 12, cy + 5);

        // Range labels
        ctx.fillStyle = '#f2f2f2';
        ctx.font = '12px VT323';
        ctx.textAlign = 'center';
        var ranges = ['25mi', '50mi', '75mi', '100mi'];
        for (var j = 0; j < 4; j++) {
          ctx.fillText(ranges[j], cx + radius * (j + 1) / 4, cy - 5);
        }

        requestAnimationFrame(animateSweep);
      }

      requestAnimationFrame(animateSweep);
    });
  }

  /* ============================================================
     DISPLAY: Hourly Forecast (table)
     ============================================================ */
  function renderHourly(hourlyData, container) {
    if (!hourlyData || !hourlyData.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No hourly data available</div>';
      return;
    }
    var u = getUnits();

    var rows = hourlyData.map(function (h) {
      return '<tr>' +
        '<td class="col-city">' + h.time + '</td>' +
        '<td class="col-temp">' + h.temp + u.tempSymbol + '</td>' +
        '<td class="col-center">' + h.feelsLike + u.tempSymbol + '</td>' +
        '<td class="col-center">' + Math.round(h.windSpeed) + ' ' + u.speedUnit + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="display-hourly">' +
        '<table class="ws-table">' +
          '<thead><tr><th>Time</th><th>Temp</th><th>Feels</th><th>Wind</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  /* ============================================================
     DISPLAY: Hourly Graph (Canvas)
     ============================================================ */
  function renderHourlyGraph(hourlyData, container) {
    if (!hourlyData || !hourlyData.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--ws-white);padding:2rem;">No data</div>';
      return;
    }

    container.innerHTML =
      '<div class="display-hourly-graph">' +
        '<div class="graph-legend">' +
          '<div class="graph-legend-item"><div class="graph-legend-color" style="background:#ffcc00;"></div><span>Temperature</span></div>' +
          '<div class="graph-legend-item"><div class="graph-legend-color" style="background:#00ccff;"></div><span>Cloud %</span></div>' +
          '<div class="graph-legend-item"><div class="graph-legend-color" style="background:#00ff88;"></div><span>Precip %</span></div>' +
        '</div>' +
        '<div class="graph-canvas-container"><canvas id="graphCanvas"></canvas></div>' +
      '</div>';

    var canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    var W = rect.width, H = rect.height;

    var temps = hourlyData.map(function (h) { return h.temp; });
    var maxT = Math.max.apply(null, temps), minT = Math.min.apply(null, temps);
    var range = maxT - minT || 10;
    var pad = 40, padTop = 20, padBottom = 30;
    var graphW = W - pad * 2, graphH = H - padTop - padBottom;

    ctx.strokeStyle = 'rgba(76,114,217,0.3)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 4; i++) {
      var y = padTop + (graphH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      var val = Math.round(maxT - (range / 4) * i);
      ctx.fillStyle = '#f2f2f2'; ctx.font = '12px VT323'; ctx.textAlign = 'right';
      ctx.fillText(val + '°', pad - 5, y + 4);
    }

    ctx.textAlign = 'center'; ctx.fillStyle = '#f2f2f2';
    hourlyData.forEach(function (h, i) {
      var x = pad + (graphW / (hourlyData.length - 1)) * i;
      ctx.fillText(h.time, x, H - 8);
    });

    function drawLine(data, key, color, maxVal) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      data.forEach(function (d, i) {
        var x = pad + (graphW / (data.length - 1)) * i;
        var val = maxVal ? (d[key] / maxVal) * graphH : ((maxT - d[key]) / range) * graphH;
        var y = padTop + val;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    drawLine(hourlyData, 'temp', '#ffcc00');
    drawLine(hourlyData, 'cloudiness', '#00ccff', 100);
    drawLine(hourlyData, 'pop', '#00ff88', 100);
  }

  /* --- Export --- */
  window.Displays = {
    intro: renderIntro,
    current: renderCurrent,
    latestObservations: renderLatestObservations,
    regionalObservations: renderRegionalObservations,
    extended: renderExtended,
    almanac: renderAlmanac,
    travel: renderTravel,
    hourly: renderHourly,
    hourlyGraph: renderHourlyGraph,
    forecast36: render36Hour,
    regionalForecast: renderRegionalForecast,
    radar: renderRadar
  };
})();
