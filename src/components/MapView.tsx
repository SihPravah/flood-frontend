import { useEffect, useRef, type MutableRefObject } from "react";
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
import {
  useMapStore,
  type BasemapKey,
  type LayerKey
} from "../state/mapStore";

const layerGroups: Record<LayerKey, string[]> = {
  catchments: ["catchment-fill", "catchment-line", "catchment-label"],
  wards: ["ward-fill", "ward-line", "ward-label"],
  rainfall: ["rainfall-fill", "rainfall-label"],
  sensors: ["sensor-circle", "sensor-ring", "sensor-label"],
  rivers: ["river-line", "river-label"],
  drains: ["drain-casing", "drain-line", "drain-label"],
  roads: ["road-casing", "road-line", "road-avoid-line", "road-label"],
  landslide: ["landslide-fill", "landslide-line", "landslide-label"],
  closures: ["closure-line", "closure-label"],
  shelters: ["shelter-circle", "shelter-ring", "shelter-label"],
  routes: ["route-casing", "route-line", "route-label"]
};

const interactiveLayers: Array<{
  id: string;
  type: EntityType;
  label: string;
}> = [
  { id: "catchment-fill", type: "catchment", label: "Catchment" },
  { id: "ward-fill", type: "ward", label: "Ward" },
  { id: "landslide-fill", type: "landslide", label: "Landslide" },
  { id: "drain-line", type: "drain", label: "Drain" },
  { id: "road-line", type: "road", label: "Road" },
  { id: "road-avoid-line", type: "road", label: "Road" },
  { id: "closure-line", type: "road", label: "Authority closure" },
  { id: "sensor-circle", type: "sensor", label: "Sensor" },
  { id: "shelter-circle", type: "shelter", label: "Shelter" },
  { id: "route-line", type: "route", label: "Route" }
];

const selectedLayers = [
  "selected-catchment-fill",
  "selected-catchment-line",
  "selected-ward-fill",
  "selected-ward-line",
  "selected-landslide-fill",
  "selected-landslide-line",
  "selected-drain-line",
  "selected-road-line",
  "selected-closure-line",
  "selected-sensor-circle",
  "selected-shelter-circle",
  "selected-route-line"
];

export function MapView({ snapshot }: { snapshot: MapIntelligenceResponse }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const tooltipRef = useRef<maplibregl.Popup | null>(null);
  const initialLayersRef = useRef(snapshot.layers);
  const selectEntity = useMapStore((state) => state.selectEntity);
  const setHoverCoordinates = useMapStore((state) => state.setHoverCoordinates);
  const selectedEntity = useMapStore((state) => state.selectedEntity);
  const enabledLayers = useMapStore((state) => state.enabledLayers);
  const layerOpacity = useMapStore((state) => state.layerOpacity);
  const basemap = useMapStore((state) => state.basemap);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const tooltip = tooltipRef;
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [78.042, 30.331],
      zoom: 13,
      minZoom: 10.5,
      pitch: 48,
      bearing: -10,
      attributionControl: false,
      style: baseStyle(initialLayersRef.current)
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true
      }),
      "top-left"
    );
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      fitSnapshotBounds(map, initialLayersRef.current);
      registerInteractions(map, selectEntity, setHoverCoordinates, tooltipRef);
      updateLayerVisibility(map, useMapStore.getState().enabledLayers);
      updateLayerOpacity(map, useMapStore.getState().layerOpacity);
      updateBasemap(map, useMapStore.getState().basemap);
      updateSelection(map, useMapStore.getState().selectedEntity);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      tooltip.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [selectEntity, setHoverCoordinates]);

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
    updateSelection(map, selectedEntity);
  }, [snapshot, selectedEntity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    updateLayerVisibility(map, enabledLayers);
  }, [enabledLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    updateLayerOpacity(map, layerOpacity);
  }, [layerOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    updateBasemap(map, basemap);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) {
      return;
    }
    updateSelection(map, selectedEntity);
    if (selectedEntity?.type === "location" && selectedEntity.coordinates) {
      map.easeTo({
        center: selectedEntity.coordinates,
        duration: 420
      });
    }
  }, [selectedEntity]);

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
          "raster-saturation": -0.7,
          "raster-contrast": -0.12,
          "raster-brightness-min": 0.1,
          "raster-brightness-max": 0.72
        }
      },
      fill("rainfall-fill", "rainfall", "#3aa0ba", 0.28),
      fill("catchment-fill", "catchments", riskColor(), 0.52),
      line("catchment-line", "catchments", "#f4f7fb", 2.2, 0.84),
      symbol("catchment-label", "catchments", ["get", "name"], 12, "#eaf2f5"),
      fill("ward-fill", "wards", "#122936", 0.12),
      line("ward-line", "wards", "#98a9b4", 1.2, 0.78, [2, 2]),
      symbol("ward-label", "wards", ["get", "name"], 11, "#c9d6dd"),
      line("river-line", "rivers", "#4aa3d7", 3.2, 0.9),
      symbol("river-label", "rivers", ["get", "name"], 11, "#8bd4ff"),
      fill("landslide-fill", "landslide", landslideColor(), 0.36),
      line("landslide-line", "landslide", "#f3b38d", 1.6, 0.86, [1.2, 1.4]),
      symbol("landslide-label", "landslide", ["get", "name"], 11, "#ffd1b6"),
      line("drain-casing", "drains", "#071113", 6.8, 0.82),
      line("drain-line", "drains", drainColor(), 4.2, 0.95),
      symbol("drain-label", "drains", ["get", "name"], 11, "#aceaf0"),
      line("road-casing", "roads", "#061011", 8.5, 0.75),
      line("road-line", "roads", roadColor(), 5.4, 0.95),
      {
        ...line("road-avoid-line", "roads", "#ff7b47", 6.2, 0.98, [1.2, 1.2]),
        filter: ["==", ["get", "recommendation"], "AVOID"]
      } as LayerSpecification,
      symbol("road-label", "roads", ["get", "name"], 11, "#f0f4f7"),
      line("closure-line", "closures", "#111317", 9.5, 1, [0.8, 0.7]),
      symbol("closure-label", "closures", "CLOSED", 12, "#ffffff"),
      line("route-casing", "routes", "#101518", 7, 0.85),
      line("route-line", "routes", "#f5f0dc", 4.6, 1),
      symbol("route-label", "routes", "recommended", 11, "#fff7cf"),
      circle("sensor-circle", "sensors", sensorColor(), "#061011", 7.5, 1),
      circle("sensor-ring", "sensors", "rgba(255,255,255,0)", sensorColor(), 12, 0.8),
      symbol("sensor-label", "sensors", ["get", "id"], 10, "#f4f7fb"),
      circle("shelter-circle", "shelters", "#eefbf5", "#2fc77d", 8.5, 1),
      circle("shelter-ring", "shelters", "rgba(255,255,255,0)", "#2fc77d", 14, 0.7),
      symbol("shelter-label", "shelters", ["get", "name"], 11, "#e9fff4"),
      fill("selected-catchment-fill", "catchments", "#ffffff", 0.2, noMatch()),
      line("selected-catchment-line", "catchments", "#ffffff", 4.2, 1, undefined, noMatch()),
      fill("selected-ward-fill", "wards", "#7dd3fc", 0.2, noMatch()),
      line("selected-ward-line", "wards", "#7dd3fc", 3.6, 1, undefined, noMatch()),
      fill("selected-landslide-fill", "landslide", "#ffd166", 0.24, noMatch()),
      line("selected-landslide-line", "landslide", "#ffd166", 3.2, 1, undefined, noMatch()),
      line("selected-drain-line", "drains", "#ffffff", 7, 1, undefined, noMatch()),
      line("selected-road-line", "roads", "#ffffff", 8.2, 1, undefined, noMatch()),
      line("selected-closure-line", "closures", "#ffffff", 11, 1, undefined, noMatch()),
      circle("selected-sensor-circle", "sensors", "#ffffff", "#111317", 13, 1, noMatch()),
      circle("selected-shelter-circle", "shelters", "#ffffff", "#2fc77d", 14, 1, noMatch()),
      line("selected-route-line", "routes", "#ffffff", 7.5, 1, undefined, noMatch())
    ] as LayerSpecification[]
  } as StyleSpecification;
}

function geo(data: FeatureCollection) {
  return {
    type: "geojson",
    data
  } as const;
}

function fitSnapshotBounds(
  map: Map,
  layers: MapIntelligenceResponse["layers"]
) {
  const coordinates: Array<[number, number]> = [];
  Object.values(layers).forEach((collection) => {
    collection.features.forEach((feature) => {
      collectCoordinates(feature.geometry.coordinates, coordinates);
    });
  });

  if (coordinates.length === 0) {
    return;
  }

  const bounds = coordinates.reduce(
    (nextBounds, coordinate) => nextBounds.extend(coordinate),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
  );

  map.fitBounds(bounds, {
    padding: { top: 74, right: 54, bottom: 78, left: 54 },
    maxZoom: 13.25,
    duration: 0
  });
}

function collectCoordinates(
  value: unknown,
  coordinates: Array<[number, number]>
) {
  if (!Array.isArray(value)) {
    return;
  }

  if (typeof value[0] === "number" && typeof value[1] === "number") {
    coordinates.push([value[0], value[1]]);
    return;
  }

  value.forEach((child) => collectCoordinates(child, coordinates));
}

function riskColor() {
  return [
    "match",
    ["get", "risk_level"],
    "LOW",
    "#46b57f",
    "WATCH",
    "#d6b748",
    "WARNING",
    "#f08a37",
    "HIGH",
    "#e05243",
    "SEVERE",
    "#a01f47",
    "#8899a3"
  ];
}

function landslideColor() {
  return [
    "match",
    ["get", "risk_level"],
    "LOW",
    "#8bbf80",
    "WATCH",
    "#d5a953",
    "WARNING",
    "#d47a45",
    "HIGH",
    "#b74338",
    "SEVERE",
    "#8e1f38",
    "#94644c"
  ];
}

function roadColor() {
  return [
    "match",
    ["get", "recommendation"],
    "PASSABLE",
    "#52c17e",
    "CAUTION",
    "#d8b747",
    "AVOID",
    "#ff7b47",
    "CLOSED",
    "#f4f7fb",
    "#9aa6ad"
  ];
}

function drainColor() {
  return [
    "step",
    ["to-number", ["get", "utilization"], 0],
    "#35c6c8",
    0.5,
    "#80d070",
    0.75,
    "#d8b747",
    0.9,
    "#f08a37",
    1,
    "#ef5350"
  ];
}

function sensorColor() {
  return [
    "match",
    ["get", "freshness"],
    "GOOD",
    "#48d597",
    "DEGRADED",
    "#d8b747",
    "UNUSABLE",
    "#ef5350",
    "#f5f0dc"
  ];
}

function fill(
  id: string,
  source: string,
  color: unknown,
  opacity: number,
  filter?: unknown[]
): LayerSpecification {
  return {
    id,
    type: "fill",
    source,
    ...(filter ? { filter } : {}),
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
  width: number,
  opacity = 0.9,
  dasharray?: number[],
  filter?: unknown[]
): LayerSpecification {
  return {
    id,
    type: "line",
    source,
    ...(filter ? { filter } : {}),
    layout: {
      "line-cap": "round",
      "line-join": "round"
    },
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": opacity,
      ...(dasharray ? { "line-dasharray": dasharray } : {})
    }
  } as LayerSpecification;
}

function circle(
  id: string,
  source: string,
  color: unknown,
  stroke: unknown,
  radius: number,
  opacity = 1,
  filter?: unknown[]
): LayerSpecification {
  return {
    id,
    type: "circle",
    source,
    ...(filter ? { filter } : {}),
    paint: {
      "circle-radius": radius,
      "circle-color": color,
      "circle-opacity": opacity,
      "circle-stroke-color": stroke,
      "circle-stroke-width": 2.5,
      "circle-stroke-opacity": opacity
    }
  } as LayerSpecification;
}

function symbol(
  id: string,
  source: string,
  text: unknown,
  size: number,
  color: string
): LayerSpecification {
  return {
    id,
    type: "symbol",
    source,
    minzoom: 12,
    layout: {
      "text-field": text,
      "text-size": size,
      "text-font": ["Noto Sans Regular"],
      "text-offset": [0, 1.1],
      "text-anchor": "top",
      "text-allow-overlap": false
    },
    paint: {
      "text-color": color,
      "text-halo-color": "rgba(5, 10, 13, 0.85)",
      "text-halo-width": 1.4
    }
  } as LayerSpecification;
}

function registerInteractions(
  map: Map,
  selectEntity: (
    type: EntityType,
    id: string,
    coordinates?: [number, number]
  ) => void,
  setHoverCoordinates: (coordinates: [number, number] | null) => void,
  tooltipRef: MutableRefObject<maplibregl.Popup | null>
) {
  interactiveLayers.forEach(({ id, type }) => {
    map.on("click", id, (event) => {
      const feature = event.features?.[0];
      const featureId = String(feature?.id ?? feature?.properties?.id ?? "");
      if (featureId) {
        selectEntity(type, featureId, [event.lngLat.lng, event.lngLat.lat]);
      }
    });
  });

  map.on("click", (event) => {
    const hits = map.queryRenderedFeatures(event.point, {
      layers: interactiveLayers.map((layer) => layer.id)
    });
    if (hits.length > 0) {
      return;
    }
    selectEntity("location", "clicked-location", [
      event.lngLat.lng,
      event.lngLat.lat
    ]);
  });

  map.on("mousemove", (event) => {
    setHoverCoordinates([event.lngLat.lng, event.lngLat.lat]);
    const hits = map.queryRenderedFeatures(event.point, {
      layers: interactiveLayers.map((layer) => layer.id)
    });
    const feature = hits[0];
    const canvas = map.getCanvas();
    if (!feature) {
      canvas.style.cursor = "crosshair";
      tooltipRef.current?.remove();
      tooltipRef.current = null;
      return;
    }

    canvas.style.cursor = "pointer";
    const props = feature.properties ?? {};
    const typeLabel =
      interactiveLayers.find((layer) => layer.id === feature.layer.id)?.label ??
      "Map object";
    const name = String(props.name ?? props.id ?? feature.id ?? typeLabel);
    const status = props.risk_level ?? props.recommendation ?? props.freshness;
    const html = `<div class="map-tooltip"><strong>${typeLabel}</strong><span>${escapeHtml(name)}</span>${
      status ? `<em>${escapeHtml(String(status))}</em>` : ""
    }</div>`;

    if (!tooltipRef.current) {
      tooltipRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: "pravaha-popup"
      });
    }
    tooltipRef.current.setLngLat(event.lngLat).setHTML(html).addTo(map);
  });

  map.on("mouseout", () => {
    setHoverCoordinates(null);
    tooltipRef.current?.remove();
    tooltipRef.current = null;
    map.getCanvas().style.cursor = "";
  });
}

function updateLayerVisibility(
  map: Map,
  enabled: Record<LayerKey, boolean>
) {
  for (const [layer, ids] of Object.entries(layerGroups) as Array<
    [LayerKey, string[]]
  >) {
    const visible = enabled[layer] ? "visible" : "none";
    ids.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible);
      }
    });
  }
}

function updateLayerOpacity(map: Map, opacity: Record<LayerKey, number>) {
  for (const [layer, ids] of Object.entries(layerGroups) as Array<
    [LayerKey, string[]]
  >) {
    ids.forEach((id) => {
      if (!map.getLayer(id)) {
        return;
      }
      const layerType = map.getLayer(id)?.type;
      if (layerType === "fill") {
        map.setPaintProperty(id, "fill-opacity", opacity[layer]);
      }
      if (layerType === "line") {
        map.setPaintProperty(id, "line-opacity", opacity[layer]);
      }
      if (layerType === "circle") {
        map.setPaintProperty(id, "circle-opacity", opacity[layer]);
        map.setPaintProperty(id, "circle-stroke-opacity", opacity[layer]);
      }
    });
  }
}

function updateBasemap(map: Map, basemap: BasemapKey) {
  const paint =
    basemap === "contrast"
      ? {
          "raster-saturation": -0.9,
          "raster-contrast": 0.18,
          "raster-brightness-min": 0.02,
          "raster-brightness-max": 0.56
        }
      : basemap === "osm"
        ? {
            "raster-saturation": -0.15,
            "raster-contrast": -0.02,
            "raster-brightness-min": 0.2,
            "raster-brightness-max": 0.95
          }
        : {
            "raster-saturation": -0.7,
            "raster-contrast": -0.12,
            "raster-brightness-min": 0.1,
            "raster-brightness-max": 0.72
          };

  Object.entries(paint).forEach(([key, value]) => {
    if (map.getLayer("osm")) {
      map.setPaintProperty("osm", key, value);
    }
  });
}

function updateSelection(
  map: Map,
  selected: ReturnType<typeof useMapStore.getState>["selectedEntity"]
) {
  selectedLayers.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, noMatch());
    }
  });

  if (!selected || selected.type === "location") {
    return;
  }

  const filter: unknown[] = ["==", ["get", "id"], selected.id];
  const layers = selectionLayersFor(selected.type);
  layers.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, filter);
    }
  });

  if (selected.type === "road" && selected.id === "ROAD-CLOSED") {
    ["selected-closure-line"].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, filter);
      }
    });
  }
}

function selectionLayersFor(type: EntityType) {
  if (type === "catchment") {
    return ["selected-catchment-fill", "selected-catchment-line"];
  }
  if (type === "ward") {
    return ["selected-ward-fill", "selected-ward-line"];
  }
  if (type === "landslide") {
    return ["selected-landslide-fill", "selected-landslide-line"];
  }
  if (type === "drain") {
    return ["selected-drain-line"];
  }
  if (type === "road") {
    return ["selected-road-line", "selected-closure-line"];
  }
  if (type === "sensor") {
    return ["selected-sensor-circle"];
  }
  if (type === "shelter") {
    return ["selected-shelter-circle"];
  }
  if (type === "route") {
    return ["selected-route-line"];
  }
  return [];
}

function noMatch(): unknown[] {
  return ["==", ["get", "id"], "__none__"];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
