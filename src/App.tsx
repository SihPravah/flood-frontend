import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeAlert,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Crosshair,
  DatabaseZap,
  Gauge,
  Layers3,
  LocateFixed,
  MapPinned,
  Mountain,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  ShieldAlert,
  StepForward,
  Waves
} from "lucide-react";

import {
  pravahaApi,
  pravahaDataMode,
  pravahaRefreshIntervalMs
} from "./api/provider";
import type {
  Alert,
  CatchmentDetail,
  DataMetric,
  DrainDetail,
  EntityType,
  IntelligenceDetail,
  LandslideDetail,
  LocationInspection,
  MapIntelligenceResponse,
  ProvenanceRow,
  RainfallWindowMetric,
  RoadDetail,
  RoutePoint,
  RouteDetail,
  SafeRouteResponse,
  ScenarioStage,
  SensorDetail,
  ShelterDetail,
  SourceHealthDetail,
  StructuredEvent,
  WardDetail
} from "./api/types";
import { MapView } from "./components/MapView";
import {
  useMapStore,
  type BasemapKey,
  type LayerKey
} from "./state/mapStore";

const AnticipationChart = lazy(() =>
  import("./components/AnticipationChart").then((module) => ({
    default: module.AnticipationChart
  }))
);

const scenarioStages: ScenarioStage[] = ["NORMAL", "WATCH", "WARNING", "SEVERE"];
const noSafeDestinationId = "DEMO-NO-SAFE-ROUTE";
const defaultRouteOrigin: RoutePoint = {
  lon: 78.03,
  lat: 30.32,
  label: "Clock Tower side",
  place_id: "ORIGIN-DEMO-CLOCK-TOWER"
};
const defaultRouteDestination: RoutePoint = {
  lon: 78.056,
  lat: 30.338,
  label: "School shelter",
  place_id: "SHELTER-SCHOOL-01"
};

const layerGroups: Array<{
  label: string;
  items: Array<{ key: LayerKey; label: string; legend: string }>;
}> = [
  {
    label: "Hazards",
    items: [
      { key: "catchments", label: "Catchment flood risk", legend: "Risk polygons" },
      { key: "wards", label: "Ward / village impact", legend: "Admin boundary" },
      { key: "rainfall", label: "Rainfall intensity", legend: "Blue wash" },
      { key: "landslide", label: "Landslide susceptibility", legend: "Hatched slope" }
    ]
  },
  {
    label: "Hydrology",
    items: [
      { key: "rivers", label: "Rivers / streams", legend: "Stream line" },
      { key: "drains", label: "Drainage network", legend: "Utilization" },
      { key: "catchments", label: "Catchment boundaries", legend: "Outline" }
    ]
  },
  {
    label: "Infrastructure",
    items: [
      { key: "roads", label: "Roads", legend: "Road status" },
      { key: "shelters", label: "Shelters", legend: "Shelter points" },
      { key: "sensors", label: "Sensors", legend: "Freshness" }
    ]
  },
  {
    label: "Routing",
    items: [
      { key: "routes", label: "Recommended route", legend: "Route line" },
      { key: "roads", label: "AVOID segments", legend: "Dashed orange" },
      { key: "closures", label: "Authority closures", legend: "White-black" }
    ]
  }
];

export function App() {
  const scenario = useMapStore((state) => state.scenario);
  const demoPlaying = useMapStore((state) => state.demoPlaying);
  const demoSpeed = useMapStore((state) => state.demoSpeed);
  const stepScenario = useMapStore((state) => state.stepScenario);
  const selectedEntity = useMapStore((state) => state.selectedEntity);
  const setLeftRailCollapsed = useMapStore((state) => state.setLeftRailCollapsed);
  const [routeOrigin, setRouteOrigin] = useState<RoutePoint>(defaultRouteOrigin);
  const [routeDestination, setRouteDestination] = useState<RoutePoint>(
    defaultRouteDestination
  );
  const plannedScenarioRef = useRef<ScenarioStage | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1120px)");
    const syncRailToViewport = () => {
      setLeftRailCollapsed(mediaQuery.matches);
    };

    syncRailToViewport();
    mediaQuery.addEventListener("change", syncRailToViewport);
    return () => mediaQuery.removeEventListener("change", syncRailToViewport);
  }, [setLeftRailCollapsed]);

  const mapQuery = useQuery({
    queryKey: ["map-intelligence", scenario],
    queryFn: () => pravahaApi.getMapIntelligence(scenario),
    refetchInterval:
      pravahaDataMode === "api" ? pravahaRefreshIntervalMs : false
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", scenario],
    queryFn: () => pravahaApi.getAlerts(scenario),
    refetchInterval:
      pravahaDataMode === "api" ? pravahaRefreshIntervalMs : false
  });

  const eventsQuery = useQuery({
    queryKey: ["events", scenario],
    queryFn: () => pravahaApi.getEvents(scenario),
    refetchInterval:
      pravahaDataMode === "api" ? pravahaRefreshIntervalMs : false
  });
  const snapshot = mapQuery.data;

  const detailQuery = useQuery({
    queryKey: ["detail", selectedEntity, scenario, snapshot?.snapshot_id],
    enabled: selectedEntity !== null,
    queryFn: () => pravahaApi.getEntityDetail(selectedEntity!, scenario)
  });

  const routeMutation = useMutation({
    mutationFn: () =>
      pravahaApi.planSafeRoute(
        {
          origin: {
            lon: 78.03,
            lat: 30.32,
            ...routeOrigin
          },
          destination: {
            lon: 78.056,
            lat: 30.338,
            ...routeDestination
          },
          strategy: useMapStore.getState().routeStrategy
        },
        scenario
      )
  });
  const routeData = routeMutation.data;
  const routePending = routeMutation.isPending;
  const routeError = routeMutation.error;
  const mutateRoute = routeMutation.mutate;

  const alerts = alertsQuery.data ?? [];
  const events = eventsQuery.data ?? snapshot?.events ?? [];

  useEffect(() => {
    if (!demoPlaying || pravahaDataMode === "api") {
      return;
    }
    const timer = window.setInterval(() => {
      stepScenario();
    }, 2600 / demoSpeed);
    return () => window.clearInterval(timer);
  }, [demoPlaying, demoSpeed, stepScenario]);

  useEffect(() => {
    if (!routeData) {
      return;
    }
    if (plannedScenarioRef.current === scenario) {
      return;
    }
    plannedScenarioRef.current = scenario;
    mutateRoute();
  }, [mutateRoute, routeData, scenario]);

  const planRoute = () => {
    plannedScenarioRef.current = scenario;
    mutateRoute();
  };

  return (
    <main className="app-shell">
      <TopOperationalBar
        snapshot={snapshot}
          alerts={alerts}
          dataMode={pravahaDataMode}
          loading={mapQuery.isLoading}
        />

      <section className="command-center" aria-label="PRAVAHA GIS command center">
        <OperationalRail
          loading={mapQuery.isLoading}
          snapshot={snapshot}
          alerts={alerts}
          events={events}
          route={routeData}
          routePending={routePending}
          routeError={routeError}
          routeOrigin={routeOrigin}
          routeDestination={routeDestination}
          onRouteOriginChange={setRouteOrigin}
          onRouteDestinationChange={setRouteDestination}
          onPlanRoute={planRoute}
        />

        <MapWorkspace
          snapshot={snapshot}
          loading={mapQuery.isLoading}
          error={mapQuery.error}
        />

        <IntelligenceDrawer
          detail={detailQuery.data}
          loading={detailQuery.isLoading}
          error={detailQuery.error}
        />

        <BottomIntelligenceStrip
          snapshot={snapshot}
          route={routeData}
          routePending={routePending}
          onPlanRoute={planRoute}
        />
      </section>
    </main>
  );
}

function TopOperationalBar({
  snapshot,
  alerts,
  dataMode,
  loading
}: {
  snapshot?: MapIntelligenceResponse;
  alerts: Alert[];
  dataMode: "api" | "mock";
  loading: boolean;
}) {
  const selectedEntity = useMapStore((state) => state.selectedEntity);
  const selectEntity = useMapStore((state) => state.selectEntity);
  const healthySources =
    snapshot?.source_health.filter((source) => source.status !== "UNAVAILABLE")
      .length ?? 0;
  const sourceCount = snapshot?.source_health.length ?? 0;

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <ShieldAlert aria-hidden="true" />
        <div>
          <span className="brand">PRAVAHA</span>
          <span className="subtle">
            Flash Flood Intelligence - {snapshot?.city.district ?? "Loading sector"}
          </span>
        </div>
      </div>

      <SearchBox snapshot={snapshot} />

      <div className="selected-context">
        <span className="eyebrow">Selection</span>
        <strong>
          {selectedEntity
            ? `${selectedEntity.type.toUpperCase()} / ${selectedEntity.id}`
            : "Map inspection ready"}
        </strong>
      </div>

      <div className="top-status-grid">
        <StatusPill
          label="Status"
          value={snapshot?.city.operational_status ?? (loading ? "LOADING" : "UNKNOWN")}
          tone={snapshot?.city.operational_status ?? "INSUFFICIENT_DATA"}
        />
        <StatusPill
          label="Freshness"
          value={snapshot ? freshnessLabel(snapshot.source_health) : "--"}
          tone={snapshot ? worstFreshness(snapshot.source_health) : "GOOD"}
        />
        <StatusPill
          label="Sources"
          value={snapshot ? `${healthySources}/${sourceCount}` : "--"}
          tone={healthySources === sourceCount ? "GOOD" : "DEGRADED"}
          onClick={() => selectEntity("source_health", "source-health")}
        />
      </div>

      <div className="top-actions">
        <span className="badge simulated">
          {dataMode === "api" ? snapshot?.mode ?? "API" : "SIMULATED DEMO"}
        </span>
        <span className="snapshot-time">
          <Clock3 aria-hidden="true" />
          {snapshot ? time(snapshot.generated_at) : "--:--"}
        </span>
        <button className="icon-button alert-button" type="button" aria-label="Alerts">
          <Bell aria-hidden="true" />
          <span>{alerts.length}</span>
        </button>
      </div>
    </header>
  );
}

interface SearchResult {
  type: EntityType;
  id: string;
  label: string;
  subtitle: string;
  coordinates?: [number, number];
}

function SearchBox({ snapshot }: { snapshot?: MapIntelligenceResponse }) {
  const selectEntity = useMapStore((state) => state.selectEntity);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const index = useMemo(() => buildSearchIndex(snapshot), [snapshot]);
  const coordinateResult = useMemo(() => parseCoordinateSearch(query), [query]);
  const results = useMemo(() => {
    if (coordinateResult) {
      return [coordinateResult];
    }
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return index.slice(0, 6);
    }
    return index
      .filter((item) =>
        `${item.type} ${item.id} ${item.label} ${item.subtitle}`
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 8);
  }, [coordinateResult, index, query]);

  const choose = (result: SearchResult) => {
    selectEntity(result.type, result.id, result.coordinates);
    setQuery(result.label);
    setOpen(false);
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  return (
    <div className="search-shell">
      <label className="search" aria-label="Search place or asset">
        <Search aria-hidden="true" />
        <input
          placeholder="Search ward, road, drain, sensor, shelter"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                Math.min(index + 1, Math.max(results.length - 1, 0))
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && results[activeIndex]) {
              event.preventDefault();
              choose(results[activeIndex]);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <kbd>GIS</kbd>
      </label>
      {open && results.length > 0 && (
        <div className="search-results" role="listbox">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              className={`search-option ${
                activeIndex === results.indexOf(result) ? "active" : ""
              }`}
              role="option"
              aria-selected={activeIndex === results.indexOf(result)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(result)}
            >
              <strong>{result.label}</strong>
              <span>{result.type.toUpperCase()} / {result.subtitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildSearchIndex(snapshot?: MapIntelligenceResponse): SearchResult[] {
  if (!snapshot) {
    return [];
  }

  const results: SearchResult[] = [];
  Object.values(snapshot.layers).forEach((collection) => {
    collection.features.forEach((feature) => {
      const properties = feature.properties ?? {};
      const type = String(properties.entityType ?? entityTypeFromId(String(feature.id ?? "")));
      if (!isEntityType(type)) {
        return;
      }
      const id = String(properties.id ?? feature.id ?? "");
      if (!id) {
        return;
      }
      results.push({
        type,
        id,
        label: String(properties.name ?? id),
        subtitle: id,
        coordinates: featureCenter(feature.geometry.coordinates)
      });
    });
  });

  snapshot.source_health.forEach((source) => {
    results.push({
      type: "source_health",
      id: "source-health",
      label: source.name,
      subtitle: `${source.status} / ${source.provenance}`
    });
  });

  return results;
}

function parseCoordinateSearch(value: string): SearchResult | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }
  const first = Number(match[1]);
  const second = Number(match[2]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }
  const lat = Math.abs(first) <= 90 ? first : second;
  const lon = Math.abs(first) <= 90 ? second : first;
  return {
    type: "location",
    id: "searched-coordinate",
    label: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    subtitle: "Coordinate inspection",
    coordinates: [lon, lat]
  };
}

function featureCenter(value: unknown): [number, number] | undefined {
  const coordinates: Array<[number, number]> = [];
  collectFeatureCoordinates(value, coordinates);
  if (coordinates.length === 0) {
    return undefined;
  }
  const totals = coordinates.reduce(
    (sum, coordinate) => [sum[0] + coordinate[0], sum[1] + coordinate[1]],
    [0, 0]
  );
  return [totals[0] / coordinates.length, totals[1] / coordinates.length];
}

function collectFeatureCoordinates(
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
  value.forEach((child) => collectFeatureCoordinates(child, coordinates));
}

function OperationalRail({
  loading,
  snapshot,
  alerts,
  events,
  route,
  routePending,
  routeError,
  routeOrigin,
  routeDestination,
  onRouteOriginChange,
  onRouteDestinationChange,
  onPlanRoute
}: {
  loading: boolean;
  snapshot?: MapIntelligenceResponse;
  alerts: Alert[];
  events: StructuredEvent[];
  route?: SafeRouteResponse;
  routePending: boolean;
  routeError: Error | null;
  routeOrigin: RoutePoint;
  routeDestination: RoutePoint;
  onRouteOriginChange: (point: RoutePoint) => void;
  onRouteDestinationChange: (point: RoutePoint) => void;
  onPlanRoute: () => void;
}) {
  const collapsed = useMapStore((state) => state.leftRailCollapsed);
  const toggleLeftRail = useMapStore((state) => state.toggleLeftRail);
  const scenario = useMapStore((state) => state.scenario);
  const setScenario = useMapStore((state) => state.setScenario);
  const demoPlaying = useMapStore((state) => state.demoPlaying);
  const demoSpeed = useMapStore((state) => state.demoSpeed);
  const setDemoPlaying = useMapStore((state) => state.setDemoPlaying);
  const setDemoSpeed = useMapStore((state) => state.setDemoSpeed);
  const stepScenario = useMapStore((state) => state.stepScenario);
  const resetScenario = useMapStore((state) => state.resetScenario);
  const selectEntity = useMapStore((state) => state.selectEntity);

  return (
    <aside
      className={`left-rail ${collapsed ? "collapsed" : ""}`}
      aria-label="Situational intelligence"
    >
      <button
        className="rail-toggle icon-button"
        type="button"
        onClick={toggleLeftRail}
        aria-label={collapsed ? "Expand situational rail" : "Collapse situational rail"}
      >
        {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
      </button>

      {!collapsed && (
        <div className="rail-scroll">
          <section className="rail-section overview-block">
            <div className="section-title">
              <Gauge aria-hidden="true" />
              <span>Overview</span>
            </div>
            {loading && <div className="skeleton-block" />}
            {snapshot && (
              <>
                <div className="status-card">
                  <span className="eyebrow">Operational level</span>
                  <strong className={`status-word ${toneClass(snapshot.city.operational_status)}`}>
                    {snapshot.city.operational_status}
                  </strong>
                  <small>{percent(snapshot.city.confidence)} confidence</small>
                </div>
                <div className="compact-kpi-grid">
                  <Kpi label="Worst catchment" value={snapshot.summary.highest_risk_catchment} />
                  <Kpi label="Worst ward" value={snapshot.summary.highest_risk_ward} />
                  <Kpi label="Active alerts" value={snapshot.summary.active_alerts} />
                  <Kpi label="Roads AVOID" value={snapshot.summary.roads_to_avoid} />
                  <Kpi label="Authority closures" value={snapshot.summary.confirmed_road_closures} />
                  <Kpi label="Drains over capacity" value={snapshot.summary.overflowing_drains} />
                  <Kpi label="Shelters available" value={display(snapshot.summary.shelters_available)} />
                  <Kpi label="Population exposure" value={display(snapshot.summary.exposed_population)} />
                </div>
              </>
            )}
          </section>

          <section className="rail-section scenario-block">
            <div className="section-title">
              <DatabaseZap aria-hidden="true" />
              <span>Demo controls</span>
            </div>
            <div className="demo-actions" aria-label="Demo playback">
              <button
                className="tool-button"
                type="button"
                onClick={() => setDemoPlaying(!demoPlaying)}
                aria-label={demoPlaying ? "Pause demo" : "Play demo"}
              >
                {demoPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                <span>{demoPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                className="tool-button"
                type="button"
                onClick={stepScenario}
                aria-label="Step Forward"
              >
                <StepForward aria-hidden="true" />
                <span>Step</span>
              </button>
              <button
                className="tool-button"
                type="button"
                onClick={resetScenario}
                aria-label="Reset demo"
              >
                <RotateCcw aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
            <div className="speed-control" aria-label="Demo speed">
              {([1, 2, 4] as const).map((speed) => (
                <button
                  key={speed}
                  className={demoSpeed === speed ? "active" : ""}
                  onClick={() => setDemoSpeed(speed)}
                  type="button"
                >
                  {speed}x
                </button>
              ))}
            </div>
            <div className="scenario-control" aria-label="Demo scenario">
              {scenarioStages.map((stage) => (
                <button
                  key={stage}
                  className={stage === scenario ? "active" : ""}
                  onClick={() => setScenario(stage)}
                  type="button"
                >
                  {stage}
                </button>
              ))}
            </div>
          </section>

          <section className="rail-section hazard-block">
            <div className="section-title">
              <Waves aria-hidden="true" />
              <span>Hazards</span>
            </div>
            <SignalRows
              rows={[
                ["Flood", snapshot?.city.operational_status ?? "Loading"],
                ["Rainfall", snapshot ? `${snapshot.summary.latest_threshold_crossing ?? "No crossing"}` : "Loading"],
                ["Landslide", scenario === "SEVERE" ? "HIGH" : "WATCH"],
                ["Drainage", snapshot?.summary.overflowing_drains ? "OVERLOAD" : "MONITOR"]
              ]}
            />
          </section>

          <section className="rail-section route-planner">
            <div className="section-title">
              <Route aria-hidden="true" />
              <span>Route planning</span>
            </div>
            <RoutePlanner
              route={route}
              routePending={routePending}
              routeError={routeError}
              routeOrigin={routeOrigin}
              routeDestination={routeDestination}
              onRouteOriginChange={onRouteOriginChange}
              onRouteDestinationChange={onRouteDestinationChange}
              onPlanRoute={onPlanRoute}
            />
          </section>

          <section className="rail-section source-health-block">
            <div className="section-title">
              <RefreshCw aria-hidden="true" />
              <span>Source health</span>
            </div>
            <SourceHealthRows sources={snapshot?.source_health ?? []} />
          </section>

          <section className="rail-section event-feed" aria-label="Event feed">
            <div className="section-title">
              <BadgeAlert aria-hidden="true" />
              <span>Event feed</span>
            </div>
            {events.length === 0 ? (
              <p className="muted">No structured events for this stage.</p>
            ) : (
              events.map((event) => (
                <button
                  key={event.event_id}
                  className="event-row"
                  type="button"
                  onClick={() =>
                    selectEntity(event.entity_type, event.entity_id)
                  }
                >
                  <strong>{event.severity}</strong>
                  <span>{event.title}</span>
                  <small>{event.message}</small>
                </button>
              ))
            )}
          </section>

          <section className="rail-section alert-list" aria-label="Alert center">
            <div className="section-title">
              <Bell aria-hidden="true" />
              <span>Alert center</span>
            </div>
            {alerts.length === 0 ? (
              <p className="muted">No active demo alerts.</p>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.alert_id}
                  className="alert-row"
                  type="button"
                  onClick={() =>
                    selectEntity(
                      entityTypeFromId(alert.affected_entity_ids[0]),
                      alert.affected_entity_ids[0]
                    )
                  }
                >
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    <strong>{alert.severity}</strong>
                    <em>{alert.location}</em>
                    <small>{alert.recommended_review}</small>
                  </span>
                </button>
              ))
            )}
          </section>
        </div>
      )}
    </aside>
  );
}

function MapWorkspace({
  snapshot,
  loading,
  error
}: {
  snapshot?: MapIntelligenceResponse;
  loading: boolean;
  error: Error | null;
}) {
  return (
    <section className="map-workspace" aria-label="Interactive GIS map">
      {snapshot ? (
        <MapView snapshot={snapshot} />
      ) : (
        <div className="map-skeleton" aria-label="Loading map" />
      )}
      {error && <div className="map-error">{error.message}</div>}
      <MapToolbar />
      <LayerManager />
      <CoordinateInspector />
      <OperationalLegend />
      {loading && <div className="map-loading-pill">Loading spatial intelligence</div>}
    </section>
  );
}

function MapToolbar() {
  const basemap = useMapStore((state) => state.basemap);
  const setBasemap = useMapStore((state) => state.setBasemap);
  const basemaps: BasemapKey[] = ["muted", "contrast", "osm"];

  return (
    <div className="map-tool-zone top-left" aria-label="Map tools">
      <button className="tool-button" type="button" aria-label="Fit study area">
        <LocateFixed aria-hidden="true" />
        <span>Fit</span>
      </button>
      <button className="tool-button active" type="button" aria-label="Inspection mode">
        <Crosshair aria-hidden="true" />
        <span>Inspect</span>
      </button>
      <div className="basemap-switch" aria-label="Basemap style">
        {basemaps.map((item) => (
          <button
            key={item}
            className={basemap === item ? "active" : ""}
            onClick={() => setBasemap(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayerManager() {
  const open = useMapStore((state) => state.layerManagerOpen);
  const toggleOpen = useMapStore((state) => state.toggleLayerManager);
  const enabled = useMapStore((state) => state.enabledLayers);
  const opacity = useMapStore((state) => state.layerOpacity);
  const toggleLayer = useMapStore((state) => state.toggleLayer);
  const setLayerOpacity = useMapStore((state) => state.setLayerOpacity);

  return (
    <aside className="map-tool-zone top-right layer-manager" aria-label="Layer manager">
      <button className="panel-tab" type="button" onClick={toggleOpen}>
        <Layers3 aria-hidden="true" />
        <span>Layers</span>
        {open ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
      </button>
      {open && (
        <div className="layer-groups">
          {layerGroups.map((group) => (
            <section key={group.label} className="layer-group">
              <h3>{group.label}</h3>
              {group.items.map((item) => (
                <div key={`${group.label}-${item.key}-${item.label}`} className="layer-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={enabled[item.key]}
                      onChange={() => toggleLayer(item.key)}
                    />
                    <span>{item.label}</span>
                  </label>
                  <input
                    aria-label={`${item.label} opacity`}
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    value={opacity[item.key]}
                    onChange={(event) =>
                      setLayerOpacity(item.key, Number(event.currentTarget.value))
                    }
                  />
                  <small>{item.legend}</small>
                </div>
              ))}
              {group.label === "Infrastructure" && (
                <div className="layer-row unavailable">
                  <label>
                    <input type="checkbox" disabled />
                    <span>Bridges</span>
                  </label>
                  <small>Not available</small>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}

function CoordinateInspector() {
  const hover = useMapStore((state) => state.hoverCoordinates);
  const clicked = useMapStore((state) => state.clickedCoordinates);
  const coordinates = hover ?? clicked;

  return (
    <div className="map-tool-zone bottom-left coordinate-readout" aria-label="Coordinate readout">
      <Compass aria-hidden="true" />
      <div>
        <span>WGS84 / EPSG:4326</span>
        <strong>
          {coordinates
            ? `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`
            : "Move cursor over map"}
        </strong>
      </div>
    </div>
  );
}

function OperationalLegend() {
  const open = useMapStore((state) => state.legendOpen);
  const toggleOpen = useMapStore((state) => state.toggleLegend);

  return (
    <aside className="map-tool-zone bottom-right legend-panel" aria-label="Operational legend">
      <button className="panel-tab" type="button" onClick={toggleOpen}>
        <BadgeAlert aria-hidden="true" />
        <span>Legend</span>
      </button>
      {open && (
        <div className="legend-grid">
          <LegendGroup
            title="Flood risk"
            items={["LOW", "WATCH", "WARNING", "HIGH", "SEVERE"]}
          />
          <LegendGroup
            title="Road status"
            items={["PASSABLE", "CAUTION", "AVOID", "CLOSED"]}
          />
          <LegendGroup
            title="Drain utilization"
            items={["0-50%", "50-75%", "75-90%", "overflow"]}
          />
          <LegendGroup
            title="Provenance"
            items={["OBSERVED", "DERIVED", "ESTIMATED", "SIMULATED", "MISSING"]}
          />
        </div>
      )}
    </aside>
  );
}

function IntelligenceDrawer({
  detail,
  loading,
  error
}: {
  detail: IntelligenceDetail | undefined;
  loading: boolean;
  error: Error | null;
}) {
  const selected = useMapStore((state) => state.selectedEntity);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const visibleDetail =
    detail && selected && detailMatchesSelection(detail, selected.type, selected.id)
      ? detail
      : undefined;
  const waitingForDetail = loading || Boolean(selected && detail && !visibleDetail);

  return (
    <aside className="inspector" aria-label="Selected intelligence drawer">
      <div className="inspector-header">
        <div>
          <span className="eyebrow">Inspection</span>
          <h2>{visibleDetail ? detailTitle(visibleDetail) : selected ? selected.id : "Select map object"}</h2>
        </div>
        <button className="icon-button" onClick={clearSelection} aria-label="Close detail drawer" type="button">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      {waitingForDetail && <div className="drawer-skeleton" />}
      {error && <p className="error-text">{error.message}</p>}
      {!waitingForDetail && !visibleDetail && (
        <div className="empty-inspector">
          <MapPinned aria-hidden="true" />
          <strong>Click any mapped asset or open coordinate inspection.</strong>
          <span>Catchments, wards, drains, roads, sensors, shelters, routes and empty locations are inspectable.</span>
        </div>
      )}
      {visibleDetail && <DetailContent detail={visibleDetail} />}
    </aside>
  );
}

function detailMatchesSelection(detail: IntelligenceDetail, type: string, id: string) {
  if (detail.type !== type) {
    return false;
  }
  if (detail.type === "catchment") return detail.catchment_id === id;
  if (detail.type === "drain") return detail.drain_id === id;
  if (detail.type === "road") return detail.road_id === id;
  if (detail.type === "sensor") return detail.device_id === id;
  if (detail.type === "source_health") return detail.id === id;
  if (detail.type === "ward") return detail.ward_id === id;
  if (detail.type === "landslide") return detail.zone_id === id;
  if (detail.type === "route") return detail.route_id === id;
  if (detail.type === "shelter") return detail.shelter_id === id;
  return true;
}

function DetailContent({ detail }: { detail: IntelligenceDetail }) {
  if (detail.type === "catchment") {
    return <CatchmentContent detail={detail} />;
  }
  if (detail.type === "drain") {
    return <DrainContent detail={detail} />;
  }
  if (detail.type === "road") {
    return <RoadContent detail={detail} />;
  }
  if (detail.type === "sensor") {
    return <SensorContent detail={detail} />;
  }
  if (detail.type === "source_health") {
    return <SourceHealthContent detail={detail} />;
  }
  if (detail.type === "ward") {
    return <WardContent detail={detail} />;
  }
  if (detail.type === "landslide") {
    return <LandslideContent detail={detail} />;
  }
  if (detail.type === "route") {
    return <RouteContent detail={detail} />;
  }
  if (detail.type === "shelter") {
    return <ShelterContent detail={detail} />;
  }
  return <LocationContent detail={detail} />;
}

function CatchmentContent({ detail }: { detail: CatchmentDetail }) {
  return (
    <div className="detail-stack">
      <RiskSummary detail={detail} subtitle={`${detail.fused_state} / ${detail.ward_name}`} />

      <DetailSection title="Current Rainfall">
        <div className="rainfall-grid">
          {detail.rainfall_windows.map((window) => (
            <RainfallWindow key={window.label} window={window} />
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Soil / Terrain">
        <MetricGrid
          metrics={[
            metric("Soil saturation", percentValue(detail.soil.saturation), undefined, detail.soil.status, detail.soil.confidence),
            metric("Elevation", detail.terrain.elevation_m, "m", "ESTIMATED"),
            metric("Mean slope", detail.terrain.mean_slope_fraction, "fraction", "ESTIMATED"),
            metric("Area", detail.terrain.catchment_area_km2, "km2", "ESTIMATED"),
            metric("Curve number", detail.terrain.curve_number, undefined, "ESTIMATED"),
            metric("HAND", detail.terrain.hand_m, "m", "MISSING"),
            metric("TWI", detail.terrain.twi, undefined, "MISSING")
          ]}
        />
      </DetailSection>

      <DetailSection title="Hydrology">
        <MetricGrid
          metrics={[
            metric("Runoff", detail.hydrology.runoff_mm, "mm", "DERIVED"),
            metric("Discharge", detail.hydrology.discharge_m3_per_s, "m3/s", "DERIVED"),
            metric("Runoff coefficient", detail.hydrology.runoff_coefficient, undefined, "DERIVED"),
            metric("Concentration time", detail.hydrology.concentration_time_minutes, "min", "DERIVED"),
            metric("Response", detail.hydrology.response, undefined, detail.risk_level),
            metric("Drainage demand", detail.hydrology.drainage_demand, undefined, detail.risk_level)
          ]}
        />
      </DetailSection>

      <DetailSection title={`Why ${detail.risk_level}?`}>
        <ReasonList reasons={detail.reasons} />
      </DetailSection>

      <DetailSection title="Anticipation">
        <TimelineRows timeline={detail.anticipation.timeline} />
        <Suspense fallback={<div className="chart-skeleton" />}>
          <AnticipationChart timeline={detail.anticipation.timeline} />
        </Suspense>
        <div className="threshold-note">
          {detail.anticipation.threshold_window
            ? `${detail.anticipation.threshold_window.risk_level} threshold estimated ${detail.anticipation.threshold_window.earliest_minutes}-${detail.anticipation.threshold_window.latest_minutes} min`
            : "No threshold crossing in demo horizon"}
        </div>
      </DetailSection>

      <DetailSection title="Cascade">
        <div className="cascade-chain">
          {detail.cascade.map((step) => (
            <div key={step.label} className={`cascade-step ${step.state.toLowerCase()}`}>
              <strong>{step.label}</strong>
              <span>{step.state}</span>
              <small>{step.detail}</small>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Impact">
        <MetricGrid
          metrics={[
            metric("Affected wards", detail.impact.affected_wards.join(", "), undefined, "SIMULATED"),
            metric("Exposed roads", detail.impact.exposed_roads.join(", "), undefined, "SIMULATED"),
            metric("Threatened shelters", listOrNone(detail.impact.threatened_shelters), undefined, "SIMULATED"),
            metric("Population", detail.impact.exposed_population, undefined, "MISSING"),
            metric("Evacuation readiness", detail.impact.evacuation_readiness, undefined, detail.risk_level)
          ]}
        />
      </DetailSection>

      <ProvenanceTable rows={detail.provenance_table} />
    </div>
  );
}

function DrainContent({ detail }: { detail: DrainDetail }) {
  return (
    <div className="detail-stack">
      <RiskSummary detail={detail} subtitle={`${detail.drain_type} / ${detail.name}`} />
      <DetailSection title="Hydraulics">
        <MetricGrid
          metrics={[
            metric("Estimated inflow", detail.inflow_m3_per_s, "m3/s", "DERIVED"),
            metric("Design capacity", detail.capacity_m3_per_s, "m3/s", "ESTIMATED"),
            metric("Current utilization", percentValue(detail.capacity_utilization), undefined, detail.risk_level),
            metric("Predicted +30", percentValue(detail.predicted_utilization_30m), undefined, detail.risk_level),
            metric("Overflow", detail.overflow_m3_per_s, "m3/s", detail.overflow_m3_per_s ? "HIGH" : "LOW"),
            metric("Overflow margin", detail.overflow_margin_m3_per_s, "m3/s", "ESTIMATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Condition / Impact">
        <MetricGrid
          metrics={[
            metric("Condition", detail.condition, undefined, "ESTIMATED"),
            metric("Condition factor", detail.condition_factor, undefined, "ESTIMATED"),
            metric("Affected roads", detail.affected_roads.join(", "), undefined, "SIMULATED"),
            metric("Contributing catchments", detail.contributing_catchments.join(", "), undefined, "SIMULATED"),
            metric("Nearby settlements", detail.nearby_settlements.join(", "), undefined, "SIMULATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Trend">
        <TimelineRows timeline={detail.timeline} />
      </DetailSection>
      <DetailSection title="Reasons">
        <ReasonList reasons={detail.reasons} />
      </DetailSection>
      <ProvenanceTable rows={detail.provenance_table} />
    </div>
  );
}

function RoadContent({ detail }: { detail: RoadDetail }) {
  return (
    <div className="detail-stack">
      <RiskSummary
        detail={detail}
        subtitle={`${detail.name} / ${detail.road_class}`}
        status={detail.recommendation}
      />
      <div className={`authority-banner ${detail.authority_closed ? "closed" : "model"}`}>
        {detail.authority_closed ? "AUTHORITY CONFIRMED CLOSURE" : "MODEL RECOMMENDATION"}
      </div>
      <DetailSection title="Road">
        <MetricGrid
          metrics={[
            metric("Segment length", detail.segment_length_km, "km", "ESTIMATED"),
            metric("Jurisdiction", detail.jurisdiction, undefined, "ESTIMATED"),
            metric("Associated drain", detail.associated_drain_id ?? null, undefined, "ESTIMATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Contributors">
        <MetricGrid metrics={detail.contributors} />
      </DetailSection>
      <DetailSection title="Related Infrastructure">
        <MetricGrid metrics={detail.related_infrastructure} />
      </DetailSection>
      <DetailSection title="Anticipation / Routing Effect">
        <MetricGrid metrics={[...detail.anticipation, ...detail.routing_effect]} />
      </DetailSection>
      <DetailSection title="Reasons">
        <ReasonList reasons={detail.reasons} />
      </DetailSection>
    </div>
  );
}

function SensorContent({ detail }: { detail: SensorDetail }) {
  return (
    <div className="detail-stack">
      <div className="sensor-title-row">
        <span className={`badge ${toneClass(detail.freshness)}`}>{detail.freshness}</span>
        <span className="badge simulated">{detail.status}</span>
      </div>
      <DetailSection title="Sensor">
        <MetricGrid
          metrics={[
            metric("Device", detail.device_id, undefined, detail.status),
            metric("Type", detail.sensor_type, undefined, detail.status),
            metric("Latitude", detail.latitude, undefined, detail.status),
            metric("Longitude", detail.longitude, undefined, detail.status),
            metric("Age", detail.age_minutes, "min", detail.freshness),
            metric("Source", detail.source, undefined, detail.status)
          ]}
        />
      </DetailSection>
      <DetailSection title="Measurements">
        <MetricGrid
          metrics={Object.entries(detail.measurements).map(([label, value]) =>
            metric(titleize(label), value, unitFor(label), value === null ? "MISSING" : detail.status)
          )}
        />
      </DetailSection>
      <DetailSection title="History">
        <div className="mini-bars">
          {detail.history.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <i style={{ height: `${Math.max(item.rainfall_mm_per_hr ?? 0, 4)}px` }} />
              <small>{display(item.rainfall_mm_per_hr)} mm/hr</small>
            </div>
          ))}
        </div>
        {detail.missing_fields.length > 0 && (
          <p className="data-note">Missing: {detail.missing_fields.join(", ")}</p>
        )}
      </DetailSection>
    </div>
  );
}

function SourceHealthContent({ detail }: { detail: SourceHealthDetail }) {
  return (
    <div className="detail-stack">
      <DetailSection title="Source Health">
        <div className="source-health-list expanded">
          {detail.sources.map((source) => (
            <div key={source.source_id} className="source-row">
              <span>
                <strong>{source.name}</strong>
                <small>{source.source_id}</small>
                {source.message && <small>{source.message}</small>}
              </span>
              <em className={toneClass(source.freshness)}>
                {source.status} / {source.provenance}
              </em>
            </div>
          ))}
        </div>
      </DetailSection>
      <DetailSection title="Model Metadata">
        <MetricGrid
          metrics={[
            metric("Prediction", detail.model_metadata.prediction_id, undefined, "DERIVED"),
            metric("Version", detail.model_metadata.model_version, undefined, "DERIVED"),
            metric("Runtime", detail.model_metadata.runtime_status, undefined, "DERIVED"),
            metric(
              "Operational validation",
              detail.model_metadata.operationally_validated ? "Yes" : "No",
              undefined,
              detail.model_metadata.operationally_validated ? "OBSERVED" : "SIMULATED"
            ),
            metric("Input state", detail.model_metadata.input_state_time, undefined, "DERIVED"),
            metric("Data quality", percentValue(detail.model_metadata.data_quality_score), undefined, "DEGRADED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Structured Events">
        <div className="event-feed compact">
          {detail.events.map((event) => (
            <div key={event.event_id} className="event-row">
              <strong>{event.severity}</strong>
              <span>{event.title}</span>
              <small>{event.message}</small>
            </div>
          ))}
        </div>
      </DetailSection>
    </div>
  );
}

function WardContent({ detail }: { detail: WardDetail }) {
  return (
    <div className="detail-stack">
      <RiskSummary detail={detail} subtitle={`${detail.admin_level} / ${detail.name}`} />
      <DetailSection title="Ward / Village">
        <MetricGrid
          metrics={[
            metric("Population", detail.population, undefined, "MISSING"),
            metric("Catchments", detail.catchments_intersecting.join(", "), undefined, "SIMULATED"),
            metric("Roads threatened", detail.roads_threatened.join(", "), undefined, detail.risk_level),
            metric("Shelters", detail.shelters.join(", "), undefined, "SIMULATED"),
            metric("Evacuation readiness", detail.evacuation_readiness, undefined, detail.risk_level),
            metric("Isolation risk", detail.isolation_risk, undefined, detail.risk_level),
            metric("Deterioration", detail.predicted_deterioration, undefined, "SIMULATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Major Hazards">
        <ReasonList reasons={detail.major_hazards} />
      </DetailSection>
    </div>
  );
}

function LandslideContent({ detail }: { detail: LandslideDetail }) {
  return (
    <div className="detail-stack">
      <RiskSummary detail={detail} subtitle={detail.name} />
      <DetailSection title="Landslide Intelligence">
        <MetricGrid
          metrics={[
            metric("Susceptibility", percentValue(detail.susceptibility_score), undefined, detail.risk_level),
            metric("Slope", detail.slope_fraction, "fraction", "ESTIMATED"),
            metric("Soil contribution", detail.soil_saturation_contribution, undefined, "SIMULATED"),
            metric("Rainfall contribution", detail.rainfall_contribution, undefined, "SIMULATED"),
            metric("Historical inventory", detail.historical_inventory, undefined, "ESTIMATED"),
            metric("Affected assets", detail.affected_assets.join(", "), undefined, detail.risk_level)
          ]}
        />
      </DetailSection>
      <DetailSection title="Cascade Impact">
        <ReasonList reasons={detail.cascade_impact} />
      </DetailSection>
    </div>
  );
}

function RouteContent({ detail }: { detail: RouteDetail }) {
  return (
    <div className="detail-stack">
      <DetailSection title="Route Intelligence">
        <div className="route-card selected">
          <strong>{detail.label}</strong>
          <span>
            {detail.travel_time_minutes} min / {detail.distance_km} km / +{detail.additional_time_vs_fastest_minutes} min
          </span>
          <small>Max risk {percent(detail.maximum_risk_score)} / min confidence {percent(detail.minimum_confidence)}</small>
        </div>
        <MetricGrid
          metrics={[
            metric("Strategy", detail.strategy, undefined, "SIMULATED"),
            metric("Landslide exposure", detail.landslide_exposure, undefined, detail.landslide_exposure),
            metric("High-risk segments", detail.high_risk_segments, undefined, detail.landslide_exposure),
            metric("AVOID bypassed", detail.unsafe_segments_avoided, undefined, "SIMULATED"),
            metric("Closures bypassed", detail.closures_avoided, undefined, "SIMULATED"),
            metric("Crossings", detail.crossings, undefined, "ESTIMATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Explanation">
        <ReasonList reasons={detail.explanation} />
      </DetailSection>
    </div>
  );
}

function ShelterContent({ detail }: { detail: ShelterDetail }) {
  return (
    <div className="detail-stack">
      <DetailSection title="Shelter">
        <MetricGrid
          metrics={[
            metric("Shelter", detail.name, undefined, detail.provenance.data_label),
            metric("Status", detail.status, undefined, detail.status),
            metric("Capacity", detail.capacity_people, undefined, "MISSING"),
            metric("Occupancy", detail.current_occupancy, undefined, "MISSING"),
            metric("Nearest route", detail.nearest_safe_route, undefined, detail.nearest_safe_route ? "SIMULATED" : "MISSING")
          ]}
        />
      </DetailSection>
    </div>
  );
}

function LocationContent({ detail }: { detail: LocationInspection }) {
  return (
    <div className="detail-stack">
      <div className="location-head">
        <Crosshair aria-hidden="true" />
        <div>
          <strong>{detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)}</strong>
          <span>Generic map-pixel inspection</span>
        </div>
      </div>
      <DetailSection title="Location">
        <MetricGrid
          metrics={[
            metric("Jurisdiction", detail.jurisdiction, undefined, "SIMULATED"),
            metric("Ward / village", detail.ward_or_village, undefined, "SIMULATED"),
            metric("Catchment", detail.catchment_id, undefined, "SIMULATED"),
            metric("Nearest road", detail.nearest_road, undefined, "ESTIMATED"),
            metric("Nearest stream", detail.nearest_stream, undefined, "ESTIMATED"),
            metric("Nearest drain", detail.nearest_drain, undefined, "ESTIMATED"),
            metric("Nearest shelter", detail.nearest_shelter, undefined, "SIMULATED")
          ]}
        />
      </DetailSection>
      <DetailSection title="Terrain">
        <MetricGrid metrics={detail.terrain} />
      </DetailSection>
      <DetailSection title="Hydrology">
        <MetricGrid metrics={detail.hydrology} />
      </DetailSection>
      <DetailSection title="Hazard Context">
        <MetricGrid metrics={detail.hazard_context} />
      </DetailSection>
      <DetailSection title="Data Quality">
        <MetricGrid metrics={detail.data_quality} />
      </DetailSection>
    </div>
  );
}

function BottomIntelligenceStrip({
  snapshot,
  route,
  routePending,
  onPlanRoute
}: {
  snapshot?: MapIntelligenceResponse;
  route?: SafeRouteResponse;
  routePending: boolean;
  onPlanRoute: () => void;
}) {
  const scenario = useMapStore((state) => state.scenario);
  const currentStageLabel =
    pravahaDataMode === "api" && snapshot
      ? snapshot.model_metadata.risk_level
      : scenario;
  const routeStrategy = useMapStore((state) => state.routeStrategy);
  const setRouteStrategy = useMapStore((state) => state.setRouteStrategy);

  return (
    <footer className="bottom-strip" aria-label="Anticipatory and route intelligence">
      <section className="timeline-strip">
        <div className="strip-heading">
          <Mountain aria-hidden="true" />
          <span>Anticipatory timeline</span>
          <em>{currentStageLabel}</em>
        </div>
        <div className="timeline-cells">
          {snapshot?.events.slice(0, 4).map((event) => (
            <span key={event.event_id}>
              {event.title}
              <em>{event.severity}</em>
            </span>
          )) ?? <span>Waiting for scenario state</span>}
        </div>
      </section>

      <section className="route-strip">
        <div className="strategy-row" aria-label="Route strategy">
          {(["safest", "balanced", "fastest_available"] as const).map((strategy) => (
            <button
              key={strategy}
              className={routeStrategy === strategy ? "active" : ""}
              onClick={() => setRouteStrategy(strategy)}
              type="button"
            >
              {titleize(strategy)}
            </button>
          ))}
        </div>
        <button className="primary-action" onClick={onPlanRoute} type="button">
          {routePending ? "Evaluating" : "Plan route"}
        </button>
        <RouteResult route={route} />
      </section>
    </footer>
  );
}

function RoutePlanner({
  route,
  routePending,
  routeError,
  routeOrigin,
  routeDestination,
  onRouteOriginChange,
  onRouteDestinationChange,
  onPlanRoute
}: {
  route?: SafeRouteResponse;
  routePending: boolean;
  routeError: Error | null;
  routeOrigin: RoutePoint;
  routeDestination: RoutePoint;
  onRouteOriginChange: (point: RoutePoint) => void;
  onRouteDestinationChange: (point: RoutePoint) => void;
  onPlanRoute: () => void;
}) {
  const routeStrategy = useMapStore((state) => state.routeStrategy);
  const setRouteStrategy = useMapStore((state) => state.setRouteStrategy);
  const selectedEntity = useMapStore((state) => state.selectedEntity);
  const selectedPoint = selectedEntity?.coordinates
    ? {
        lon: selectedEntity.coordinates[0],
        lat: selectedEntity.coordinates[1],
        label: `${selectedEntity.type.toUpperCase()} / ${selectedEntity.id}`,
        place_id: selectedEntity.id
      }
    : null;

  return (
    <div className="route-planner-body">
      <div className="route-fields">
        <label>
          <span>FROM</span>
          <input
            aria-label="Route origin"
            value={routeOrigin.label ?? ""}
            onChange={(event) =>
              onRouteOriginChange(resolveRoutePoint(event.currentTarget.value, "origin"))
            }
            list="pravaha-route-places"
          />
        </label>
        <label>
          <span>TO</span>
          <input
            aria-label="Route destination"
            value={routeDestination.label ?? ""}
            onChange={(event) =>
              onRouteDestinationChange(
                resolveRoutePoint(event.currentTarget.value, "destination")
              )
            }
            list="pravaha-route-places"
          />
        </label>
        <datalist id="pravaha-route-places">
          <option value="Clock Tower side" />
          <option value="School shelter" />
          <option value="Isolated hillside hamlet" />
          <option value="30.331, 78.042" />
        </datalist>
      </div>
      <div className="route-actions" aria-label="Route point actions">
        <button
          type="button"
          onClick={() => {
            onRouteOriginChange({
              lon: routeDestination.lon,
              lat: routeDestination.lat,
              label: routeDestination.label,
              place_id: routeDestination.place_id
            });
            onRouteDestinationChange({
              lon: routeOrigin.lon,
              lat: routeOrigin.lat,
              label: routeOrigin.label,
              place_id: routeOrigin.place_id
            });
          }}
        >
          Swap
        </button>
        <button
          type="button"
          onClick={() => {
            onRouteOriginChange(defaultRouteOrigin);
            onRouteDestinationChange(defaultRouteDestination);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          disabled={!selectedPoint}
          onClick={() => selectedPoint && onRouteOriginChange(selectedPoint)}
        >
          Use selected FROM
        </button>
        <button
          type="button"
          disabled={!selectedPoint}
          onClick={() => selectedPoint && onRouteDestinationChange(selectedPoint)}
        >
          Use selected TO
        </button>
        <button
          type="button"
          onClick={() => onRouteDestinationChange(defaultRouteDestination)}
        >
          Shelter
        </button>
        <button
          type="button"
          onClick={() =>
            onRouteDestinationChange(
              resolveRoutePoint("Isolated hillside hamlet", "destination")
            )
          }
        >
          Isolated
        </button>
      </div>
      <div className="strategy-row" aria-label="Route strategy">
        {(["safest", "balanced", "fastest_available"] as const).map((strategy) => (
          <button
            key={strategy}
            className={routeStrategy === strategy ? "active" : ""}
            onClick={() => setRouteStrategy(strategy)}
            type="button"
          >
            {titleize(strategy)}
          </button>
        ))}
      </div>
      <button className="primary-action" onClick={onPlanRoute} type="button">
        {routePending ? "Evaluating corridors" : "Compare routes"}
      </button>
      {routeError && <p className="error-text">{routeError.message}</p>}
      <RouteResult route={route} />
    </div>
  );
}

function RouteResult({ route }: { route?: SafeRouteResponse }) {
  if (!route) {
    return <p className="muted">No route evaluation yet.</p>;
  }

  if (route.status === "NO_SAFE_ROUTE") {
    return (
      <div className="no-route-state">
        <strong>NO RELIABLE ROUTE AVAILABLE</strong>
        <span>{route.message}</span>
        <ul>
          {route.blocked_by.map((segment) => (
            <li key={segment.road_id}>
              {segment.road_id} / {segment.recommendation} / {segment.risk_level}
            </li>
          ))}
        </ul>
        <small>{route.safety_note}</small>
      </div>
    );
  }

  return (
    <div className="route-card selected">
      <strong>{route.selected_route.label}</strong>
      <span>
        {route.selected_route.travel_time_minutes} min / {route.selected_route.distance_km} km
      </span>
      <small>
        Max risk {percent(route.selected_route.maximum_risk_score)} / min confidence {percent(route.selected_route.minimum_confidence)}
      </small>
      <em>{route.safety_note}</em>
    </div>
  );
}

function RainfallWindow({ window }: { window: RainfallWindowMetric }) {
  return (
    <div className={`rain-window ${toneClass(window.quality)}`}>
      <strong>{window.label}</strong>
      <span>{display(window.value_mm)} mm</span>
      <small>{window.status} / {window.quality}</small>
      <em>
        cov {percent(window.coverage_fraction)} / n {window.observation_count} / gap {display(window.largest_gap_minutes)}m
      </em>
    </div>
  );
}

function RiskSummary({
  detail,
  subtitle,
  status
}: {
  detail: Extract<IntelligenceDetail, { risk_score: number }>;
  subtitle: string;
  status?: string;
}) {
  return (
    <div className="risk-summary">
      <div>
        <span className="eyebrow">{subtitle}</span>
        <h3>{status ?? detail.risk_level}</h3>
      </div>
      <div className="risk-meters">
        <Meter label="Risk" value={detail.risk_score} tone={detail.risk_level} />
        <Meter label="Confidence" value={detail.confidence} tone={detail.confidence >= 0.75 ? "GOOD" : "DEGRADED"} />
      </div>
      <span className="badge simulated">{detail.provenance.data_label}</span>
    </div>
  );
}

function DetailSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: DataMetric[] }) {
  return (
    <div className="metric-grid">
      {metrics.map((item) => (
        <div key={`${item.label}-${String(item.value)}`} className="metric-row">
          <span>{item.label}</span>
          <strong>{formatMetric(item)}</strong>
          {item.status && <em className={toneClass(String(item.status))}>{item.status}</em>}
        </div>
      ))}
    </div>
  );
}

function TimelineRows({ timeline }: { timeline: CatchmentDetail["anticipation"]["timeline"] }) {
  return (
    <div className="timeline-rows">
      {timeline.map((point) => (
        <div key={point.label} className={`timeline-row ${toneClass(point.risk_level)}`}>
          <strong>{point.label}</strong>
          <span>{point.risk_level}</span>
          <em>{point.drainage_status}</em>
          <small>{point.road_status} / {point.note}</small>
        </div>
      ))}
    </div>
  );
}

function ProvenanceTable({ rows }: { rows: ProvenanceRow[] }) {
  return (
    <DetailSection title="Data Provenance">
      <div className="provenance-table">
        <div className="provenance-head">
          <span>Variable</span>
          <span>Source</span>
          <span>Status</span>
          <span>Age</span>
          <span>Conf.</span>
        </div>
        {rows.map((row) => (
          <div key={row.variable} className="provenance-row">
            <span>{row.variable}</span>
            <span>{row.source}</span>
            <span className={toneClass(row.status)}>{row.status}</span>
            <span>{row.age_minutes === null ? "Not available" : `${row.age_minutes}m`}</span>
            <span>{row.confidence === null ? "Not available" : percent(row.confidence)}</span>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

function LegendGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="legend-group">
      <strong>{title}</strong>
      {items.map((item) => (
        <span key={item}>
          <i className={`legend-swatch ${toneClass(item)}`} />
          {item}
        </span>
      ))}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalRows({ rows }: { rows: Array<[string, string | number]> }) {
  return (
    <div className="signal-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function SourceHealthRows({
  sources
}: {
  sources: MapIntelligenceResponse["source_health"];
}) {
  const selectEntity = useMapStore((state) => state.selectEntity);

  if (sources.length === 0) {
    return <p className="muted">Source health is not available yet.</p>;
  }

  return (
    <div className="source-health-list">
      {sources.map((source) => (
        <button
          key={source.source_id}
          className="source-row"
          type="button"
          onClick={() => selectEntity("source_health", "source-health")}
        >
          <span>
            <strong>{source.name}</strong>
            <small>{source.message ?? source.source_id}</small>
          </span>
          <em className={toneClass(source.freshness)}>
            {source.status} / {source.provenance}
          </em>
        </button>
      ))}
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
  onClick
}: {
  label: string;
  value: string;
  tone: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <em>{label}</em>
      <strong>{value}</strong>
    </>
  );
  if (onClick) {
    return (
      <button
        className={`status-pill ${toneClass(tone)}`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }
  return (
    <span className={`status-pill ${toneClass(tone)}`}>
      {content}
    </span>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <strong>{percent(value)}</strong>
      <i>
        <b className={toneClass(tone)} style={{ width: percent(value) }} />
      </i>
    </div>
  );
}

function ReasonList({ reasons }: { reasons: string[] }) {
  return (
    <ul className="reason-list">
      {reasons.map((reason) => (
        <li key={reason}>{titleize(reason)}</li>
      ))}
    </ul>
  );
}

function metric(
  label: string,
  value: DataMetric["value"],
  unit?: string,
  status?: DataMetric["status"],
  confidence?: number | null
): DataMetric {
  return {
    label,
    value,
    unit,
    status,
    confidence
  };
}

function detailTitle(detail: IntelligenceDetail) {
  if (detail.type === "catchment") {
    return detail.name;
  }
  if (detail.type === "drain") {
    return detail.name;
  }
  if (detail.type === "road") {
    return detail.name;
  }
  if (detail.type === "sensor") {
    return detail.device_id;
  }
  if (detail.type === "source_health") {
    return "Source health";
  }
  if (detail.type === "ward") {
    return detail.name;
  }
  if (detail.type === "landslide") {
    return detail.name;
  }
  if (detail.type === "route") {
    return detail.label;
  }
  if (detail.type === "shelter") {
    return detail.name;
  }
  return "Coordinate inspection";
}

function entityTypeFromId(id: string) {
  if (id.startsWith("UK-CHM")) {
    return "catchment" as const;
  }
  if (id.startsWith("D-") || id.startsWith("DRAIN")) {
    return "drain" as const;
  }
  if (id.startsWith("ROAD")) {
    return "road" as const;
  }
  if (id.startsWith("WARD")) {
    return "ward" as const;
  }
  if (id.startsWith("SENSOR")) {
    return "sensor" as const;
  }
  if (id.startsWith("SHELTER")) {
    return "shelter" as const;
  }
  if (id.startsWith("LANDSLIDE")) {
    return "landslide" as const;
  }
  return "catchment" as const;
}

function isEntityType(value: string): value is EntityType {
  return [
    "location",
    "catchment",
    "ward",
    "drain",
    "road",
    "sensor",
    "source_health",
    "landslide",
    "route",
    "shelter"
  ].includes(value);
}

function unitFor(label: string) {
  if (label.includes("rainfall")) {
    return "mm/hr";
  }
  if (label.includes("soil")) {
    return "%";
  }
  if (label.includes("tilt")) {
    return "deg";
  }
  return undefined;
}

function formatMetric(item: DataMetric) {
  if (item.value === null || item.value === undefined) {
    return "Not available";
  }
  const value =
    typeof item.value === "number" ? Number(item.value.toFixed(2)) : item.value;
  return item.unit ? `${value} ${item.unit}` : String(value);
}

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not available";
  }
  return value;
}

function listOrNone(values: string[]) {
  return values.length > 0 ? values.join(", ") : "None in demo horizon";
}

function resolveRoutePoint(value: string, role: "origin" | "destination"): RoutePoint {
  const trimmed = value.trim();
  const coordinate = parseCoordinateSearch(trimmed);
  if (coordinate?.coordinates) {
    return {
      lon: coordinate.coordinates[0],
      lat: coordinate.coordinates[1],
      label: coordinate.label,
      place_id: `${role.toUpperCase()}-COORDINATE`
    };
  }

  if (role === "destination" && /isolated|hill/i.test(trimmed)) {
    return {
      lon: 78.055,
      lat: 30.342,
      label: trimmed || "Isolated hillside hamlet",
      place_id: noSafeDestinationId
    };
  }

  if (role === "destination") {
    return {
      ...defaultRouteDestination,
      label: trimmed || defaultRouteDestination.label
    };
  }

  return {
    ...defaultRouteOrigin,
    label: trimmed || defaultRouteOrigin.label
  };
}

function freshnessLabel(sources: MapIntelligenceResponse["source_health"]) {
  const observedAges = sources
    .map((source) => source.age_seconds)
    .filter((value): value is number => typeof value === "number");
  if (observedAges.length === 0) {
    return "static";
  }
  const minutes = Math.round(Math.min(...observedAges) / 60);
  return `${minutes}m`;
}

function worstFreshness(sources: MapIntelligenceResponse["source_health"]) {
  if (sources.some((source) => source.freshness === "UNUSABLE")) {
    return "UNUSABLE";
  }
  if (sources.some((source) => source.freshness === "DEGRADED")) {
    return "DEGRADED";
  }
  return "GOOD";
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function percentValue(value: number | null | undefined) {
  return value === null || value === undefined ? null : Math.round(value * 100);
}

function time(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function titleize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneClass(value: string) {
  return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");
}
