/**
 * App — WeatherSTAR 4000 Display Cycle Engine
 * Manages rotating display cycle, data fetching, UI state, intro screen, and music.
 * Based on: TWC Classics archive screenshots (1990-2002)
 */
(function () {
  'use strict';

  var state = {
    city: 'Seoul',
    apiKey: '',
    temperatureUnit: 'celsius',
    distanceUnit: 'metric',
    cycleSpeed: 10,
    updateInterval: 15,
    current: null,
    forecast: null,
    hourly: null,
    lastUpdate: null,
    isLoading: false,
    error: null,
    introShown: false
  };

  // Display cycle definition (WeatherSTAR 4000 authentic order)
  var displays = [
    { id: 'current', title: 'Current Conditions', renderer: 'current' },
    { id: 'latestObs', title: 'Latest Observations', renderer: 'latestObservations' },
    { id: 'regionalObs', title: 'Regional Observations', renderer: 'regionalObservations' },
    { id: 'forecast36', title: '36 Hour Forecast', renderer: 'forecast36' },
    { id: 'extended', title: 'Extended Forecast', renderer: 'extended' },
    { id: 'almanac', title: 'Almanac', renderer: 'almanac' },
    { id: 'travel', title: 'Travel Cities Forecast', renderer: 'travel' },
    { id: 'regionalForecast', title: 'Regional Forecast', renderer: 'regionalForecast' },
    { id: 'radar', title: 'Local Radar', renderer: 'radar' }
  ];

  var currentDisplayIndex = 0;
  var cycleTimer = null;
  var updateTimer = null;
  var introTimer = null;
  var isPlaying = true;
  var musicStarted = false;

  var els = {};

  /* --- Initialize --- */
  function init() {
    els.displayArea = document.getElementById('displayArea');
    els.displayTitle = document.getElementById('displayTitle');
    els.cityName = document.getElementById('cityName');
    els.wsClock = document.getElementById('wsClock');
    els.tickerContent = document.getElementById('tickerContent');
    els.loadingOverlay = document.getElementById('loadingOverlay');
    els.errorOverlay = document.getElementById('errorOverlay');
    els.errorText = document.getElementById('errorText');
    els.btnPrev = document.getElementById('btnPrev');
    els.btnNext = document.getElementById('btnNext');
    els.btnPlayPause = document.getElementById('btnPlayPause');
    els.btnRefresh = document.getElementById('btnRefresh');

    window.onWallpaperPropertyChange = handlePropertyChange;
    window.onWallpaperPropertiesReady = handlePropertiesReady;

    updateClock();
    setInterval(updateClock, 1000);

    if (els.btnPrev) els.btnPrev.addEventListener('click', prevDisplay);
    if (els.btnNext) els.btnNext.addEventListener('click', nextDisplay);
    if (els.btnPlayPause) els.btnPlayPause.addEventListener('click', togglePlay);
    if (els.btnRefresh) els.btnRefresh.addEventListener('click', refresh);

    loadProperties();
  }

  function loadProperties() {
    if (window.wallpaper) {
      var props = window.wallpaper.getProperties();
      state.city = props.city || state.city;
      state.apiKey = props.apiKey || state.apiKey;
      state.temperatureUnit = props.temperatureUnit || 'celsius';
      state.distanceUnit = props.distanceUnit || 'metric';
      state.cycleSpeed = parseInt(props.cycleSpeed, 10) || 10;
      state.updateInterval = parseInt(props.updateInterval, 10) || 15;
    }

    if (!state.apiKey) {
      showError('API Key not configured.\nPlease click "Edit" in Wallpaper Engine\nand set your OpenWeatherMap API Key.');
      return;
    }

    // Show intro first, then load data
    showIntro();
  }

  function handlePropertyChange(key, value) {
    switch (key) {
      case 'city':
        state.city = value;
        refresh();
        break;
      case 'apiKey':
        state.apiKey = value;
        if (value) refresh();
        break;
      case 'temperatureUnit':
        state.temperatureUnit = value;
        if (state.current) showCurrentDisplay();
        break;
      case 'distanceUnit':
        state.distanceUnit = value;
        if (state.current) showCurrentDisplay();
        break;
      case 'cycleSpeed':
        state.cycleSpeed = parseInt(value, 10) || 10;
        if (isPlaying) restartCycle();
        break;
      case 'updateInterval':
        state.updateInterval = parseInt(value, 10) || 15;
        restartUpdateTimer();
        break;
    }
  }

  function handlePropertiesReady(props) {
    state.city = props.city || state.city;
    state.apiKey = props.apiKey || state.apiKey;
    state.temperatureUnit = props.temperatureUnit || 'celsius';
    state.distanceUnit = props.distanceUnit || 'metric';
    state.cycleSpeed = parseInt(props.cycleSpeed, 10) || 10;
    state.updateInterval = parseInt(props.updateInterval, 10) || 15;

    if (!state.apiKey) {
      showError('API Key not configured.\nAdd ?apiKey=YOUR_KEY to URL for testing.');
      return;
    }

    showIntro();
  }

  /* --- Intro Screen (15 seconds) --- */
  function showIntro() {
    if (els.cityName) els.cityName.textContent = state.city;
    startMusic();

    var Displays = window.Displays;
    var screen = document.createElement('div');
    screen.className = 'display-screen';
    Displays.intro(screen);

    // Set intro city name
    setTimeout(function () {
      var introCity = document.getElementById('introCity');
      if (introCity) introCity.textContent = state.city.toUpperCase();
    }, 500);

    els.displayArea.innerHTML = '';
    els.displayArea.appendChild(screen);
    els.displayTitle.textContent = 'WeatherSTAR 4000';

    // Show intro for 15 seconds, then load data
    introTimer = setTimeout(function () {
      refresh();
    }, 15000);
  }

  /* --- Background Music --- */
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;

    var audio = document.getElementById('bgMusic');
    if (audio) {
      audio.volume = 0.15; // Low volume for background
      audio.play().catch(function () {
        // Autoplay blocked — will start on user interaction
        document.addEventListener('click', function startOnClick() {
          audio.play().catch(function () {});
          document.removeEventListener('click', startOnClick);
        }, { once: true });
      });
    }
  }

  /* --- Data Fetching --- */
  function refresh() {
    if (!state.apiKey) return;
    if (introTimer) { clearTimeout(introTimer); introTimer = null; }

    state.isLoading = true;
    state.error = null;
    hideError();
    showLoading(true);

    var WS = window.WeatherService;
    var apiUnit = state.temperatureUnit === 'fahrenheit' ? 'imperial' : 'metric';

    var p1 = WS.fetchCurrentWeather(state.city, state.apiKey, apiUnit);
    var p2 = WS.fetchForecast(state.city, state.apiKey, apiUnit);
    var p3 = WS.fetchHourlyData(state.city, state.apiKey, apiUnit);

    Promise.all([p1, p2, p3])
      .then(function (results) {
        state.current = results[0];
        state.forecast = results[1];
        state.hourly = results[2];
        state.lastUpdate = new Date();
        state.isLoading = false;
        state.introShown = true;
        showLoading(false);

        if (els.cityName) els.cityName.textContent = state.city;

        currentDisplayIndex = 0;
        showCurrentDisplay();
        startCycle();
        startUpdateTimer();
        updateTicker();
      })
      .catch(function (err) {
        state.isLoading = false;
        showLoading(false);

        if (err.message === 'INVALID_API_KEY') {
          showError('Invalid API Key.\nPlease check your OpenWeatherMap API Key\nin Wallpaper Engine settings.');
        } else if (err.message === 'CITY_NOT_FOUND') {
          showError('City "' + state.city + '" not found.\nPlease check the spelling in settings.');
        } else if (err.message === 'RATE_LIMIT') {
          showError('API rate limit reached.\nPlease wait before the next update.');
        } else {
          var cached = WS.getCache('current_' + state.city);
          if (cached) {
            state.current = cached;
            state.forecast = WS.getCache('forecast_' + state.city);
            state.hourly = WS.getCache('hourly_' + state.city);
            state.lastUpdate = new Date();
            state.introShown = true;
            currentDisplayIndex = 0;
            showCurrentDisplay();
            startCycle();
            updateTicker();
          } else {
            showError('Unable to fetch weather data.\nPlease check your network connection.');
          }
        }
      });
  }

  /* --- Display Cycle --- */
  function showCurrentDisplay() {
    var display = displays[currentDisplayIndex];
    var container = els.displayArea;

    els.displayTitle.textContent = display.title;

    var screen = document.createElement('div');
    screen.className = 'display-screen';

    var Displays = window.Displays;
    switch (display.renderer) {
      case 'current':
        Displays.current(state.current, screen);
        break;
      case 'latestObservations':
        Displays.latestObservations(state.current, screen);
        break;
      case 'regionalObservations':
        Displays.regionalObservations(state.current, screen);
        break;
      case 'forecast36':
        Displays.forecast36(state.forecast, screen);
        break;
      case 'extended':
        Displays.extended(state.forecast, screen);
        break;
      case 'almanac':
        Displays.almanac(state.current, screen);
        break;
      case 'travel':
        Displays.travel(state.current, screen);
        break;
      case 'regionalForecast':
        Displays.regionalForecast(state.current, screen);
        break;
      case 'radar':
        Displays.radar(screen);
        break;
    }

    container.innerHTML = '';
    container.appendChild(screen);

    // Redraw graph after DOM update
    if (display.renderer === 'hourlyGraph') {
      requestAnimationFrame(function () {
        Displays.hourlyGraph(state.hourly, container);
      });
    }
  }

  function nextDisplay() {
    currentDisplayIndex = (currentDisplayIndex + 1) % displays.length;
    showCurrentDisplay();
    if (isPlaying) restartCycle();
  }

  function prevDisplay() {
    currentDisplayIndex = (currentDisplayIndex - 1 + displays.length) % displays.length;
    showCurrentDisplay();
    if (isPlaying) restartCycle();
  }

  function startCycle() {
    if (cycleTimer) clearTimeout(cycleTimer);
    if (!isPlaying) return;
    cycleTimer = setTimeout(function () {
      nextDisplay();
    }, state.cycleSpeed * 1000);
  }

  function restartCycle() {
    if (cycleTimer) clearTimeout(cycleTimer);
    startCycle();
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (els.btnPlayPause) {
      els.btnPlayPause.textContent = isPlaying ? '\u23F8' : '\u25B6';
    }
    if (isPlaying) {
      startCycle();
    } else {
      if (cycleTimer) clearTimeout(cycleTimer);
    }
  }

  /* --- Update Timer --- */
  function startUpdateTimer() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(function () {
      refresh();
    }, state.updateInterval * 60 * 1000);
  }

  function restartUpdateTimer() {
    if (updateTimer) clearTimeout(updateTimer);
    startUpdateTimer();
  }

  /* --- UI Helpers --- */
  function updateClock() {
    if (!els.wsClock) return;
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var timeStr = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    var dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    var dateStr = dayNames[now.getDay()] + ' ' + monthNames[now.getMonth()] + ' ' + now.getDate();

    els.wsClock.innerHTML =
      '<div class="clock-time">' + timeStr + '</div>' +
      '<div class="clock-date">' + dateStr + '</div>';
  }

  function updateTicker() {
    if (!state.current || !els.tickerContent) return;
    var c = state.current;
    var sym = state.temperatureUnit === 'fahrenheit' ? 'F' : 'C';
    var windDir = window.WeatherService.getWindDirection(c.windDeg);
    var text = 'Retro Weather Cast | ' + c.city + ': ' + c.temp + '°' + sym + ' ' + c.weatherMain +
      ' | Wind: ' + windDir + ' ' + Math.round(c.windSpeed) +
      ' | Humidity: ' + c.humidity + '%' +
      ' | Pressure: ' + c.pressure +
      ' | Feels Like: ' + c.feelsLike + '°' + sym +
      ' | Updated: ' + (els.wsClock.querySelector('.clock-time') ? els.wsClock.querySelector('.clock-time').textContent : '') +
      ' | WeatherSTAR 4000 Style Forecast | ';
    els.tickerContent.textContent = text;
  }

  function showLoading(show) {
    if (els.loadingOverlay) els.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  function showError(message) {
    state.error = message;
    if (els.errorOverlay) {
      els.errorOverlay.classList.remove('hidden');
      els.errorText.textContent = message;
    }
    showLoading(false);
  }

  function hideError() {
    if (els.errorOverlay) els.errorOverlay.classList.add('hidden');
  }

  // Expose
  window.app = {
    init: init,
    refresh: refresh,
    nextDisplay: nextDisplay,
    prevDisplay: prevDisplay,
    togglePlay: togglePlay,
    getState: function () { return Object.assign({}, state); }
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
