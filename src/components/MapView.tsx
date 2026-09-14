import { useEffect, useRef } from "react";
import maplibregl, {
  type GeoJSONSource,
  type LayerSpecification,
  type Map,
  type StyleSpecification
} from "maplibre-gl";

import type {
  EntityType,
  FeatureCollection,
  MapIntelligenceResponse
} from "../api/types";
import { useMapStore, type LayerKey } from "../state/mapStore";

const sourceLayerPairs: Array<{
  source: keyof MapIntelligenceResponse["layers"];
  layer: LayerKey;
  ids: string[];
}> = [
  { source: "catchments", layer: "catchments", ids: ["catchment-fill", "catchment-line"] },
  { source: "wards", layer: "wards", ids: ["ward-line"] },
  { source: "rainfall", layer: "rainfall", ids: ["rainfall-fill"] },
  { source: "rivers", layer: "rivers", ids: ["river-line"] },
  { source: "drains", layer: "drains", ids: ["drain-line"] },
  { source: "roads", layer: "roads", ids: ["road-line"] },
  { source: "landslide", layer: "landslide", ids: ["landslide-fill"] },
  { source: "closures", layer: "closures", ids: ["closure-line"] },
  { source: "shelters", layer: "shelters", ids: ["shelter-circle"] },
  { source: "sensors", layer: "sensors", ids: ["sensor-circle"] },
  { source: "routes", layer: "routes", ids: ["route-line"] }
];

export function MapView({ snapshot }: { snapshot: MapIntelligenceResponse }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const initialLayersRef = useRef(snapshot.layers);
  const selectEntity = useMapStore((state) => state.selectEntity);
  const enabledLayers = useMapStore((state) => state.enabledLayers);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [78.042, 30.331],
      zoom: 13,
      pitch: 42,
      bearing: -8,
      attributionControl: false,
      style: baseStyle(initialLayersRef.current)
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      "bottom-right"
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      registerClicks(map, selectEntity);
      updateLayerVisibility(
        map,
        useMapStore.getState().enabledLayers
      );
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [selectEntity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    for (const key of Object.keys(snapshot.layers) as Array<
      keyof MapIntelligenceResponse["layers"]
    >) {
      const source = map.getSource(key) as GeoJSONSource | undefined;
      source?.setData(
        snapshot.layers[key] as unknown as Parameters<
          GeoJSONSource["setData"]
        >[0]
      );
    }
  }, [snapshot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    updateLayerVisibility(map, enabledLayers);
  }, [enabledLayers]);

  return <div className="map" ref={containerRef} />;
}

function baseStyle(
  layers: MapIntelligenceResponse["layers"]
): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "OpenStreetMap contributors"
      },
      catchments: geo(layers.catchments),
      wards: geo(layers.wards),
      rainfall: geo(layers.rainfall),
      rivers: geo(layers.rivers),
      drains: geo(layers.drains),
      roads: geo(layers.roads),
      landslide: geo(layers.landslide),
      closures: geo(layers.closures),
      sensors: geo(layers.sensors),
      shelters: geo(layers.shelters),
      routes: geo(layers.routes)
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          "raster-saturation": -0.45,
          "raster-contrast": -0.08,
          "raster-brightness-min": 0.15,
          "raster-brightness-max": 0.92
        }
      },
      fill("catchment-fill", "catchments", [
        "match",
        ["get", "risk_level"],
        "LOW",
        "#4fb477",
        "WATCH",
        "#d8b747",
        "WARNING",
        "#f18d38",
        "HIGH",
        "#db4e3f",
        "SEVERE",
        "#7e1f2d",
        "#8aa398"
      ], 0.34),
      line("catchment-line", "catchments", "#213b34", 2.4),
      line("ward-line", "wards", "#59645f", 1.2),
      fill("rainfall-fill", "rainfall", "#2d95a3", 0.2),
      line("river-line", "rivers", "#2e7ea6", 3),
      line("drain-line", "drains", "#1d6a73", 5),
      line("road-line", "roads", [
        "match",
        ["get", "recommendation"],
        "PASSABLE",
        "#4fb477",
        "CAUTION",
        "#d8b747",
        "AVOID",
        "#db4e3f",
        "CLOSED",
        "#2a2c2b",
        "#8aa398"
      ], 6),
      fill("landslide-fill", "landslide", "#8b5a44", 0.28),
      line("closure-line", "closures", "#111111", 7),
      circle("sensor-circle", "sensors", "#f5f0dc", "#1d6a73", 8),
      circle("shelter-circle", "shelters", "#ffffff", "#4fb477", 9),
      line("route-line", "routes", "#f5f0dc", 4)
    ] as LayerSpecification[]
  } as StyleSpecification;
}

function geo(data: FeatureCollection) {
  return {
    type: "geojson",
    data
  } as const;
}

function fill(
  id: string,
  source: string,
  color: unknown,
  opacity: number
): LayerSpecification {
  return {
    id,
    type: "fill",
    source,
    paint: {
      "fill-color": color,
      "fill-opacity": opacity
    }
  } as LayerSpecification;
}

function line(
  id: string,
  source: string,
  color: unknown,
  width: number
): LayerSpecification {
  return {
    id,
    type: "line",
    source,
    layout: {
      "line-cap": "round",
      "line-join": "round"
    },
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": 0.9
    }
  } as LayerSpecification;
}

function circle(
  id: string,
  source: string,
  color: string,
  stroke: string,
  radius: number
): LayerSpecification {
  return {
    id,
    type: "circle",
    source,
    paint: {
      "circle-radius": radius,
      "circle-color": color,
      "circle-stroke-color": stroke,
      "circle-stroke-width": 3
    }
  } as LayerSpecification;
}

function registerClicks(
  map: Map,
  selectEntity: (type: EntityType, id: string) => void
) {
  const layers: Array<[string, EntityType]> = [
    ["catchment-fill", "catchment"],
    ["drain-line", "drain"],
    ["road-line", "road"],
    ["sensor-circle", "sensor"]
  ];

  layers.forEach(([layerId, entityType]) => {
    map.on("click", layerId, (event) => {
      const feature = event.features?.[0];
      const id = String(feature?.id ?? feature?.properties?.id ?? "");
      if (id) {
        selectEntity(entityType, id);
      }
    });
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  });
}

function updateLayerVisibility(
  map: Map,
  enabled: Record<LayerKey, boolean>
) {
  for (const pair of sourceLayerPairs) {
    const visible = enabled[pair.layer] ? "visible" : "none";
    pair.ids.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible);
      }
    });
  }
}
