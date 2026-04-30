/**
 * Mock Data — City Comparisons (Development Only)
 * Generates simulated regional weather data based on current conditions.
 * NOT used in production — remove or replace with real multi-city API calls.
 */
(function () {
  'use strict';

  function generateCityComparisons(current) {
    var WS = window.WeatherService || { getWindDirection: function(d) {
      var dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
      return dirs[Math.round(d / 22.5) % 16];
    }};
    var cities = [
      { name: 'Busan', offset: -2, windOff: 5 },
      { name: 'Daejeon', offset: 1, windOff: -2 },
      { name: 'Gwangju', offset: 0, windOff: 3 },
      { name: 'Incheon', offset: -1, windOff: 1 },
      { name: 'Seoul', offset: 0, windOff: 0 },
      { name: 'Daegu', offset: 2, windOff: -1 },
      { name: 'Jeju', offset: 3, windOff: 8 }
    ];
    var conditions = { 800: 'Clear', 801: 'Partly Cloudy', 802: 'Partly Cloudy', 803: 'Cloudy', 804: 'Overcast', 500: 'Rain', 501: 'Rain', 300: 'Drizzle', 200: 'Thunderstorm', 600: 'Snow', 701: 'Mist' };
    return cities.map(function (c) {
      var codeVariation = (c.offset * 137 + c.windOff * 73) % 900;
      var code = codeVariation < 200 ? 800 : codeVariation < 400 ? 802 : codeVariation < 600 ? 500 : 803;
      return {
        name: c.name,
        temp: current.temp + c.offset,
        weatherCode: code,
        weatherMain: conditions[code] || 'Cloudy',
        windSpeed: Math.max(0, current.windSpeed + c.windOff),
        windDeg: (current.windDeg + c.windOff * 30) % 360,
        humidity: Math.min(100, Math.max(10, current.humidity + c.offset * 3)),
        pressure: (parseFloat(current.pressure) + c.offset * 0.01).toFixed(2)
      };
    });
  }

  window.MockData = {
    generateCityComparisons: generateCityComparisons
  };
})();
