import { create } from "zustand";

import type {
  EntityType,
  RouteStrategy,
  ScenarioStage,
  SelectedEntity
} from "../api/types";

export type LayerKey =
  | "catchments"
  | "wards"
  | "rainfall"
  | "sensors"
  | "rivers"
  | "drains"
  | "roads"
  | "landslide"
  | "closures"
  | "shelters"
  | "routes";

export type BasemapKey = "osm" | "muted" | "contrast";

interface MapState {
  scenario: ScenarioStage;
  selectedEntity: SelectedEntity | null;
  hoverCoordinates: [number, number] | null;
  clickedCoordinates: [number, number] | null;
  enabledLayers: Record<LayerKey, boolean>;
  layerOpacity: Record<LayerKey, number>;
  routeStrategy: RouteStrategy;
  leftRailCollapsed: boolean;
  layerManagerOpen: boolean;
  legendOpen: boolean;
  basemap: BasemapKey;
  setScenario: (scenario: ScenarioStage) => void;
  selectEntity: (
    type: EntityType,
    id: string,
    coordinates?: [number, number]
  ) => void;
  clearSelection: () => void;
  setHoverCoordinates: (coordinates: [number, number] | null) => void;
  toggleLayer: (layer: LayerKey) => void;
  setLayerOpacity: (layer: LayerKey, opacity: number) => void;
  setRouteStrategy: (strategy: RouteStrategy) => void;
  toggleLeftRail: () => void;
  setLeftRailCollapsed: (collapsed: boolean) => void;
  toggleLayerManager: () => void;
  toggleLegend: () => void;
  setBasemap: (basemap: BasemapKey) => void;
}

export const defaultEnabledLayers: Record<LayerKey, boolean> = {
  catchments: true,
  wards: true,
  rainfall: true,
  sensors: true,
  rivers: true,
  drains: true,
  roads: true,
  landslide: true,
  closures: true,
  shelters: true,
  routes: true
};

const defaultLayerOpacity: Record<LayerKey, number> = {
  catchments: 0.52,
  wards: 0.78,
  rainfall: 0.28,
  sensors: 1,
  rivers: 0.9,
  drains: 0.95,
  roads: 1,
  landslide: 0.36,
  closures: 1,
  shelters: 1,
  routes: 1
};

export const useMapStore = create<MapState>((set) => ({
  scenario: "WARNING",
  selectedEntity: {
    type: "catchment",
    id: "UK-CHM-DEHRADUN-01"
  },
  hoverCoordinates: null,
  clickedCoordinates: null,
  routeStrategy: "safest",
  leftRailCollapsed: false,
  layerManagerOpen: false,
  legendOpen: true,
  basemap: "muted",
  enabledLayers: defaultEnabledLayers,
  layerOpacity: defaultLayerOpacity,
  setScenario: (scenario) => set({ scenario }),
  selectEntity: (type, id, coordinates) =>
    set({
      selectedEntity: { type, id, coordinates },
      clickedCoordinates: coordinates ?? null
    }),
  clearSelection: () => set({ selectedEntity: null }),
  setHoverCoordinates: (coordinates) => set({ hoverCoordinates: coordinates }),
  toggleLayer: (layer) =>
    set((state) => ({
      enabledLayers: {
        ...state.enabledLayers,
        [layer]: !state.enabledLayers[layer]
      }
    })),
  setLayerOpacity: (layer, opacity) =>
    set((state) => ({
      layerOpacity: {
        ...state.layerOpacity,
        [layer]: opacity
      }
    })),
  setRouteStrategy: (strategy) => set({ routeStrategy: strategy }),
  toggleLeftRail: () =>
    set((state) => ({ leftRailCollapsed: !state.leftRailCollapsed })),
  setLeftRailCollapsed: (collapsed) => set({ leftRailCollapsed: collapsed }),
  toggleLayerManager: () =>
    set((state) => ({ layerManagerOpen: !state.layerManagerOpen })),
  toggleLegend: () => set((state) => ({ legendOpen: !state.legendOpen })),
  setBasemap: (basemap) => set({ basemap })
}));
