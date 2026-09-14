export type RiskLevel = "LOW" | "WATCH" | "WARNING" | "HIGH" | "SEVERE";
export type DataLabel =
  | "OBSERVED"
  | "DERIVED"
  | "ESTIMATED"
  | "SIMULATED"
  | "MISSING";
export type RoadRecommendation = "PASSABLE" | "CAUTION" | "AVOID" | "CLOSED";
export type ScenarioStage = "NORMAL" | "WATCH" | "WARNING" | "SEVERE";
export type EntityType =
  | "location"
  | "catchment"
  | "ward"
  | "drain"
  | "road"
  | "sensor"
  | "landslide"
  | "route"
  | "shelter";
export type RouteStrategy = "safest" | "balanced" | "fastest_available";
export type Trend = "RISING" | "FALLING" | "STABLE";
export type Freshness = "GOOD" | "DEGRADED" | "UNUSABLE";

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
  district: string;
  operational_status:
    | "NORMAL"
    | "ELEVATED"
    | "WARNING"
    | "EMERGENCY"
    | "INSUFFICIENT_DATA";
  confidence: number;
  reasons: string[];
  last_updated: string;
}

export interface SourceHealth {
  label: string;
  status: Freshness | "ONLINE" | "DEGRADED" | "OFFLINE";
  age_minutes?: number;
  provenance: DataLabel;
}

export interface MapSummary {
  catchment_count: number;
  high_risk_catchments: number;
  overflowing_drains: number;
  roads_to_avoid: number;
  confirmed_road_closures: number;
  active_alerts: number;
  highest_risk_catchment: string;
  highest_risk_ward: string;
  shelters_available: number | null;
  exposed_population: number | null;
  source_health: SourceHealth[];
  latest_threshold_crossing: string | null;
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

export interface DataMetric {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: DataLabel | Freshness | RoadRecommendation | RiskLevel | string;
  confidence?: number | null;
  age_minutes?: number | null;
  source?: string;
  quality?: Freshness | string;
}

export interface RainfallWindowMetric {
  label: string;
  value_mm: number | null;
  status: DataLabel;
  coverage_fraction: number;
  observation_count: number;
  latest_observation_age_minutes: number | null;
  largest_gap_minutes: number | null;
  quality: Freshness;
}

export interface TimelinePoint {
  label: "NOW" | "+15 min" | "+30 min" | "+60 min";
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  trend: Trend;
  drainage_status: string;
  road_status: RoadRecommendation;
  city_status: CityStatus["operational_status"];
  note: string;
}

export interface ProvenanceRow {
  variable: string;
  source: string;
  status: DataLabel;
  age_minutes: number | null;
  confidence: number | null;
}

export interface CascadeStep {
  label: string;
  state: "OBSERVED" | "PREDICTED" | "POSSIBLE";
  detail: string;
}

export interface CatchmentDetail extends RiskBearing {
  type: "catchment";
  catchment_id: string;
  name: string;
  ward_name: string;
  snapshot_id: string;
  fused_state: "FusedCatchmentState v2.1";
  status: CityStatus["operational_status"];
  trend: Trend;
  rainfall_windows: RainfallWindowMetric[];
  hydrology: {
    runoff_mm: number | null;
    discharge_m3_per_s: number | null;
    runoff_coefficient: number | null;
    concentration_time_minutes: number | null;
    response: string;
    drainage_demand: string;
  };
  rainfall: {
    intensity_mm_per_hr: number | null;
    rain_15m: number | null;
    rain_30m: number | null;
    rain_1h: number | null;
    rain_3h: number | null;
    rain_6h: number | null;
    rain_24h: number | null;
  };
  soil: {
    saturation: number | null;
    status: DataLabel;
    confidence: number | null;
  };
  terrain: {
    elevation_m: number | null;
    mean_slope_fraction: number | null;
    catchment_area_km2: number | null;
    curve_number: number | null;
    hand_m: number | null;
    twi: number | null;
  };
  anticipation: {
    trend: Trend;
    threshold_window?: {
      risk_level: RiskLevel;
      earliest_minutes: number;
      latest_minutes: number;
    };
    timeline: TimelinePoint[];
  };
  landslide: {
    risk_level: RiskLevel;
    susceptibility_score: number | null;
    reasons: string[];
  };
  cascade: CascadeStep[];
  impact: {
    affected_wards: string[];
    exposed_roads: string[];
    threatened_shelters: string[];
    exposed_population: number | null;
    evacuation_readiness: string;
  };
  provenance_table: ProvenanceRow[];
}

export interface DrainDetail extends RiskBearing {
  type: "drain";
  drain_id: string;
  name: string;
  drain_type: string;
  snapshot_id: string;
  upstream_nodes: string[];
  downstream_node: string | null;
  inflow_m3_per_s: number | null;
  capacity_m3_per_s: number | null;
  capacity_utilization: number | null;
  predicted_utilization_30m: number | null;
  overflow_m3_per_s: number | null;
  overflow_margin_m3_per_s: number | null;
  condition: string;
  condition_factor: number | null;
  affected_roads: string[];
  contributing_catchments: string[];
  nearby_settlements: string[];
  timeline: TimelinePoint[];
  provenance_table: ProvenanceRow[];
}

export interface RoadDetail extends RiskBearing {
  type: "road";
  road_id: string;
  name: string;
  road_class: string;
  segment_length_km: number | null;
  jurisdiction: string;
  snapshot_id: string;
  recommendation: RoadRecommendation;
  status_basis: "MODEL_RECOMMENDATION" | "AUTHORITY_CONFIRMED";
  associated_drain_id?: string;
  authority_closed: boolean;
  terrain: {
    depression_score: number | null;
    stream_proximity_m: number | null;
    mean_slope_fraction: number | null;
  };
  historical_waterlogging_score?: number | null;
  landslide_exposure: {
    risk_level?: RiskLevel;
    susceptibility_score?: number | null;
  };
  contributors: DataMetric[];
  related_infrastructure: DataMetric[];
  anticipation: DataMetric[];
  routing_effect: DataMetric[];
}

export interface SensorDetail {
  type: "sensor";
  device_id: string;
  sensor_type: string;
  snapshot_id: string;
  latitude: number;
  longitude: number;
  source: string;
  measurements: Record<string, number | null>;
  observed_at: string;
  age_minutes: number;
  freshness: Freshness;
  status: DataLabel;
  missing_fields: string[];
  provenance: SourceMetadata;
  last_updated: string;
  history: Array<{
    label: string;
    rainfall_mm_per_hr: number | null;
    soil_moisture_percentage: number | null;
  }>;
}

export interface WardDetail extends RiskBearing {
  type: "ward";
  ward_id: string;
  name: string;
  admin_level: "WARD" | "VILLAGE";
  snapshot_id: string;
  population: number | null;
  catchments_intersecting: string[];
  roads_threatened: string[];
  shelters: string[];
  evacuation_readiness: string;
  isolation_risk: string;
  major_hazards: string[];
  current_alerts: string[];
  predicted_deterioration: string;
}

export interface LandslideDetail extends RiskBearing {
  type: "landslide";
  zone_id: string;
  name: string;
  snapshot_id: string;
  susceptibility_score: number | null;
  slope_fraction: number | null;
  soil_saturation_contribution: string;
  rainfall_contribution: string;
  historical_inventory: string;
  affected_assets: string[];
  cascade_impact: string[];
}

export interface RouteDetail {
  type: "route";
  route_id: string;
  label: string;
  snapshot_id: string;
  strategy: RouteStrategy;
  travel_time_minutes: number;
  distance_km: number;
  maximum_risk_score: number;
  minimum_confidence: number;
  additional_time_vs_fastest_minutes: number;
  unsafe_segments_avoided: number;
  closures_avoided: number;
  landslide_exposure: RiskLevel;
  high_risk_segments: number;
  crossings: number;
  explanation: string[];
  provenance: SourceMetadata;
}

export interface ShelterDetail {
  type: "shelter";
  shelter_id: string;
  name: string;
  snapshot_id: string;
  status: "AVAILABLE" | "NEAR_CAPACITY" | "UNKNOWN";
  capacity_people: number | null;
  current_occupancy: number | null;
  nearest_safe_route: string | null;
  provenance: SourceMetadata;
  last_updated: string;
}

export interface LocationInspection {
  type: "location";
  id: string;
  snapshot_id: string;
  latitude: number;
  longitude: number;
  jurisdiction: string | null;
  ward_or_village: string | null;
  catchment_id: string | null;
  nearest_road: string | null;
  nearest_stream: string | null;
  nearest_drain: string | null;
  nearest_shelter: string | null;
  terrain: DataMetric[];
  hydrology: DataMetric[];
  hazard_context: DataMetric[];
  data_quality: DataMetric[];
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  risk_level: RiskLevel;
  confidence: number;
  severity: RiskLevel;
  location: string;
  message: string;
  recommended_review: string;
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

export interface SelectedEntity {
  type: EntityType;
  id: string;
  coordinates?: [number, number];
}

export type IntelligenceDetail =
  | CatchmentDetail
  | DrainDetail
  | RoadDetail
  | SensorDetail
  | WardDetail
  | LandslideDetail
  | RouteDetail
  | ShelterDetail
  | LocationInspection;

export interface PravahaApi {
  getMapIntelligence(stage: ScenarioStage): Promise<MapIntelligenceResponse>;
  getCatchmentDetail(id: string, stage: ScenarioStage): Promise<CatchmentDetail>;
  getDrainDetail(id: string, stage: ScenarioStage): Promise<DrainDetail>;
  getRoadDetail(id: string, stage: ScenarioStage): Promise<RoadDetail>;
  getSensorDetail(id: string, stage: ScenarioStage): Promise<SensorDetail>;
  getEntityDetail(
    selection: SelectedEntity,
    stage: ScenarioStage
  ): Promise<IntelligenceDetail>;
  getAlerts(stage: ScenarioStage): Promise<Alert[]>;
  planSafeRoute(
    request: SafeRouteRequest,
    stage: ScenarioStage
  ): Promise<SafeRouteResponse>;
}
