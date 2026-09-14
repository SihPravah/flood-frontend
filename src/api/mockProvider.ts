import type {
  DataLabel,
  FeatureCollection,
  GeoJsonFeature,
  MapIntelligenceResponse,
  PravahaApi,
  RiskLevel,
  RoadRecommendation,
  SafeRouteRequest,
  SafeRouteResponse,
  ScenarioStage,
  SourceMetadata,
  TimelinePoint
} from "./types";

const generatedAt = "2026-09-09T08:45:00.000Z";

interface StageProfile {
  cityStatus:
    | "NORMAL"
    | "ELEVATED"
    | "EMERGENCY"
    | "INSUFFICIENT_DATA";
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  rainfallIntensity: number;
  rain1h: number;
  rain3h: number;
  rain24h: number;
  soilSaturation: number;
  drainUtilization: number;
  overflow: number;
  roadRecommendation: RoadRecommendation;
  alertLevel: RiskLevel;
  reasons: string[];
  timeline: TimelinePoint[];
}

const stages: Record<ScenarioStage, StageProfile> = {
  NORMAL: {
    cityStatus: "NORMAL",
    riskScore: 0.18,
    riskLevel: "LOW",
    confidence: 0.82,
    rainfallIntensity: 4,
    rain1h: 3,
    rain3h: 8,
    rain24h: 22,
    soilSaturation: 0.34,
    drainUtilization: 0.42,
    overflow: 0,
    roadRecommendation: "PASSABLE",
    alertLevel: "LOW",
    reasons: ["rainfall_light", "drains_below_capacity"],
    timeline: [
      point("NOW", 0.18, "LOW", 0.82, "STABLE"),
      point("+30 min", 0.19, "LOW", 0.80, "STABLE"),
      point("+60 min", 0.20, "LOW", 0.78, "STABLE")
    ]
  },
  WATCH: {
    cityStatus: "ELEVATED",
    riskScore: 0.38,
    riskLevel: "WATCH",
    confidence: 0.79,
    rainfallIntensity: 18,
    rain1h: 18,
    rain3h: 38,
    rain24h: 64,
    soilSaturation: 0.56,
    drainUtilization: 0.76,
    overflow: 0,
    roadRecommendation: "CAUTION",
    alertLevel: "WATCH",
    reasons: ["rainfall_increasing", "drain_capacity_tightening"],
    timeline: [
      point("NOW", 0.38, "WATCH", 0.79, "RISING"),
      point("+30 min", 0.47, "WATCH", 0.76, "RISING"),
      point("+60 min", 0.55, "WARNING", 0.72, "RISING")
    ]
  },
  WARNING: {
    cityStatus: "ELEVATED",
    riskScore: 0.64,
    riskLevel: "WARNING",
    confidence: 0.74,
    rainfallIntensity: 42,
    rain1h: 48,
    rain3h: 92,
    rain24h: 145,
    soilSaturation: 0.82,
    drainUtilization: 1.18,
    overflow: 0.42,
    roadRecommendation: "AVOID",
    alertLevel: "WARNING",
    reasons: ["rainfall_increasing", "soil_saturation_high"],
    timeline: [
      point("NOW", 0.64, "WARNING", 0.74, "RISING"),
      point("+30 min", 0.76, "HIGH", 0.70, "RISING"),
      point("+60 min", 0.84, "HIGH", 0.66, "RISING")
    ]
  },
  SEVERE: {
    cityStatus: "EMERGENCY",
    riskScore: 0.88,
    riskLevel: "SEVERE",
    confidence: 0.71,
    rainfallIntensity: 70,
    rain1h: 84,
    rain3h: 168,
    rain24h: 270,
    soilSaturation: 0.96,
    drainUtilization: 1.56,
    overflow: 1.2,
    roadRecommendation: "AVOID",
    alertLevel: "SEVERE",
    reasons: ["severe_runoff", "drain_overload", "route_viability_degraded"],
    timeline: [
      point("NOW", 0.88, "SEVERE", 0.71, "RISING"),
      point("+30 min", 0.92, "SEVERE", 0.68, "RISING"),
      point("+60 min", 0.95, "SEVERE", 0.62, "RISING")
    ]
  }
};

export const scenarioStages = Object.keys(stages) as ScenarioStage[];

export const mockProvider: PravahaApi = {
  async getMapIntelligence(stage) {
    const profile = stages[stage];
    return {
      snapshot_id: snapshotId(stage),
      generated_at: generatedAt,
      mode: "DEMO",
      data_label: "SIMULATED",
      city: {
        city_id: "UK-DEHRADUN",
        name: "Dehradun",
        operational_status: profile.cityStatus,
        confidence: profile.confidence,
        reasons: profile.reasons,
        last_updated: generatedAt
      },
      layers: {
        catchments: collection([
          feature(
            "catchment",
            "UK-CHM-DEHRADUN-01",
            "Polygon",
            [
              [
                [78.028, 30.318],
                [78.058, 30.318],
                [78.058, 30.344],
                [78.028, 30.344],
                [78.028, 30.318]
              ]
            ],
            {
              risk_level: profile.riskLevel,
              risk_score: profile.riskScore,
              confidence: profile.confidence
            }
          )
        ]),
        wards: collection([
          feature(
            "ward",
            "WARD-07",
            "Polygon",
            [
              [
                [78.034, 30.322],
                [78.052, 30.322],
                [78.052, 30.339],
                [78.034, 30.339],
                [78.034, 30.322]
              ]
            ],
            { name: "Ward 7", risk_level: profile.riskLevel }
          )
        ]),
        rainfall: collection([
          feature("rainfall", "RAIN-CELL-01", "Polygon", [
            [
              [78.032, 30.321],
              [78.052, 30.321],
              [78.052, 30.341],
              [78.032, 30.341],
              [78.032, 30.321]
            ]
          ], {
            intensity_mm_per_hr: profile.rainfallIntensity
          })
        ]),
        sensors: collection([
          feature("sensor", "SIM_NODE_04", "Point", [78.039, 30.329], {
            data_label: "SIMULATED",
            rainfall_mm_per_hr: profile.rainfallIntensity
          })
        ]),
        rivers: collection([
          feature(
            "river",
            "RIVER-01",
            "LineString",
            [
              [78.026, 30.317],
              [78.043, 30.329],
              [78.061, 30.343]
            ],
            { name: "seasonal stream" }
          )
        ]),
        drains: collection([
          feature(
            "drain",
            "DRAIN-01",
            "LineString",
            [
              [78.030, 30.320],
              [78.038, 30.328],
              [78.047, 30.336]
            ],
            {
              risk_level:
                profile.drainUtilization >= 1 ? "HIGH" : "WATCH",
              utilization: profile.drainUtilization
            }
          )
        ]),
        roads: collection([
          feature(
            "road",
            "ROAD-FAST",
            "LineString",
            [
              [78.030, 30.3202],
              [78.037, 30.3282],
              [78.047, 30.337]
            ],
            { recommendation: profile.roadRecommendation }
          ),
          feature(
            "road",
            "ROAD-BYPASS",
            "LineString",
            [
              [78.029, 30.319],
              [78.041, 30.326],
              [78.056, 30.338]
            ],
            { recommendation: stage === "NORMAL" ? "PASSABLE" : "CAUTION" }
          )
        ]),
        landslide: collection([
          feature("landslide", "SLOPE-01", "Polygon", [
            [
              [78.044, 30.330],
              [78.057, 30.330],
              [78.057, 30.343],
              [78.044, 30.343],
              [78.044, 30.330]
            ]
          ], {
            susceptibility:
              stage === "SEVERE" ? "HIGH" : stage === "NORMAL" ? "LOW" : "WATCH"
          })
        ]),
        closures: collection(
          stage === "SEVERE"
            ? [
                feature(
                  "closure",
                  "ROAD-CLOSED",
                  "LineString",
                  [
                    [78.036, 30.324],
                    [78.042, 30.331]
                  ],
                  { recommendation: "CLOSED", authority_closed: true }
                )
              ]
            : []
        ),
        shelters: collection([
          feature("shelter", "SHELTER-01", "Point", [78.056, 30.338], {
            status: "AVAILABLE"
          })
        ]),
        routes: collection([
          feature(
            "route",
            "ROUTE-SAFE-DEMO",
            "LineString",
            routeCoordinates(stage),
            { strategy: "safest" }
          )
        ])
      },
      summary: {
        catchment_count: 1,
        high_risk_catchments: profile.riskScore >= 0.7 ? 1 : 0,
        overflowing_drains: profile.overflow > 0 ? 1 : 0,
        roads_to_avoid: profile.roadRecommendation === "AVOID" ? 1 : 0,
        confirmed_road_closures: 0,
        active_alerts: stage === "NORMAL" ? 0 : 1
      }
    } as MapIntelligenceResponse;
  },

  async getCatchmentDetail(id, stage) {
    const profile = stages[stage];
    return {
      ...risk(profile, ["SIM_NODE_04"]),
      catchment_id: id,
      snapshot_id: snapshotId(stage),
      fused_state: "FusedCatchmentState v2.1",
      hydrology: {
        runoff_mm: Math.round(profile.rain1h * profile.soilSaturation * 0.48),
        concentration_time_minutes: 26
      },
      rainfall: {
        intensity_mm_per_hr: profile.rainfallIntensity,
        rain_15m: Math.round(profile.rain1h / 4),
        rain_30m: Math.round(profile.rain1h / 2),
        rain_1h: profile.rain1h,
        rain_3h: profile.rain3h,
        rain_6h: profile.rain3h + 26,
        rain_24h: profile.rain24h
      },
      soil: {
        saturation: profile.soilSaturation
      },
      anticipation: {
        trend: profile.timeline[0].trend,
        threshold_window:
          stage === "NORMAL"
            ? undefined
            : {
                risk_level:
                  stage === "WATCH" ? "WARNING" : profile.riskLevel,
                earliest_minutes: 30,
                latest_minutes: 60
              },
        timeline: profile.timeline
      },
      landslide: {
        risk_level:
          profile.soilSaturation > 0.9
            ? "HIGH"
            : profile.soilSaturation > 0.75
              ? "WARNING"
              : "WATCH",
        susceptibility_score: Math.min(0.18 + profile.soilSaturation * 0.62, 1),
        reasons: ["steep_terrain", "soil_saturation_increasing"]
      }
    };
  },

  async getDrainDetail(id, stage) {
    const profile = stages[stage];
    return {
      drain_id: id,
      snapshot_id: snapshotId(stage),
      risk_score: Math.min(profile.drainUtilization / 1.6, 1),
      risk_level: profile.drainUtilization >= 1 ? "HIGH" : "WATCH",
      confidence: profile.confidence,
      reasons:
        profile.overflow > 0
          ? ["estimated_inflow_exceeds_effective_capacity"]
          : ["drain_utilization_below_capacity"],
      provenance: simulated(["UK-CHM-DEHRADUN-01"], {
        capacity_verification_status: "ESTIMATED"
      }),
      last_updated: generatedAt,
      inflow_m3_per_s: Number((profile.drainUtilization * 2.6).toFixed(2)),
      capacity_m3_per_s: 2.6,
      capacity_utilization: profile.drainUtilization,
      overflow_m3_per_s: profile.overflow,
      condition: "ESTIMATED",
      affected_roads: ["ROAD-FAST"]
    };
  },

  async getRoadDetail(id, stage) {
    const profile = stages[stage];
    return {
      road_id: id,
      snapshot_id: snapshotId(stage),
      risk_score: id === "ROAD-BYPASS" ? 0.34 : Math.min(profile.riskScore + 0.12, 1),
      risk_level: id === "ROAD-BYPASS" ? "WATCH" : profile.riskLevel,
      confidence: profile.confidence,
      reasons:
        profile.roadRecommendation === "AVOID" && id !== "ROAD-BYPASS"
          ? ["nearby_drain_over_capacity", "flood_risk_requires_avoidance"]
          : ["route_segment_requires_monitoring"],
      provenance: simulated(["DRAIN-01"], {
        static_verification_status: "ESTIMATED"
      }),
      last_updated: generatedAt,
      recommendation:
        id === "ROAD-BYPASS"
          ? stage === "NORMAL"
            ? "PASSABLE"
            : "CAUTION"
          : profile.roadRecommendation,
      associated_drain_id: "DRAIN-01",
      authority_closed: false,
      terrain: {
        depression_score: id === "ROAD-BYPASS" ? 0.12 : 0.68
      },
      historical_waterlogging_score: id === "ROAD-BYPASS" ? 0.08 : 0.76,
      landslide_exposure: {
        risk_level: stage === "SEVERE" ? "HIGH" : "WATCH",
        susceptibility_score: stage === "SEVERE" ? 0.72 : 0.38
      }
    };
  },

  async getSensorDetail(id, stage) {
    const profile = stages[stage];
    return {
      device_id: id,
      snapshot_id: snapshotId(stage),
      measurements: {
        rainfall_mm_per_hr: profile.rainfallIntensity,
        soil_moisture_percentage: Math.round(profile.soilSaturation * 100)
      },
      observed_at: generatedAt,
      age_minutes: 2,
      freshness: "GOOD",
      provenance: simulated([id]),
      last_updated: generatedAt
    };
  },

  async getAlerts(stage) {
    if (stage === "NORMAL") {
      return [];
    }
    const profile = stages[stage];
    return [
      {
        alert_id: `ALERT-${stage}`,
        alert_type: "FLOOD_WATCH",
        risk_level: profile.alertLevel,
        confidence: profile.confidence,
        message: `Demo ${profile.alertLevel.toLowerCase()} state for Dehradun catchment.`,
        affected_entity_ids: ["UK-CHM-DEHRADUN-01", "DRAIN-01", "ROAD-FAST"],
        reasons: profile.reasons,
        provenance: simulated(["SIM_NODE_04"]),
        issued_at: generatedAt,
        last_updated: generatedAt
      }
    ];
  },

  async planSafeRoute(request: SafeRouteRequest, stage: ScenarioStage) {
    const profile = stages[stage];
    const blocked =
      stage === "SEVERE" && request.strategy === "fastest_available";

    if (blocked) {
      return {
        status: "NO_SAFE_ROUTE",
        snapshot_id: snapshotId(stage),
        generated_at: generatedAt,
        reason_code: "NO_ROUTABLE_PATH",
        message:
          "No route satisfies the current closure and avoidance constraints.",
        blocked_by: [
          segment("ROAD-FAST", "AVOID", 0.91, "SEVERE"),
          segment("ROAD-CLOSED", "CLOSED", 0.95, "SEVERE")
        ],
        provenance: simulated(["SIM_NODE_04", "DRAIN-01"]),
        safety_note:
          "PRAVAHA is decision support and does not guarantee route safety."
      };
    }

    const route =
      profile.roadRecommendation === "AVOID"
        ? {
            route_id: "ROUTE-BYPASS",
            label: "Bypass via higher ground",
            geometry: lineGeometry(stage),
            travel_time_minutes: 18,
            distance_km: 6.4,
            maximum_risk_score: 0.38,
            minimum_confidence: 0.71,
            unsafe_segments_avoided: 1,
            closures_avoided: 0,
            segments: [segment("ROAD-BYPASS", "CAUTION", 0.38, "WATCH")]
          }
        : {
            route_id: "ROUTE-DIRECT",
            label: "Direct monitored route",
            geometry: lineGeometry(stage),
            travel_time_minutes: 11,
            distance_km: 4.8,
            maximum_risk_score: profile.riskScore,
            minimum_confidence: profile.confidence,
            unsafe_segments_avoided: 0,
            closures_avoided: 0,
            segments: [
              segment(
                "ROAD-FAST",
                profile.roadRecommendation,
                profile.riskScore,
                profile.riskLevel
              )
            ]
          };

    const selected_route = {
      ...route,
      strategy: request.strategy,
      additional_time_vs_fastest_minutes:
        route.route_id === "ROUTE-BYPASS" ? 7 : 0,
      explanation:
        route.route_id === "ROUTE-BYPASS"
          ? ["avoids_model_avoid_road", "higher_confidence_corridor"]
          : ["direct_route_currently_monitored"]
    };

    return {
      status: "ROUTE_FOUND",
      snapshot_id: snapshotId(stage),
      generated_at: generatedAt,
      selected_route,
      alternatives: [selected_route],
      provenance: simulated(["SIM_NODE_04", "DRAIN-01"]),
      safety_note:
        "PRAVAHA is decision support and does not guarantee route safety."
    } satisfies SafeRouteResponse;
  }
};

function point(
  label: TimelinePoint["label"],
  risk_score: number,
  risk_level: RiskLevel,
  confidence: number,
  trend: TimelinePoint["trend"]
): TimelinePoint {
  return { label, risk_score, risk_level, confidence, trend };
}

function risk(profile: StageProfile, sources: string[]) {
  return {
    risk_score: profile.riskScore,
    risk_level: profile.riskLevel,
    confidence: profile.confidence,
    reasons: profile.reasons,
    provenance: simulated(sources, {
      static_verification_status: "ESTIMATED"
    }),
    last_updated: generatedAt
  };
}

function simulated(
  sources: string[],
  extras: Partial<SourceMetadata> = {}
): SourceMetadata {
  return {
    data_label: "SIMULATED" satisfies DataLabel,
    sources,
    provider: "frontend-demo-provider",
    ...extras
  };
}

function collection(features: FeatureCollection["features"]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features
  };
}

function feature(
  entityType: string,
  id: string,
  geometryType: string,
  coordinates: unknown,
  properties: Record<string, unknown>
): GeoJsonFeature {
  return {
    type: "Feature" as const,
    id,
    geometry: {
      type: geometryType,
      coordinates
    } as GeoJsonFeature["geometry"],
    properties: {
      id,
      entityType,
      data_label: "SIMULATED",
      ...properties
    }
  };
}

function lineGeometry(stage: ScenarioStage) {
  return {
    type: "LineString" as const,
    coordinates: routeCoordinates(stage)
  };
}

function segment(
  road_id: string,
  recommendation: RoadRecommendation,
  risk_score: number,
  risk_level: RiskLevel
) {
  return {
    road_id,
    recommendation,
    risk_score,
    risk_level,
    confidence: 0.72,
    reasons: ["demo_risk_evidence"]
  };
}

function routeCoordinates(stage: ScenarioStage): [number, number][] {
  if (stage === "WARNING" || stage === "SEVERE") {
    return [
      [78.029, 30.319],
      [78.041, 30.326],
      [78.056, 30.338]
    ];
  }
  return [
    [78.030, 30.320],
    [78.039, 30.329],
    [78.052, 30.335]
  ];
}

function snapshotId(stage: ScenarioStage) {
  return `snap_demo_${stage.toLowerCase()}_20260909T084500Z`;
}
