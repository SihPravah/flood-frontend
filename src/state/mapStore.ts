import { create } from "zustand";

import type { EntityType, ScenarioStage, SelectedEntity } from "../api/types";

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

interface MapState {
  scenario: ScenarioStage;
  selectedEntity: SelectedEntity | null;
  enabledLayers: Record<LayerKey, boolean>;
  routeStrategy: "safest" | "balanced" | "fastest_available";
  setScenario: (scenario: ScenarioStage) => void;
  selectEntity: (type: EntityType, id: string) => void;
  clearSelection: () => void;
  toggleLayer: (layer: LayerKey) => void;
  setRouteStrategy: (
    strategy: "safest" | "balanced" | "fastest_available"
  ) => void;
}

export const useMapStore = create<MapState>((set) => ({
  scenario: "WARNING",
  selectedEntity: {
    type: "catchment",
    id: "UK-CHM-DEHRADUN-01"
  },
  routeStrategy: "safest",
  enabledLayers: {
    catchments: true,
    wards: true,
    rainfall: false,
    sensors: true,
    rivers: true,
    drains: true,
    roads: true,
    landslide: true,
    closures: true,
    shelters: true,
    routes: true
  },
  setScenario: (scenario) => set({ scenario }),
  selectEntity: (type, id) => set({ selectedEntity: { type, id } }),
  clearSelection: () => set({ selectedEntity: null }),
  toggleLayer: (layer) =>
    set((state) => ({
      enabledLayers: {
        ...state.enabledLayers,
        [layer]: !state.enabledLayers[layer]
      }
    })),
  setRouteStrategy: (strategy) => set({ routeStrategy: strategy })
}));
