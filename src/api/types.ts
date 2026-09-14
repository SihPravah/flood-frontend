export type RiskLevel = "LOW" | "WATCH" | "WARNING" | "HIGH" | "SEVERE";
export type DataLabel =
  | "OBSERVED"
  | "DERIVED"
  | "ESTIMATED"
  | "SIMULATED"
  | "MISSING";
export type RoadRecommendation = "PASSABLE" | "CAUTION" | "AVOID" | "CLOSED";
export type ScenarioStage = "NORMAL" | "WATCH" | "WARNING" | "SEVERE";
export type EntityType = "catchment" | "drain" | "road" | "sensor";
export type RouteStrategy = "safest" | "balanced" | "fastest_available";

export interface SourceMetadata {
  data_label: DataLabel;
  sources: string[];
  static_verification_status?: string;
  capacity_verification_status?: string;
  provider?: string;
}

export interface RiskBearing {
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  reasons: string[];
  provenance: SourceMetadata;
  last_updated: string;
}

export interface GeoJsonFeature {
  type: "Feature";
  id?: string;
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: Record<string, unknown> | null;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface MapLayers {
  catchments: FeatureCollection;
  wards: FeatureCollection;
  rainfall: FeatureCollection;
  drains: FeatureCollection;
  roads: FeatureCollection;
  sensors: FeatureCollection;
  rivers: FeatureCollection;
  landslide: FeatureCollection;
  closures: FeatureCollection;
  shelters: FeatureCollection;
  routes: FeatureCollection;
}

export interface CityStatus {
  city_id: string;
  name: string;
  operational_status:
    | "NORMAL"
    | "ELEVATED"
    | "EMERGENCY"
    | "INSUFFICIENT_DATA";
  confidence: number;
  reasons: string[];
  last_updated: string;
}

export interface MapSummary {
  catchment_count: number;
  high_risk_catchments: number;
  overflowing_drains: number;
  roads_to_avoid: number;
  confirmed_road_closures: number;
  active_alerts: number;
}

export interface MapIntelligenceResponse {
  snapshot_id: string;
  generated_at: string;
  mode: "DEMO" | "OPERATIONAL";
  data_label: DataLabel;
  city: CityStatus;
  layers: MapLayers;
  summary: MapSummary;
}

export interface CatchmentDetail extends RiskBearing {
  catchment_id: string;
  snapshot_id: string;
  fused_state: "FusedCatchmentState v2.1";
  hydrology: {
    runoff_mm: number;
    concentration_time_minutes: number;
  };
  rainfall: {
    intensity_mm_per_hr: number;
    rain_15m: number;
    rain_30m: number;
    rain_1h: number;
    rain_3h: number;
    rain_6h: number;
    rain_24h: number;
  };
  soil: {
    saturation: number;
  };
  anticipation: {
    trend: "RISING" | "FALLING" | "STABLE";
    threshold_window?: {
      risk_level: RiskLevel;
      earliest_minutes: number;
      latest_minutes: number;
    };
    timeline: TimelinePoint[];
  };
  landslide: {
    risk_level: RiskLevel;
    susceptibility_score: number;
    reasons: string[];
  };
}

export interface DrainDetail extends RiskBearing {
  drain_id: string;
  snapshot_id: string;
  inflow_m3_per_s: number;
  capacity_m3_per_s: number;
  capacity_utilization: number;
  overflow_m3_per_s: number;
  condition: string;
  affected_roads: string[];
}

export interface RoadDetail extends RiskBearing {
  road_id: string;
  snapshot_id: string;
  recommendation: RoadRecommendation;
  associated_drain_id?: string;
  authority_closed: boolean;
  terrain: Record<string, unknown>;
  historical_waterlogging_score?: number;
  landslide_exposure: {
    risk_level?: RiskLevel;
    susceptibility_score?: number;
  };
}

export interface SensorDetail {
  device_id: string;
  snapshot_id: string;
  measurements: Record<string, number>;
  observed_at: string;
  age_minutes: number;
  freshness: "GOOD" | "DEGRADED" | "UNUSABLE";
  provenance: SourceMetadata;
  last_updated: string;
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  risk_level: RiskLevel;
  confidence: number;
  message: string;
  affected_entity_ids: string[];
  reasons: string[];
  provenance: SourceMetadata;
  issued_at: string;
  last_updated: string;
}

export interface RoutePoint {
  lon: number;
  lat: number;
  label?: string;
  place_id?: string;
}

export interface SafeRouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
  strategy: RouteStrategy;
  allow_avoid_segments?: boolean;
}

export interface RouteSegment {
  road_id: string;
  recommendation: RoadRecommendation;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  reasons: string[];
}

export interface RouteAlternative {
  route_id: string;
  label: string;
  strategy: RouteStrategy;
  travel_time_minutes: number;
  distance_km: number;
  maximum_risk_score: number;
  minimum_confidence: number;
  additional_time_vs_fastest_minutes: number;
  unsafe_segments_avoided: number;
  closures_avoided: number;
  explanation: string[];
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  segments: RouteSegment[];
}

export interface SafeRouteSuccess {
  status: "ROUTE_FOUND";
  snapshot_id: string;
  generated_at: string;
  selected_route: RouteAlternative;
  alternatives: RouteAlternative[];
  provenance: SourceMetadata;
  safety_note: string;
}

export interface NoSafeRouteResponse {
  status: "NO_SAFE_ROUTE";
  snapshot_id: string;
  generated_at: string;
  reason_code: string;
  message: string;
  blocked_by: RouteSegment[];
  provenance: SourceMetadata;
  safety_note: string;
}

export type SafeRouteResponse = SafeRouteSuccess | NoSafeRouteResponse;

export interface TimelinePoint {
  label: "NOW" | "+30 min" | "+60 min";
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  trend: "RISING" | "FALLING" | "STABLE";
}

export interface SelectedEntity {
  type: EntityType;
  id: string;
}

export type IntelligenceDetail =
  | CatchmentDetail
  | DrainDetail
  | RoadDetail
  | SensorDetail;

export interface PravahaApi {
  getMapIntelligence(stage: ScenarioStage): Promise<MapIntelligenceResponse>;
  getCatchmentDetail(id: string, stage: ScenarioStage): Promise<CatchmentDetail>;
  getDrainDetail(id: string, stage: ScenarioStage): Promise<DrainDetail>;
  getRoadDetail(id: string, stage: ScenarioStage): Promise<RoadDetail>;
  getSensorDetail(id: string, stage: ScenarioStage): Promise<SensorDetail>;
  getAlerts(stage: ScenarioStage): Promise<Alert[]>;
  planSafeRoute(
    request: SafeRouteRequest,
    stage: ScenarioStage
  ): Promise<SafeRouteResponse>;
}
