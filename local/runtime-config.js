(function () {
  function readSearchConfig() {
    var params = new URLSearchParams(window.location.search);
    var config = {};

    [
      "mapboxApiToken",
      "weatherApiKey",
      "mapboxRegionalStyle",
      "mapboxRadarStyle",
      "pusherKey",
      "pusherCluster",
      "partyHost",
      "gtmId"
    ].forEach(function (key) {
      var value = params.get(key);
      if (typeof value === "string" && value.trim()) {
        config[key] = value.trim();
      }
    });

    return config;
  }

  function readStorageConfig() {
    try {
      return JSON.parse(localStorage.getItem("RETRO_WEATHER_CONFIG") || "{}");
    } catch (_) {
      return {};
    }
  }

  function applyRetroWeatherConfig() {
    var nuxtPublicConfig =
      window.__NUXT__ &&
      window.__NUXT__.config &&
      window.__NUXT__.config.public;

    if (!nuxtPublicConfig) {
      return;
    }

    var config = Object.assign(
      {},
      readStorageConfig(),
      window.RETRO_WEATHER_CONFIG || {},
      readSearchConfig()
    );

    [
      "mapboxApiToken",
      "weatherApiKey",
      "mapboxRegionalStyle",
      "mapboxRadarStyle",
      "pusherKey",
      "pusherCluster",
      "partyHost",
      "gtmId"
    ].forEach(function (key) {
      if (typeof config[key] === "string" && config[key].trim()) {
        nuxtPublicConfig[key] = config[key].trim();
      }
    });
  }

  applyRetroWeatherConfig();
})();
