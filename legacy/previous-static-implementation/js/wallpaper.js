/**
 * WallpaperBridge — Wallpaper Engine Property Integration
 * Design Ref: §5.1 — Property Bridge
 *
 * Priority: WE API > window.LOCAL_CONFIG > .env fetch > URL params
 */
(function () {
  'use strict';

  var defaultProperties = {
    city: 'Seoul',
    apiKey: '',
    temperatureUnit: 'celsius',
    distanceUnit: 'metric',
    cycleSpeed: 10,
    updateInterval: 15
  };

  var currentProperties = Object.assign({}, defaultProperties);

  function onPropertyChange(key, value) {
    if (currentProperties[key] !== value) {
      currentProperties[key] = value;
      if (typeof window.onWallpaperPropertyChange === 'function') {
        window.onWallpaperPropertyChange(key, value);
      }
    }
  }

  function getProperties() {
    return Object.assign({}, currentProperties);
  }

  function getProperty(key) {
    return currentProperties[key];
  }

  function parseEnv(text) {
    var result = {};
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) === '#') continue;
      var eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;
      var key = line.substring(0, eqIndex).trim().toLowerCase();
      var val = line.substring(eqIndex + 1).trim();
      if ((val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
          (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'")) {
        val = val.substring(1, val.length - 1);
      }
      result[key] = val;
    }
    return result;
  }

  function initProperties() {
    // 1. Wallpaper Engine API
    if (typeof window.wallpaperPropertyListener !== 'undefined') {
      return;
    }

    // 2. window.LOCAL_CONFIG (js/config.js — gitignored)
    if (typeof window.LOCAL_CONFIG !== 'undefined' && window.LOCAL_CONFIG.apiKey) {
      currentProperties.apiKey = window.LOCAL_CONFIG.apiKey;
      if (window.LOCAL_CONFIG.city) currentProperties.city = window.LOCAL_CONFIG.city;
      if (window.LOCAL_CONFIG.temperatureUnit) currentProperties.temperatureUnit = window.LOCAL_CONFIG.temperatureUnit;
      if (window.LOCAL_CONFIG.distanceUnit) currentProperties.distanceUnit = window.LOCAL_CONFIG.distanceUnit;
      if (window.LOCAL_CONFIG.cycleSpeed) currentProperties.cycleSpeed = parseInt(window.LOCAL_CONFIG.cycleSpeed, 10) || 10;
      if (window.LOCAL_CONFIG.updateInterval) currentProperties.updateInterval = parseInt(window.LOCAL_CONFIG.updateInterval, 10) || 15;
    }

    // 3. .env file fallback
    fetch('.env')
      .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
      .then(function (text) {
        var env = parseEnv(text);
        if (env.api_key && !currentProperties.apiKey) currentProperties.apiKey = env.api_key;
        if (env.city && !currentProperties.city) currentProperties.city = env.city;
        if (env.temp_unit && !currentProperties.temperatureUnit) currentProperties.temperatureUnit = env.temp_unit;
        if (env.dist_unit && !currentProperties.distanceUnit) currentProperties.distanceUnit = env.dist_unit;
        if (env.cycle_speed && currentProperties.cycleSpeed === 10) currentProperties.cycleSpeed = parseInt(env.cycle_speed, 10);
        if (env.update_interval && currentProperties.updateInterval === 15) currentProperties.updateInterval = parseInt(env.update_interval, 10);
      })
      .catch(function () {})
      .then(function () {
        // 4. URL params override everything
        var params = new URLSearchParams(window.location.search);
        if (params.has('city')) currentProperties.city = params.get('city');
        if (params.has('apiKey')) currentProperties.apiKey = params.get('apiKey');
        if (params.has('temperatureUnit')) currentProperties.temperatureUnit = params.get('temperatureUnit');
        if (params.has('distanceUnit')) currentProperties.distanceUnit = params.get('distanceUnit');
        if (params.has('cycleSpeed')) currentProperties.cycleSpeed = parseInt(params.get('cycleSpeed'), 10) || 10;
        if (params.has('updateInterval')) currentProperties.updateInterval = parseInt(params.get('updateInterval'), 10) || 15;

        if (typeof window.onWallpaperPropertiesReady === 'function') {
          window.onWallpaperPropertiesReady(currentProperties);
        }
      });
  }

  window.wallpaper = {
    onPropertyChange: onPropertyChange,
    getProperties: getProperties,
    getProperty: getProperty,
    initProperties: initProperties
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProperties);
  } else {
    initProperties();
  }
})();
