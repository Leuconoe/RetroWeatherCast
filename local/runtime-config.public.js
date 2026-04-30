var RETRO_MAPBOX_API_TOKEN = "pk.eyJ1Ijoid2VhdGhlciIsImEiOiJjbW5odndtNXAwNnY2MnhxMmVzaHMxbTRhIn0.18Tf0kI3xCSwtBuCcbbroQ";

var RETRO_RASTER_MAP_STYLE = {
  version: 8,
  glyphs: "https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=" + RETRO_MAPBOX_API_TOKEN,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "OpenStreetMap"
    }
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster",
      source: "osm-raster",
      paint: {
        "raster-opacity": 0.72,
        "raster-saturation": -0.55,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.82,
        "raster-contrast": 0.22
      }
    }
  ]
};

window.RETRO_WEATHER_CONFIG = {
  mapboxApiToken: RETRO_MAPBOX_API_TOKEN,
  weatherApiKey: "b7f0783d80e94fd4b0783d80e94fd48b",
  mapboxRegionalStyle: RETRO_RASTER_MAP_STYLE,
  mapboxRadarStyle: RETRO_RASTER_MAP_STYLE,
  pusherKey: "fdb105c1defe52e0b882",
  pusherCluster: "us2",
  partyHost: "weatherstar.netmaker.dev",
  gtmId: "GTM-5SNHPFVS"
};
