import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Clock3,
  Layers3,
  LocateFixed,
  MapPin,
  Route,
  Search,
  ShieldAlert
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { pravahaApi } from "./api/provider";
import type {
  Alert,
  CatchmentDetail,
  DrainDetail,
  EntityType,
  IntelligenceDetail,
  RoadDetail,
  SafeRouteResponse,
  SensorDetail
} from "./api/types";
import { MapView } from "./components/MapView";
import { useMapStore, type LayerKey } from "./state/mapStore";

export function App() {
  const scenario = useMapStore((state) => state.scenario);
  const selectedEntity = useMapStore((state) => state.selectedEntity);

  const mapQuery = useQuery({
    queryKey: ["map-intelligence", scenario],
    queryFn: () => pravahaApi.getMapIntelligence(scenario)
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", scenario],
    queryFn: () => pravahaApi.getAlerts(scenario)
  });

  const detailQuery = useQuery({
    queryKey: ["detail", selectedEntity, scenario],
    queryFn: () => {
      if (!selectedEntity) {
        return Promise.resolve(null);
      }
      return loadDetail(selectedEntity.type, selectedEntity.id, scenario);
    }
  });

  const routeMutation = useMutation({
    mutationFn: () =>
      pravahaApi.planSafeRoute(
        {
          origin: {
            lon: 78.03,
            lat: 30.32,
            label: "Clock Tower side"
          },
          destination: {
            lon: 78.056,
            lat: 30.338,
            label: "School shelter",
            place_id: "SHELTER-01"
          },
          strategy: useMapStore.getState().routeStrategy
        },
        scenario
      )
  });

  return (
    <main className="app-shell">
      <TopBar />

      <section className="map-stage" aria-label="PRAVAHA map workspace">
        {mapQuery.data ? (
          <MapView snapshot={mapQuery.data} />
        ) : (
          <div className="map-skeleton" aria-label="Loading map" />
        )}

        <SituationPanel
          loading={mapQuery.isLoading}
          snapshot={mapQuery.data}
          route={routeMutation.data}
          onPlanRoute={() => routeMutation.mutate()}
          routePending={routeMutation.isPending}
          routeError={routeMutation.error}
        />

        <LayerControl />
        <Legend />
        <AlertCenter alerts={alertsQuery.data ?? []} />
        <IntelligenceDrawer
          detail={detailQuery.data}
          loading={detailQuery.isLoading}
          error={detailQuery.error}
        />
      </section>
    </main>
  );
}

async function loadDetail(
  type: EntityType,
  id: string,
  scenario: ReturnType<typeof useMapStore.getState>["scenario"]
): Promise<IntelligenceDetail> {
  if (type === "catchment") {
    return pravahaApi.getCatchmentDetail(id, scenario);
  }
  if (type === "drain") {
    return pravahaApi.getDrainDetail(id, scenario);
  }
  if (type === "road") {
    return pravahaApi.getRoadDetail(id, scenario);
  }
  return pravahaApi.getSensorDetail(id, scenario);
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <ShieldAlert aria-hidden="true" />
        <div>
          <span className="brand">PRAVAHA</span>
          <span className="subtle">Dehradun flash-flood intelligence</span>
        </div>
      </div>
      <label className="search">
        <Search aria-hidden="true" />
        <input aria-label="Search place or asset" placeholder="Search ward, road, drain, sensor" />
      </label>
      <div className="top-actions">
        <span className="badge simulated">SIMULATED / DEMO</span>
        <button className="icon-button" aria-label="Center map">
          <LocateFixed aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function SituationPanel({
  loading,
  snapshot,
  route,
  onPlanRoute,
  routePending,
  routeError
}: {
  loading: boolean;
  snapshot?: Awaited<ReturnType<typeof pravahaApi.getMapIntelligence>>;
  route?: SafeRouteResponse;
  onPlanRoute: () => void;
  routePending: boolean;
  routeError: Error | null;
}) {
  const scenario = useMapStore((state) => state.scenario);
  const setScenario = useMapStore((state) => state.setScenario);
  const routeStrategy = useMapStore((state) => state.routeStrategy);
  const setRouteStrategy = useMapStore((state) => state.setRouteStrategy);

  return (
    <aside className="situation-panel" aria-label="Operational status">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">City status</span>
          <h1>{snapshot?.city.operational_status ?? "Loading"}</h1>
        </div>
        <span className={`risk-pill ${snapshot?.city.operational_status.toLowerCase()}`}>
          {snapshot?.data_label ?? "SIMULATED"}
        </span>
      </div>

      <div className="scenario-control" aria-label="Demo scenario">
        {(["NORMAL", "WATCH", "WARNING", "SEVERE"] as const).map((stage) => (
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

      <div className="metric-strip">
        <Metric label="Catchments" value={snapshot?.summary.catchment_count ?? "-"} />
        <Metric label="Overflow" value={snapshot?.summary.overflowing_drains ?? "-"} />
        <Metric label="Avoid" value={snapshot?.summary.roads_to_avoid ?? "-"} />
      </div>

      <div className="freshness">
        <Clock3 aria-hidden="true" />
        <span>{snapshot ? new Date(snapshot.generated_at).toLocaleString() : "Waiting for snapshot"}</span>
      </div>

      {loading && <div className="skeleton-line" />}

      <div className="route-planner">
        <div className="section-title">
          <Route aria-hidden="true" />
          <span>Route plan</span>
        </div>
        <div className="strategy-row" aria-label="Route strategy">
          {(["safest", "balanced", "fastest_available"] as const).map((strategy) => (
            <button
              key={strategy}
              className={routeStrategy === strategy ? "active" : ""}
              onClick={() => setRouteStrategy(strategy)}
              type="button"
            >
              {strategy.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button className="primary-action" onClick={onPlanRoute} type="button">
          {routePending ? "Planning..." : "Compare routes"}
        </button>
        {routeError && <p className="error-text">{routeError.message}</p>}
        {route && <RouteResult route={route} />}
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RouteResult({ route }: { route: SafeRouteResponse }) {
  if (route.status === "NO_SAFE_ROUTE") {
    return (
      <div className="route-result no-route">
        <strong>NO_SAFE_ROUTE</strong>
        <span>{route.message}</span>
      </div>
    );
  }

  return (
    <div className="route-result">
      <strong>{route.selected_route.label}</strong>
      <span>
        {route.selected_route.travel_time_minutes} min · max risk{" "}
        {Math.round(route.selected_route.maximum_risk_score * 100)}%
      </span>
    </div>
  );
}

function LayerControl() {
  const enabledLayers = useMapStore((state) => state.enabledLayers);
  const toggleLayer = useMapStore((state) => state.toggleLayer);
  const layers: LayerKey[] = [
    "catchments",
    "wards",
    "sensors",
    "rivers",
    "drains",
    "roads",
    "landslide",
    "closures",
    "shelters",
    "routes"
  ];

  return (
    <aside className="layer-control" aria-label="Map layers">
      <div className="section-title">
        <Layers3 aria-hidden="true" />
        <span>Layers</span>
      </div>
      {layers.map((layer) => (
        <label key={layer} className="toggle-row">
          <input
            type="checkbox"
            checked={enabledLayers[layer]}
            onChange={() => toggleLayer(layer)}
          />
          <span>{layer.replace(/_/g, " ")}</span>
        </label>
      ))}
    </aside>
  );
}

function Legend() {
  return (
    <div className="legend" aria-label="Risk legend">
      {["LOW", "WATCH", "WARNING", "HIGH", "SEVERE"].map((level) => (
        <span key={level}>
          <i className={`swatch ${level.toLowerCase()}`} />
          {level}
        </span>
      ))}
    </div>
  );
}

function AlertCenter({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="alert-center" aria-label="Alerts">
      <div className="section-title">
        <Bell aria-hidden="true" />
        <span>Alerts</span>
      </div>
      {alerts.length === 0 ? (
        <p className="muted">No active demo alerts.</p>
      ) : (
        alerts.map((alert) => (
          <article key={alert.alert_id} className="alert-item">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>{alert.risk_level}</strong>
              <span>{alert.message}</span>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function IntelligenceDrawer({
  detail,
  loading,
  error
}: {
  detail: IntelligenceDetail | null | undefined;
  loading: boolean;
  error: Error | null;
}) {
  const clearSelection = useMapStore((state) => state.clearSelection);

  return (
    <aside className="drawer" aria-label="Selected intelligence">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Intelligence</span>
          <h2>{detail ? detailTitle(detail) : "Select a map object"}</h2>
        </div>
        <button className="icon-button" onClick={clearSelection} aria-label="Close detail drawer">
          ×
        </button>
      </div>
      {loading && <div className="drawer-skeleton" />}
      {error && <p className="error-text">{error.message}</p>}
      {detail && <DetailContent detail={detail} />}
    </aside>
  );
}

function DetailContent({ detail }: { detail: IntelligenceDetail }) {
  if ("measurements" in detail) {
    return <SensorContent detail={detail} />;
  }

  return (
    <div className="detail-stack">
      <div className="score-row">
        <span className={`risk-dot ${detail.risk_level.toLowerCase()}`} />
        <strong>{detail.risk_level}</strong>
        <span>{Math.round(detail.risk_score * 100)}% risk</span>
        <span>{Math.round(detail.confidence * 100)}% confidence</span>
      </div>
      <span className="badge simulated">{detail.provenance.data_label}</span>
      <ReasonList reasons={detail.reasons} />
      {"hydrology" in detail && <CatchmentContent detail={detail} />}
      {"capacity_utilization" in detail && <DrainContent detail={detail} />}
      {"recommendation" in detail && <RoadContent detail={detail} />}
    </div>
  );
}

function CatchmentContent({ detail }: { detail: CatchmentDetail }) {
  return (
    <>
      <div className="two-column">
        <Metric label="Rain 1h" value={`${detail.rainfall.rain_1h} mm`} />
        <Metric label="Soil" value={`${Math.round(detail.soil.saturation * 100)}%`} />
        <Metric label="Runoff" value={`${detail.hydrology.runoff_mm} mm`} />
        <Metric label="Tc" value={`${detail.hydrology.concentration_time_minutes} min`} />
      </div>
      <div className="timeline">
        {detail.anticipation.timeline.map((point) => (
          <span key={point.label}>
            {point.label}
            <b>{point.risk_level}</b>
          </span>
        ))}
      </div>
      <div className="timeline-chart" aria-label="Anticipatory risk timeline">
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={detail.anticipation.timeline}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 1]} />
            <Tooltip
              formatter={(value: number) => `${Math.round(value * 100)}%`}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="risk_score"
              stroke="#145c52"
              strokeWidth={3}
              dot={{ r: 4, fill: "#f18d38", strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function DrainContent({ detail }: { detail: DrainDetail }) {
  return (
    <div className="two-column">
      <Metric label="Inflow" value={`${detail.inflow_m3_per_s} m3/s`} />
      <Metric label="Capacity" value={`${detail.capacity_m3_per_s} m3/s`} />
      <Metric label="Utilization" value={`${Math.round(detail.capacity_utilization * 100)}%`} />
      <Metric label="Overflow" value={`${detail.overflow_m3_per_s} m3/s`} />
    </div>
  );
}

function RoadContent({ detail }: { detail: RoadDetail }) {
  return (
    <div className="detail-callout">
      <MapPin aria-hidden="true" />
      <span>
        {detail.recommendation}
        {detail.authority_closed ? " · authority closure" : " · model guidance"}
      </span>
    </div>
  );
}

function SensorContent({ detail }: { detail: SensorDetail }) {
  return (
    <div className="detail-stack">
      <span className="badge simulated">{detail.provenance.data_label}</span>
      <div className="two-column">
        {Object.entries(detail.measurements).map(([name, value]) => (
          <Metric key={name} label={name.replace(/_/g, " ")} value={value} />
        ))}
        <Metric label="Age" value={`${detail.age_minutes} min`} />
        <Metric label="Freshness" value={detail.freshness} />
      </div>
    </div>
  );
}

function ReasonList({ reasons }: { reasons: string[] }) {
  return (
    <ul className="reason-list">
      {reasons.map((reason) => (
        <li key={reason}>{reason.replace(/_/g, " ")}</li>
      ))}
    </ul>
  );
}

function detailTitle(detail: IntelligenceDetail) {
  if ("catchment_id" in detail) {
    return detail.catchment_id;
  }
  if ("drain_id" in detail) {
    return detail.drain_id;
  }
  if ("road_id" in detail) {
    return detail.road_id;
  }
  return detail.device_id;
}
