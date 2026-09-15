import type {
  Alert,
  CatchmentDetail,
  CityStatus,
  DataLabel,
  DataMetric,
  DrainDetail,
  FeatureCollection,
  GeoJsonFeature,
  LandslideDetail,
  LocationInspection,
  MapIntelligenceResponse,
  PravahaApi,
  ProvenanceRow,
  RainfallWindowMetric,
  RiskLevel,
  RoadDetail,
  RoadRecommendation,
  RouteAlternative,
  RouteDetail,
  RouteSegment,
  SafeRouteRequest,
  SafeRouteResponse,
  ScenarioStage,
  SelectedEntity,
  SensorDetail,
  ShelterDetail,
  SourceHealth,
  SourceHealthDetail,
  SourceMetadata,
  StructuredEvent,
  TimelinePoint,
  WardDetail
} from "./types";

const generatedAt = "2026-09-09T08:45:00.000Z";
const scenarioId = "DEMO-001";
const cityId = "UK-DEHRADUN";
const catchmentId = "UK-CHM-DEHRADUN-01";
const wardId = "WARD-DEHRADUN-07";
const villageId = "VILLAGE-CHANDRABANI";
const drainId = "D-22";
const roadFastId = "ROAD-SHELTER-CORRIDOR";
const roadBypassId = "ROAD-HIGHER-GROUND-BYPASS";
const roadClosedId = "ROAD-BRIDGE-APPROACH";
const roadHillId = "ROAD-HILLSIDE-LINK";
const routeId = "ROUTE-DEMO-001";
const shelterId = "SHELTER-SCHOOL-01";
const sensorId = "SENSOR-SIM-RAIN-SOIL-01";
const sensorSecondaryId = "SENSOR-SIM-RAIN-SOIL-02";
const streamId = "STREAM-DEMO-001";
const landslideZoneId = "LANDSLIDE-ZONE-S-01";
const noSafeDestinationId = "DEMO-NO-SAFE-ROUTE";

interface StageProfile {
  cityStatus: CityStatus["operational_status"];
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  rainfallIntensity: number;
  rain1h: number;
  rain3h: number;
  rain24h: number;
  soilSaturation: number;
  runoffMm: number;
  discharge: number;
  drainUtilization: number;
  predictedDrainUtilization: number;
  overflow: number;
  roadRecommendation: RoadRecommendation;
  alertLevel: RiskLevel;
  exposedPopulation: number | null;
  latestThresholdCrossing: string | null;
  reasons: string[];
  timeline: TimelinePoint[];
}

const stages: Record<ScenarioStage, StageProfile> = {
  NORMAL: {
    cityStatus: "NORMAL",
    riskScore: 0.18,
    riskLevel: "LOW",
    confidence: 0.84,
    rainfallIntensity: 4,
    rain1h: 3,
    rain3h: 8,
    rain24h: 22,
    soilSaturation: 0.34,
    runoffMm: 1.2,
    discharge: 0.36,
    drainUtilization: 0.42,
    predictedDrainUtilization: 0.44,
    overflow: 0,
    roadRecommendation: "PASSABLE",
    alertLevel: "LOW",
    exposedPopulation: null,
    latestThresholdCrossing: null,
    reasons: ["rainfall_light", "drains_below_capacity", "soil_not_saturated"],
    timeline: [
      point("NOW", 0.18, "LOW", 0.84, "STABLE", "42%", "PASSABLE", "NORMAL", "Stable low-risk demo state"),
      point("+15 min", 0.18, "LOW", 0.83, "STABLE", "43%", "PASSABLE", "NORMAL", "No threshold crossing"),
      point("+30 min", 0.19, "LOW", 0.82, "STABLE", "44%", "PASSABLE", "NORMAL", "Drain reserve remains available"),
      point("+60 min", 0.2, "LOW", 0.8, "STABLE", "46%", "PASSABLE", "NORMAL", "Monitor only")
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
    runoffMm: 8.1,
    discharge: 1.12,
    drainUtilization: 0.76,
    predictedDrainUtilization: 0.88,
    overflow: 0,
    roadRecommendation: "CAUTION",
    alertLevel: "WATCH",
    exposedPopulation: null,
    latestThresholdCrossing: "+60 min WARNING",
    reasons: ["rainfall_increasing", "drain_capacity_tightening", "soil_moisture_rising"],
    timeline: [
      point("NOW", 0.38, "WATCH", 0.79, "RISING", "76%", "CAUTION", "ELEVATED", "Rainfall trend increasing"),
      point("+15 min", 0.43, "WATCH", 0.77, "RISING", "81%", "CAUTION", "ELEVATED", "Drain reserve narrowing"),
      point("+30 min", 0.48, "WATCH", 0.75, "RISING", "88%", "CAUTION", "ELEVATED", "Approaching warning threshold"),
      point("+60 min", 0.56, "WARNING", 0.72, "RISING", "96%", "CAUTION", "WARNING", "Possible WARNING threshold")
    ]
  },
  WARNING: {
    cityStatus: "WARNING",
    riskScore: 0.64,
    riskLevel: "WARNING",
    confidence: 0.74,
    rainfallIntensity: 42,
    rain1h: 48,
    rain3h: 92,
    rain24h: 145,
    soilSaturation: 0.82,
    runoffMm: 19.1,
    discharge: 3.07,
    drainUtilization: 1.18,
    predictedDrainUtilization: 1.31,
    overflow: 0.42,
    roadRecommendation: "AVOID",
    alertLevel: "WARNING",
    exposedPopulation: null,
    latestThresholdCrossing: "+30 min HIGH",
    reasons: ["rainfall_increasing", "soil_saturation_high", "downstream_drain_over_capacity"],
    timeline: [
      point("NOW", 0.64, "WARNING", 0.74, "RISING", "118%", "AVOID", "WARNING", "Drain D-22 over capacity"),
      point("+15 min", 0.7, "HIGH", 0.72, "RISING", "124%", "AVOID", "WARNING", "Runoff continues rising"),
      point("+30 min", 0.76, "HIGH", 0.7, "RISING", "131%", "AVOID", "WARNING", "Road ROAD-SHELTER-CORRIDOR remains AVOID"),
      point("+60 min", 0.84, "HIGH", 0.66, "RISING", "143%", "AVOID", "EMERGENCY", "Possible corridor degradation")
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
    runoffMm: 38.7,
    discharge: 5.94,
    drainUtilization: 1.56,
    predictedDrainUtilization: 1.72,
    overflow: 1.2,
    roadRecommendation: "AVOID",
    alertLevel: "SEVERE",
    exposedPopulation: null,
    latestThresholdCrossing: "NOW SEVERE",
    reasons: ["severe_runoff", "drain_overload", "route_viability_degraded", "landslide_susceptibility_high"],
    timeline: [
      point("NOW", 0.88, "SEVERE", 0.71, "RISING", "156%", "AVOID", "EMERGENCY", "Severe hazard state active"),
      point("+15 min", 0.9, "SEVERE", 0.7, "RISING", "163%", "AVOID", "EMERGENCY", "Drain overflow expanding"),
      point("+30 min", 0.92, "SEVERE", 0.68, "RISING", "172%", "AVOID", "EMERGENCY", "Fastest corridor unavailable"),
      point("+60 min", 0.95, "SEVERE", 0.62, "RISING", "184%", "AVOID", "EMERGENCY", "Shelter routing requires review")
    ]
  }
};

export const scenarioStages = Object.keys(stages) as ScenarioStage[];

export const mockProvider: PravahaApi = {
  async getMapIntelligence(stage = "WARNING") {
    const profile = stages[stage];
    return {
      snapshot_id: snapshotId(stage),
      generated_at: generatedAt,
      state_time: generatedAt,
      scenario_id: scenarioId,
      mode: "DEMO",
      data_label: "SIMULATED",
      city: {
        city_id: cityId,
        name: "Dehradun",
        district: "Dehradun district demo sector",
        operational_status: profile.cityStatus,
        confidence: profile.confidence,
        reasons: profile.reasons,
        last_updated: generatedAt
      },
      layers: buildLayers(stage, profile),
      summary: {
        catchment_count: 1,
        high_risk_catchments: profile.riskScore >= 0.7 ? 1 : 0,
        overflowing_drains: profile.overflow > 0 ? 1 : 0,
        roads_to_avoid: profile.roadRecommendation === "AVOID" ? 1 : 0,
        confirmed_road_closures: stage === "SEVERE" ? 1 : 0,
        active_alerts: stage === "NORMAL" ? 0 : stage === "WATCH" ? 1 : 2,
        highest_risk_catchment: "Chandrabani upper catchment",
        highest_risk_ward: "Ward 7 demo sector",
        shelters_available: 1,
        exposed_population: profile.exposedPopulation,
        source_health: sourceHealth(stage),
        latest_threshold_crossing: profile.latestThresholdCrossing
      },
      source_health: sourceHealth(stage),
      events: events(stage),
      model_metadata: modelMetadata(stage)
    };
  },

  async getCatchmentDetail(id, stage = "WARNING") {
    return catchmentDetail(id, stage);
  },

  async getDrainDetail(id, stage = "WARNING") {
    return drainDetail(id, stage);
  },

  async getRoadDetail(id, stage = "WARNING") {
    return roadDetail(id, stage);
  },

  async getSensorDetail(id, stage = "WARNING") {
    return sensorDetail(id, stage);
  },

  async getEntityDetail(selection, stage = "WARNING") {
    if (selection.type === "catchment") {
      return catchmentDetail(selection.id, stage);
    }
    if (selection.type === "drain") {
      return drainDetail(selection.id, stage);
    }
    if (selection.type === "road") {
      return roadDetail(selection.id, stage);
    }
    if (selection.type === "sensor") {
      return sensorDetail(selection.id, stage);
    }
    if (selection.type === "source_health") {
      return sourceHealthDetail(selection.id, stage);
    }
    if (selection.type === "ward") {
      return wardDetail(selection.id, stage);
    }
    if (selection.type === "landslide") {
      return landslideDetail(selection.id, stage);
    }
    if (selection.type === "route") {
      return routeDetail(selection.id, stage);
    }
    if (selection.type === "shelter") {
      return shelterDetail(selection.id, stage);
    }
    return locationInspection(selection, stage);
  },

  async getAlerts(stage = "WARNING") {
    if (stage === "NORMAL") {
      return [];
    }
    const profile = stages[stage];
    const alerts: Alert[] = [
      {
        alert_id: `ALERT-${stage}-FLOOD`,
        alert_type: "flash_flood",
        risk_level: profile.alertLevel,
        severity: profile.alertLevel,
        confidence: profile.confidence,
        location: "Chandrabani upper catchment",
        message: `${profile.alertLevel} demo flood intelligence for Ward 7 corridor.`,
        recommended_review:
          stage === "WATCH"
            ? "Review drain D-22 and prepare route monitoring."
            : "Inspect AVOID roads and drainage overload before dispatch.",
        affected_entity_ids: [catchmentId, drainId, roadFastId],
        reasons: profile.reasons,
        provenance: simulated([sensorId, drainId]),
        issued_at: generatedAt,
        last_updated: generatedAt
      }
    ];

    if (profile.overflow > 0) {
      alerts.push({
        alert_id: `ALERT-${stage}-DRAIN`,
        alert_type: "drainage_overload",
        risk_level: profile.riskLevel,
        severity: profile.riskLevel,
        confidence: profile.confidence,
        location: "Drain D-22",
        message: "D-22 exceeds effective capacity in the deterministic demo scenario.",
        recommended_review:
          "Review roads influenced by D-22 before approving evacuation movement.",
        affected_entity_ids: [drainId, roadFastId],
        reasons: ["estimated_inflow_exceeds_effective_capacity"],
        provenance: simulated([catchmentId, sensorId], {
          capacity_verification_status: "ESTIMATED"
        }),
        issued_at: generatedAt,
        last_updated: generatedAt
      });
    }

    return alerts;
  },

  async getEvents(stage = "WARNING") {
    return events(stage);
  },

  async planSafeRoute(
    request: SafeRouteRequest,
    stage: ScenarioStage = "WARNING"
  ) {
    const result = evaluateRouteGraph(request, stage);

    if (!result.route) {
      return {
        status: "NO_SAFE_ROUTE",
        snapshot_id: snapshotId(stage),
        generated_at: generatedAt,
        reason_code: "NO_ROUTABLE_PATH",
        message:
          "No reliable route is available under current demo hazard constraints.",
        blocked_by: result.blocked,
        provenance: simulated([sensorId, drainId]),
        safety_note:
          "PRAVAHA is decision support and does not guarantee route safety."
      };
    }

    const selected_route = {
      ...result.route,
      strategy: request.strategy,
      additional_time_vs_fastest_minutes: result.additionalTime,
      explanation: result.explanation
    };

    return {
      status: "ROUTE_FOUND",
      snapshot_id: snapshotId(stage),
      generated_at: generatedAt,
      selected_route,
      alternatives: [selected_route],
      provenance: simulated([sensorId, drainId]),
      safety_note:
        "PRAVAHA is decision support and does not guarantee route safety."
    } satisfies SafeRouteResponse;
  }
};

function buildLayers(
  stage: ScenarioStage,
  profile: StageProfile
): MapIntelligenceResponse["layers"] {
  return {
    catchments: collection([
      feature("catchment", catchmentId, "Polygon", [
        [
          [78.028, 30.318],
          [78.058, 30.318],
          [78.058, 30.344],
          [78.028, 30.344],
          [78.028, 30.318]
        ]
      ], {
        name: "Chandrabani upper catchment",
        risk_level: profile.riskLevel,
        risk_score: profile.riskScore,
        confidence: profile.confidence
      })
    ]),
    wards: collection([
      feature("ward", wardId, "Polygon", [
        [
          [78.034, 30.322],
          [78.052, 30.322],
          [78.052, 30.339],
          [78.034, 30.339],
          [78.034, 30.322]
        ]
      ], {
        name: "Ward 7 demo sector",
        risk_level: profile.riskLevel,
        confidence: profile.confidence
      })
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
        intensity_mm_per_hr: profile.rainfallIntensity,
        risk_level: profile.riskLevel
      })
    ]),
    sensors: collection([
      feature("sensor", sensorId, "Point", [78.039, 30.329], {
        status: "SIMULATED",
        freshness: "GOOD",
        rainfall_mm_per_hr: profile.rainfallIntensity
      }),
      feature("sensor", sensorSecondaryId, "Point", [78.049, 30.337], {
        status: stage === "SEVERE" ? "MISSING" : "SIMULATED",
        freshness: stage === "SEVERE" ? "UNUSABLE" : "DEGRADED",
        rainfall_mm_per_hr: stage === "SEVERE" ? null : profile.rainfallIntensity * 0.8
      })
    ]),
    rivers: collection([
      feature("river", streamId, "LineString", [
        [78.026, 30.317],
        [78.043, 30.329],
        [78.061, 30.343]
      ], { name: "Seasonal stream", stream_order: 2 })
    ]),
    drains: collection([
      feature("drain", drainId, "LineString", [
        [78.030, 30.320],
        [78.038, 30.328],
        [78.047, 30.336]
      ], {
        name: "D-22 downstream collector",
        risk_level: profile.drainUtilization >= 1 ? "HIGH" : "WATCH",
        utilization: profile.drainUtilization
      }),
      feature("drain", "D-23", "LineString", [
        [78.052, 30.321],
        [78.048, 30.330],
        [78.045, 30.341]
      ], {
        name: "D-23 hillside chute",
        risk_level: stage === "SEVERE" ? "WARNING" : "WATCH",
        utilization: Math.min(profile.drainUtilization * 0.78, 1.12)
      })
    ]),
    roads: collection([
      feature("road", roadFastId, "LineString", [
        [78.030, 30.3202],
        [78.037, 30.3282],
        [78.047, 30.337]
      ], {
        name: "Clock Tower shelter corridor",
        recommendation: profile.roadRecommendation,
        risk_level: profile.riskLevel
      }),
      feature("road", roadBypassId, "LineString", [
        [78.029, 30.319],
        [78.041, 30.326],
        [78.056, 30.338]
      ], {
        name: "Higher-ground bypass",
        recommendation: stage === "NORMAL" ? "PASSABLE" : "CAUTION",
        risk_level: stage === "NORMAL" ? "LOW" : "WATCH"
      }),
      feature("road", roadHillId, "LineString", [
        [78.045, 30.330],
        [78.055, 30.342]
      ], {
        name: "Hill road segment",
        recommendation: stage === "SEVERE" ? "AVOID" : "CAUTION",
        risk_level: stage === "SEVERE" ? "HIGH" : "WATCH"
      })
    ]),
    landslide: collection([
      feature("landslide", landslideZoneId, "Polygon", [
        [
          [78.044, 30.330],
          [78.057, 30.330],
          [78.057, 30.343],
          [78.044, 30.343],
          [78.044, 30.330]
        ]
      ], {
        name: "S-01 steep saturated slope",
        susceptibility:
          stage === "SEVERE" ? "HIGH" : stage === "NORMAL" ? "LOW" : "WATCH",
        risk_level:
          stage === "SEVERE" ? "HIGH" : stage === "NORMAL" ? "LOW" : "WATCH"
      })
    ]),
    closures: collection(
      stage === "SEVERE"
        ? [
            feature("road", roadClosedId, "LineString", [
              [78.036, 30.324],
              [78.042, 30.331]
            ], {
              name: "Bridge approach",
              recommendation: "CLOSED",
              authority_closed: true,
              risk_level: "SEVERE"
            })
          ]
        : []
    ),
    shelters: collection([
      feature("shelter", shelterId, "Point", [78.056, 30.338], {
        name: "School shelter",
        status: "AVAILABLE"
      })
    ]),
    routes: collection([
      feature("route", routeId, "LineString", routeCoordinates(stage), {
        strategy: "safest",
        recommendation:
          profile.roadRecommendation === "AVOID" ? "BYPASS" : "DIRECT"
      })
    ])
  };
}

function catchmentDetail(id: string, stage: ScenarioStage): CatchmentDetail {
  const profile = stages[stage];
  return {
    ...risk(profile, [sensorId]),
    type: "catchment",
    catchment_id: id,
    name: "Chandrabani upper catchment",
    ward_name: "Ward 7 demo sector",
    snapshot_id: snapshotId(stage),
    fused_state: "FusedCatchmentState v2.1",
    status: profile.cityStatus,
    trend: profile.timeline[0].trend,
    hydrology: {
      runoff_mm: profile.runoffMm,
      discharge_m3_per_s: profile.discharge,
      runoff_coefficient: Number((profile.runoffMm / Math.max(profile.rain1h, 1)).toFixed(2)),
      concentration_time_minutes: 26,
      response:
        profile.drainUtilization >= 1
          ? "Fast response, drainage demand exceeds estimated capacity"
          : "Response within monitored reserve",
      drainage_demand:
        profile.drainUtilization >= 1 ? "Exceeds D-22 capacity" : "Within D-22 reserve"
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
    rainfall_windows: rainfallWindows(profile),
    soil: {
      saturation: profile.soilSaturation,
      status: "SIMULATED",
      confidence: profile.confidence
    },
    terrain: {
      elevation_m: 642,
      mean_slope_fraction: 0.18,
      catchment_area_km2: 4.6,
      curve_number: 79,
      hand_m: null,
      twi: null
    },
    anticipation: {
      trend: profile.timeline[0].trend,
      threshold_window:
        stage === "NORMAL"
          ? undefined
          : {
              risk_level: stage === "WATCH" ? "WARNING" : profile.riskLevel,
              earliest_minutes: stage === "SEVERE" ? 0 : 30,
              latest_minutes: stage === "WATCH" ? 60 : 30
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
      susceptibility_score: Number(
        Math.min(0.18 + profile.soilSaturation * 0.62, 1).toFixed(2)
      ),
      reasons: ["steep_terrain", "soil_saturation_increasing"]
    },
    cascade: [
      {
        label: "Heavy rainfall",
        state: "OBSERVED",
        detail: `${profile.rainfallIntensity} mm/hr SIMULATED fixture`
      },
      {
        label: "Soil saturation",
        state: "OBSERVED",
        detail: `${Math.round(profile.soilSaturation * 100)}% saturation`
      },
      {
        label: "Runoff increase",
        state: "PREDICTED",
        detail: `${profile.runoffMm} mm runoff estimate`
      },
      {
        label: "Drain overload",
        state: profile.overflow > 0 ? "PREDICTED" : "POSSIBLE",
        detail:
          profile.overflow > 0
            ? `D-22 overflow ${profile.overflow} m3/s`
            : "No overflow in this scenario"
      },
      {
        label: "Road flooding",
        state: profile.roadRecommendation === "AVOID" ? "PREDICTED" : "POSSIBLE",
        detail: `${roadFastId} is ${profile.roadRecommendation}`
      }
    ],
    impact: {
      affected_wards: [wardId],
      exposed_roads: [roadFastId, roadHillId],
      threatened_shelters: stage === "SEVERE" ? [shelterId] : [],
      exposed_population: profile.exposedPopulation,
      evacuation_readiness:
        profile.roadRecommendation === "AVOID"
          ? "Needs route review before movement"
          : "Route monitoring sufficient in demo"
    },
    provenance_table: provenanceRows(profile)
  };
}

function drainDetail(id: string, stage: ScenarioStage): DrainDetail {
  const profile = stages[stage];
  return {
    type: "drain",
    drain_id: id,
    name: id === drainId ? "D-22 downstream collector" : "D-23 hillside chute",
    drain_type: "open lined municipal drain",
    snapshot_id: snapshotId(stage),
    risk_score: Math.min(profile.drainUtilization / 1.6, 1),
    risk_level: profile.drainUtilization >= 1 ? "HIGH" : "WATCH",
    confidence: profile.confidence,
    reasons:
      profile.overflow > 0
        ? ["estimated_inflow_exceeds_effective_capacity", "upstream_runoff_rising"]
        : ["drain_utilization_below_capacity"],
    provenance: simulated([catchmentId], {
      capacity_verification_status: "ESTIMATED"
    }),
    last_updated: generatedAt,
    upstream_nodes: ["D-22-U1", "D-22-U2"],
    downstream_node: "D-22-OUT",
    inflow_m3_per_s: Number((profile.drainUtilization * 2.6).toFixed(2)),
    capacity_m3_per_s: 2.6,
    capacity_utilization: profile.drainUtilization,
    predicted_utilization_30m: profile.predictedDrainUtilization,
    overflow_m3_per_s: profile.overflow,
    overflow_margin_m3_per_s: Number((2.6 - profile.drainUtilization * 2.6).toFixed(2)),
    condition: "ESTIMATED",
    condition_factor: 0.82,
    affected_roads: [roadFastId],
    contributing_catchments: [catchmentId],
    nearby_settlements: [villageId, "Ward 7 demo sector"],
    timeline: profile.timeline,
    provenance_table: provenanceRows(profile).filter((row) =>
      ["rainfall", "runoff", "drain capacity"].includes(row.variable)
    )
  };
}

function roadDetail(id: string, stage: ScenarioStage): RoadDetail {
  const profile = stages[stage];
  const isBypass = id === roadBypassId;
  const isClosure = id === roadClosedId;
  const recommendation = isClosure
    ? "CLOSED"
    : isBypass
      ? stage === "NORMAL"
        ? "PASSABLE"
        : "CAUTION"
      : profile.roadRecommendation;

  return {
    type: "road",
    road_id: id,
    name:
      id === roadBypassId
        ? "Higher-ground bypass"
        : isClosure
          ? "Bridge approach authority closure"
          : "Clock Tower shelter corridor",
    road_class: isBypass ? "collector road" : "urban arterial",
    segment_length_km: isBypass ? 2.8 : 1.9,
    jurisdiction: "Dehradun municipal demo sector",
    snapshot_id: snapshotId(stage),
    risk_score: isBypass ? 0.34 : isClosure ? 0.95 : Math.min(profile.riskScore + 0.12, 1),
    risk_level: isBypass ? "WATCH" : isClosure ? "SEVERE" : profile.riskLevel,
    confidence: profile.confidence,
    reasons:
      recommendation === "AVOID"
        ? ["nearby_drain_over_capacity", "flood_risk_requires_avoidance"]
        : recommendation === "CLOSED"
          ? ["authority_confirmed_closure"]
          : ["route_segment_requires_monitoring"],
    provenance: simulated([drainId], {
      static_verification_status: "ESTIMATED"
    }),
    last_updated: generatedAt,
    recommendation,
    status_basis: isClosure ? "AUTHORITY_CONFIRMED" : "MODEL_RECOMMENDATION",
    associated_drain_id: drainId,
    authority_closed: isClosure,
    terrain: {
      depression_score: isBypass ? 0.12 : 0.68,
      stream_proximity_m: isBypass ? 180 : 38,
      mean_slope_fraction: isBypass ? 0.07 : 0.14
    },
    historical_waterlogging_score: isBypass ? 0.08 : 0.76,
    landslide_exposure: {
      risk_level: stage === "SEVERE" ? "HIGH" : "WATCH",
      susceptibility_score: stage === "SEVERE" ? 0.72 : 0.38
    },
    contributors: [
      metric("Catchment flood risk", Math.round(profile.riskScore * 100), "%", profile.riskLevel),
      metric("Nearby drain utilization", Math.round(profile.drainUtilization * 100), "%", profile.drainUtilization >= 1 ? "HIGH" : "WATCH"),
      metric("Stream proximity", isBypass ? 180 : 38, "m", "ESTIMATED"),
      metric("Historical waterlogging", isBypass ? 8 : 76, "%", "ESTIMATED"),
      metric("Landslide exposure", stage === "SEVERE" ? "HIGH" : "WATCH", undefined, stage === "SEVERE" ? "HIGH" : "WATCH")
    ],
    related_infrastructure: [
      metric("Associated drain", drainId, undefined, "ESTIMATED"),
      metric("Nearest shelter", shelterId, undefined, "SIMULATED"),
      metric("Alternative road", roadBypassId, undefined, "SIMULATED")
    ],
    anticipation: [
      metric("Possible degradation", stage === "NORMAL" ? "Not available" : "+30 min", undefined, "SIMULATED"),
      metric("Expected recovery", "Not available", undefined, "MISSING")
    ],
    routing_effect: [
      metric("Current route usage", recommendation === "AVOID" ? "Avoided" : "Eligible", undefined, recommendation),
      metric("Added time caused", recommendation === "AVOID" ? 7 : 0, "min", "SIMULATED")
    ]
  };
}

function sensorDetail(id: string, stage: ScenarioStage): SensorDetail {
  const profile = stages[stage];
  const missing = id === sensorSecondaryId && stage === "SEVERE";
  return {
    type: "sensor",
    device_id: id,
    sensor_type: "rainfall_soil_tilt_node",
    snapshot_id: snapshotId(stage),
    latitude: id === sensorId ? 30.329 : 30.337,
    longitude: id === sensorId ? 78.039 : 78.049,
    source: "deterministic frontend demo provider",
    measurements: {
      rainfall_mm_per_hr: missing ? null : profile.rainfallIntensity,
      soil_moisture_percentage: missing ? null : Math.round(profile.soilSaturation * 100),
      slope_tilt_degrees: missing ? null : Number((1.2 + profile.soilSaturation * 2.4).toFixed(1))
    },
    observed_at: generatedAt,
    age_minutes: missing ? 74 : 2,
    freshness: missing ? "UNUSABLE" : id === sensorId ? "GOOD" : "DEGRADED",
    status: missing ? "MISSING" : "SIMULATED",
    missing_fields: missing
      ? ["rainfall_mm_per_hr", "soil_moisture_percentage", "slope_tilt_degrees"]
      : [],
    provenance: simulated([id]),
    last_updated: generatedAt,
    history: stageHistory(stage)
  };
}

function wardDetail(id: string, stage: ScenarioStage): WardDetail {
  const profile = stages[stage];
  return {
    ...risk(profile, [catchmentId]),
    type: "ward",
    ward_id: id,
    name: "Ward 7 demo sector",
    admin_level: "WARD",
    snapshot_id: snapshotId(stage),
    population: null,
    catchments_intersecting: [catchmentId],
    roads_threatened: profile.roadRecommendation === "AVOID" ? [roadFastId, roadHillId] : [roadFastId],
    shelters: [shelterId],
    evacuation_readiness:
      profile.roadRecommendation === "AVOID"
        ? "Route clearance review required"
        : "Monitor and prepare",
    isolation_risk: stage === "SEVERE" ? "High if fastest corridor remains unavailable" : "Not available",
    major_hazards: ["flash flood", "drainage overload", "landslide susceptibility"],
    current_alerts: stage === "NORMAL" ? [] : [`ALERT-${stage}-FLOOD`],
    predicted_deterioration:
      profile.latestThresholdCrossing ?? "No threshold crossing in demo horizon"
  };
}

function landslideDetail(id: string, stage: ScenarioStage): LandslideDetail {
  const profile = stages[stage];
  const susceptibility = Math.min(0.18 + profile.soilSaturation * 0.62, 1);
  return {
    ...risk(profile, [catchmentId]),
    type: "landslide",
    zone_id: id,
    name: "S-01 steep saturated slope",
    snapshot_id: snapshotId(stage),
    susceptibility_score: Number(susceptibility.toFixed(2)),
    slope_fraction: 0.31,
    soil_saturation_contribution:
      profile.soilSaturation > 0.8 ? "High contribution" : "Moderate contribution",
    rainfall_contribution:
      profile.rainfallIntensity > 40 ? "Current rainfall is a major driver" : "Rainfall monitored",
    historical_inventory: "Demo fixture references historical inventory relationship as ESTIMATED",
    affected_assets: [roadHillId, drainId, streamId],
    cascade_impact: [
      "Slope material could affect Hill road segment",
      "Blocked roadside drainage may increase local waterlogging"
    ]
  };
}

function routeDetail(id: string, stage: ScenarioStage): RouteDetail {
  const profile = stages[stage];
  const bypass = profile.roadRecommendation === "AVOID";
  return {
    type: "route",
    route_id: id,
    label: bypass ? "Bypass via higher ground" : "Direct monitored corridor",
    snapshot_id: snapshotId(stage),
    strategy: "safest",
    travel_time_minutes: bypass ? 18 : 11,
    distance_km: bypass ? 6.4 : 4.8,
    maximum_risk_score: bypass ? 0.38 : profile.riskScore,
    minimum_confidence: bypass ? 0.71 : profile.confidence,
    additional_time_vs_fastest_minutes: bypass ? 7 : 0,
    unsafe_segments_avoided: bypass ? 2 : 0,
    closures_avoided: stage === "SEVERE" ? 1 : 0,
    landslide_exposure: stage === "SEVERE" ? "HIGH" : "WATCH",
    high_risk_segments: stage === "SEVERE" ? 2 : profile.roadRecommendation === "AVOID" ? 1 : 0,
    crossings: 1,
    explanation: bypass
      ? [
          `Avoids ${roadFastId} because it is model AVOID`,
          "Bypasses drainage-overload corridor",
          "Adds time but improves minimum confidence"
        ]
      : ["Uses direct corridor while it remains passable in the demo scenario"],
    provenance: simulated([roadBypassId, drainId])
  };
}

function shelterDetail(id: string, stage: ScenarioStage): ShelterDetail {
  return {
    type: "shelter",
    shelter_id: id,
    name: "School shelter",
    snapshot_id: snapshotId(stage),
    status: stage === "SEVERE" ? "NEAR_CAPACITY" : "AVAILABLE",
    capacity_people: null,
    current_occupancy: null,
    nearest_safe_route: stage === "SEVERE" ? null : routeId,
    provenance: simulated([id], {
      static_verification_status: "ESTIMATED"
    }),
    last_updated: generatedAt
  };
}

function locationInspection(
  selection: SelectedEntity,
  stage: ScenarioStage
): LocationInspection {
  const profile = stages[stage];
  const lon = selection.coordinates?.[0] ?? 78.042;
  const lat = selection.coordinates?.[1] ?? 30.331;
  return {
    type: "location",
    id: `loc_${lat.toFixed(5)}_${lon.toFixed(5)}`,
    snapshot_id: snapshotId(stage),
    latitude: lat,
    longitude: lon,
    jurisdiction: "Dehradun district demo sector",
    ward_or_village: wardId,
    catchment_id: catchmentId,
    nearest_road: roadFastId,
    nearest_stream: streamId,
    nearest_drain: drainId,
    nearest_shelter: shelterId,
    terrain: [
      metric("Elevation", 642, "m", "ESTIMATED"),
      metric("Slope", 0.18, "fraction", "ESTIMATED"),
      metric("Aspect", "Not available", undefined, "MISSING"),
      metric("HAND", "Not available", undefined, "MISSING"),
      metric("TWI", "Not available", undefined, "MISSING"),
      metric("Flow direction", "Not available", undefined, "MISSING")
    ],
    hydrology: [
      metric("Catchment ID", catchmentId, undefined, "SIMULATED"),
      metric("Drain proximity", 42, "m", "ESTIMATED"),
      metric("Current runoff estimate", profile.runoffMm, "mm", "SIMULATED"),
      metric("Drainage density", "Not available", undefined, "MISSING")
    ],
    hazard_context: [
      metric("Local flood risk", profile.riskLevel, undefined, profile.riskLevel),
      metric("Landslide susceptibility", stage === "SEVERE" ? "HIGH" : "WATCH", undefined, stage === "SEVERE" ? "HIGH" : "WATCH"),
      metric("Rainfall intensity", profile.rainfallIntensity, "mm/hr", "SIMULATED"),
      metric("Soil saturation", Math.round(profile.soilSaturation * 100), "%", "SIMULATED")
    ],
    data_quality: [
      metric("Source", "frontend-demo-provider", undefined, "SIMULATED"),
      metric("Resolution", "Not available", undefined, "MISSING"),
      metric("Last updated", generatedAt, undefined, "SIMULATED"),
      metric("Confidence", Math.round(profile.confidence * 100), "%", "SIMULATED")
    ]
  };
}

function sourceHealth(stage: ScenarioStage): SourceHealth[] {
  return [
    {
      source_id: sensorId,
      name: "Rainfall / soil demo sensor",
      category: "sensor",
      status: "SIMULATED",
      last_success_at: generatedAt,
      last_observation_at: generatedAt,
      age_seconds: 120,
      expected_interval_seconds: 900,
      freshness: "GOOD",
      provenance: "SIMULATED",
      message: "Deterministic DEMO-001 sensor fixture"
    },
    {
      source_id: sensorSecondaryId,
      name: "Secondary ridge sensor",
      category: "sensor",
      status: stage === "SEVERE" ? "UNAVAILABLE" : "SIMULATED",
      last_success_at: generatedAt,
      last_observation_at: stage === "SEVERE" ? null : generatedAt,
      age_seconds: stage === "SEVERE" ? 4440 : 180,
      expected_interval_seconds: 900,
      freshness: stage === "SEVERE" ? "UNUSABLE" : "DEGRADED",
      provenance: stage === "SEVERE" ? "MISSING" : "SIMULATED",
      message:
        stage === "SEVERE"
          ? "Missing in severe scenario; values remain null instead of zero"
          : "Deterministic secondary demo sensor"
    },
    {
      source_id: "GIS-DEMO-CATCHMENTS",
      name: "Configurable demo GIS mapping",
      category: "static_gis",
      status: "STATIC",
      last_success_at: null,
      last_observation_at: null,
      age_seconds: null,
      expected_interval_seconds: null,
      freshness: "DEGRADED",
      provenance: "ESTIMATED",
      message: "Static demo mapping; not municipal verification"
    },
    {
      source_id: "ML-DEVELOPMENT-FALLBACK",
      name: "ML development inference spine",
      category: "model",
      status: "DEGRADED",
      last_success_at: generatedAt,
      last_observation_at: null,
      age_seconds: 60,
      expected_interval_seconds: 900,
      freshness: "DEGRADED",
      provenance: "DERIVED",
      message: "Development fallback; not operationally validated"
    }
  ];
}

function sourceHealthDetail(id: string, stage: ScenarioStage): SourceHealthDetail {
  return {
    type: "source_health",
    id,
    snapshot_id: snapshotId(stage),
    generated_at: generatedAt,
    mode: "DEMO",
    sources: sourceHealth(stage),
    events: events(stage),
    model_metadata: modelMetadata(stage)
  };
}

function events(stage: ScenarioStage): StructuredEvent[] {
  if (stage === "NORMAL") {
    return [
      event(
        stage,
        "state_observed",
        "LOW",
        "catchment",
        catchmentId,
        "Normal monitoring state",
        "Rainfall, soil saturation, and drainage utilization remain within the demo monitoring band.",
        ["rainfall_light", "drain_capacity_available"]
      )
    ];
  }

  const profile = stages[stage];
  const result = [
    event(
      stage,
      "risk_escalation",
      profile.riskLevel,
      "catchment",
      catchmentId,
      `${profile.riskLevel} catchment risk`,
      `Fused DEMO-001 observations drive ${profile.riskLevel} flood intelligence for Chandrabani.`,
      profile.reasons
    )
  ];

  if (profile.overflow > 0) {
    result.push(
      event(
        stage,
        "drainage_overload",
        profile.riskLevel,
        "drain",
        drainId,
        "Drain overload predicted",
        "Estimated inflow exceeds D-22 capacity in the deterministic demo scenario.",
        ["estimated_inflow_exceeds_effective_capacity", "upstream_runoff_rising"]
      ),
      event(
        stage,
        "road_status_change",
        profile.riskLevel,
        "road",
        roadFastId,
        "Road marked AVOID by model",
        "The shelter corridor is model-derived AVOID, not authority CLOSED.",
        ["nearby_drain_over_capacity", "avoid_not_closed"]
      )
    );
  }

  if (stage === "SEVERE") {
    result.push(
      event(
        stage,
        "authority_closure",
        "SEVERE",
        "road",
        roadClosedId,
        "Authority closure active",
        "Bridge approach is explicitly CLOSED by authority-confirmed demo fixture.",
        ["authority_confirmed_closure"]
      )
    );
  }

  return result;
}

function event(
  stage: ScenarioStage,
  event_type: string,
  severity: RiskLevel,
  entity_type: StructuredEvent["entity_type"],
  entity_id: string,
  title: string,
  message: string,
  reasons: string[]
): StructuredEvent {
  return {
    event_id: `EVENT-${stage}-${event_type}-${entity_id}`,
    snapshot_id: snapshotId(stage),
    generated_at: generatedAt,
    event_type,
    severity,
    entity_type,
    entity_id,
    title,
    message,
    reasons,
    provenance: simulated([sensorId, drainId])
  };
}

function modelMetadata(stage: ScenarioStage) {
  const profile = stages[stage];
  return {
    prediction_id: `PRED-${catchmentId}-${stage}`,
    model_version: "pravaha-frontend-demo-adapter-v1",
    generated_at: generatedAt,
    input_state_time: generatedAt,
    risk_score: profile.riskScore,
    risk_level: profile.riskLevel,
    confidence: profile.confidence,
    data_quality_score: stage === "SEVERE" ? 0.62 : 0.78,
    runtime_status: "DEVELOPMENT_FALLBACK" as const,
    operationally_validated: false,
    top_factors: profile.reasons
  };
}

function rainfallWindows(profile: StageProfile): RainfallWindowMetric[] {
  const values = [
    ["15 min", Math.round(profile.rain1h / 4), 0.92, 8, 2, 7],
    ["30 min", Math.round(profile.rain1h / 2), 0.88, 14, 2, 9],
    ["1 h", profile.rain1h, 0.84, 24, 2, 11],
    ["3 h", profile.rain3h, 0.76, 52, 2, 18],
    ["6 h", profile.rain3h + 26, 0.68, 77, 2, 31],
    ["24 h", profile.rain24h, 0.61, 164, 2, 46]
  ] as const;

  return values.map(([label, value, coverage, count, age, gap]) => ({
    label,
    value_mm: value,
    status: "DERIVED" as DataLabel,
    coverage_fraction: coverage,
    observation_count: count,
    latest_observation_age_minutes: age,
    largest_gap_minutes: gap,
    quality: coverage >= 0.8 ? "GOOD" : coverage >= 0.65 ? "DEGRADED" : "UNUSABLE"
  }));
}

function provenanceRows(profile: StageProfile): ProvenanceRow[] {
  return [
    {
      variable: "rainfall",
      source: sensorId,
      status: "SIMULATED",
      age_minutes: 2,
      confidence: profile.confidence
    },
    {
      variable: "soil saturation",
      source: sensorId,
      status: "SIMULATED",
      age_minutes: 2,
      confidence: profile.confidence
    },
    {
      variable: "runoff",
      source: "ML hydrology demo output",
      status: "DERIVED",
      age_minutes: 1,
      confidence: profile.confidence - 0.04
    },
    {
      variable: "drain capacity",
      source: "demo GIS profile",
      status: "ESTIMATED",
      age_minutes: null,
      confidence: 0.66
    },
    {
      variable: "DEM terrain",
      source: "demo GIS profile",
      status: "ESTIMATED",
      age_minutes: null,
      confidence: 0.64
    }
  ];
}

function stageHistory(stage: ScenarioStage) {
  const order: ScenarioStage[] = ["NORMAL", "WATCH", "WARNING", "SEVERE"];
  const index = order.indexOf(stage);
  return order.slice(0, index + 1).map((item) => {
    const profile = stages[item];
    return {
      label: item,
      rainfall_mm_per_hr: profile.rainfallIntensity,
      soil_moisture_percentage: Math.round(profile.soilSaturation * 100)
    };
  });
}

function point(
  label: TimelinePoint["label"],
  risk_score: number,
  risk_level: RiskLevel,
  confidence: number,
  trend: TimelinePoint["trend"],
  drainage_status: string,
  road_status: RoadRecommendation,
  city_status: CityStatus["operational_status"],
  note: string
): TimelinePoint {
  return {
    label,
    risk_score,
    risk_level,
    confidence,
    trend,
    drainage_status,
    road_status,
    city_status,
    note
  };
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

interface DemoEdge {
  start: string;
  end: string;
  road_id: string;
  label: string;
  recommendation: RoadRecommendation;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  travel_time_minutes: number;
  distance_km: number;
  coordinates: [number, number][];
}

function evaluateRouteGraph(
  request: SafeRouteRequest,
  stage: ScenarioStage
): {
  route: Omit<RouteAlternative, "strategy" | "additional_time_vs_fastest_minutes" | "explanation"> | null;
  blocked: RouteSegment[];
  additionalTime: number;
  explanation: string[];
} {
  const target =
    request.destination.place_id === noSafeDestinationId ? "isolated" : "shelter";
  const edges = routeEdges(stage);
  const blocked = edges
    .filter((edge) => edge.recommendation === "CLOSED" || edge.recommendation === "AVOID")
    .map((edge) =>
      segment(edge.road_id, edge.recommendation, edge.risk_score, edge.risk_level)
    );
  const traversable = edges.filter((edge) => {
    if (edge.recommendation === "CLOSED") {
      return false;
    }
    if (edge.recommendation === "AVOID" && !request.allow_avoid_segments) {
      return false;
    }
    return true;
  });
  const routeEdgesFound = shortestPath(traversable, "origin", target, request.strategy);

  if (!routeEdgesFound) {
    return {
      route: null,
      blocked,
      additionalTime: 0,
      explanation: []
    };
  }

  const coordinates = routeEdgesFound.flatMap((edge, index) =>
    index === 0 ? edge.coordinates : edge.coordinates.slice(1)
  );
  const travelTime = routeEdgesFound.reduce(
    (total, edge) => total + edge.travel_time_minutes,
    0
  );
  const distance = Number(
    routeEdgesFound.reduce((total, edge) => total + edge.distance_km, 0).toFixed(1)
  );
  const maximumRisk = Math.max(...routeEdgesFound.map((edge) => edge.risk_score));
  const minimumConfidence = Math.min(...routeEdgesFound.map((edge) => edge.confidence));
  const fastest = shortestPath(
    edges.filter((edge) => edge.recommendation !== "CLOSED"),
    "origin",
    target,
    "fastest_available"
  );
  const fastestTime = fastest
    ? fastest.reduce((total, edge) => total + edge.travel_time_minutes, 0)
    : travelTime;
  const usesBypass = routeEdgesFound.some((edge) => edge.road_id === roadBypassId);

  return {
    route: {
      route_id: usesBypass ? "ROUTE-BYPASS" : "ROUTE-DIRECT",
      label: usesBypass ? "Bypass via higher ground" : "Direct monitored corridor",
      travel_time_minutes: travelTime,
      distance_km: distance,
      maximum_risk_score: Number(maximumRisk.toFixed(2)),
      minimum_confidence: Number(minimumConfidence.toFixed(2)),
      unsafe_segments_avoided: blocked.filter((item) => item.recommendation === "AVOID").length,
      closures_avoided: blocked.filter((item) => item.recommendation === "CLOSED").length,
      geometry: {
        type: "LineString",
        coordinates
      },
      segments: routeEdgesFound.map((edge) =>
        segment(edge.road_id, edge.recommendation, edge.risk_score, edge.risk_level)
      )
    },
    blocked,
    additionalTime: Math.max(travelTime - fastestTime, 0),
    explanation: usesBypass
      ? [
          `Avoids ${roadFastId} because it is model AVOID`,
          "Uses higher-ground corridor with stronger minimum confidence",
          "Does not treat AVOID as authority CLOSED"
        ]
      : ["Direct route remains eligible in this demo scenario"]
  };
}

function routeEdges(stage: ScenarioStage): DemoEdge[] {
  const profile = stages[stage];
  const directRecommendation = profile.roadRecommendation;
  const directRisk =
    directRecommendation === "AVOID" ? Math.min(profile.riskScore + 0.12, 1) : profile.riskScore;
  const bridgeRecommendation: RoadRecommendation = stage === "SEVERE" ? "CLOSED" : "CAUTION";
  const hillRecommendation: RoadRecommendation = stage === "SEVERE" ? "AVOID" : "CAUTION";

  return [
    {
      start: "origin",
      end: "shelter",
      road_id: roadFastId,
      label: "Clock Tower shelter corridor",
      recommendation: directRecommendation,
      risk_score: Number(directRisk.toFixed(2)),
      risk_level: directRecommendation === "AVOID" ? "HIGH" : profile.riskLevel,
      confidence: profile.confidence,
      travel_time_minutes: 11,
      distance_km: 4.8,
      coordinates: [
        [78.030, 30.320],
        [78.039, 30.329],
        [78.052, 30.335]
      ]
    },
    {
      start: "origin",
      end: "ridge",
      road_id: roadBypassId,
      label: "Higher-ground bypass west",
      recommendation: stage === "NORMAL" ? "PASSABLE" : "CAUTION",
      risk_score: stage === "NORMAL" ? 0.18 : 0.34,
      risk_level: stage === "NORMAL" ? "LOW" : "WATCH",
      confidence: 0.78,
      travel_time_minutes: 9,
      distance_km: 3.1,
      coordinates: [
        [78.029, 30.319],
        [78.041, 30.326]
      ]
    },
    {
      start: "ridge",
      end: "shelter",
      road_id: roadBypassId,
      label: "Higher-ground bypass east",
      recommendation: stage === "NORMAL" ? "PASSABLE" : "CAUTION",
      risk_score: stage === "NORMAL" ? 0.2 : 0.38,
      risk_level: stage === "NORMAL" ? "LOW" : "WATCH",
      confidence: 0.71,
      travel_time_minutes: 9,
      distance_km: 3.3,
      coordinates: [
        [78.041, 30.326],
        [78.056, 30.338]
      ]
    },
    {
      start: "origin",
      end: "bridge",
      road_id: roadClosedId,
      label: "Bridge approach",
      recommendation: bridgeRecommendation,
      risk_score: stage === "SEVERE" ? 0.95 : 0.42,
      risk_level: stage === "SEVERE" ? "SEVERE" : "WATCH",
      confidence: 0.92,
      travel_time_minutes: 5,
      distance_km: 1.5,
      coordinates: [
        [78.036, 30.324],
        [78.042, 30.331]
      ]
    },
    {
      start: "bridge",
      end: "isolated",
      road_id: roadHillId,
      label: "Hillside link",
      recommendation: hillRecommendation,
      risk_score: stage === "SEVERE" ? 0.82 : 0.46,
      risk_level: stage === "SEVERE" ? "HIGH" : "WATCH",
      confidence: 0.66,
      travel_time_minutes: 8,
      distance_km: 2.1,
      coordinates: [
        [78.042, 30.331],
        [78.055, 30.342]
      ]
    }
  ];
}

function shortestPath(
  edges: DemoEdge[],
  start: string,
  target: string,
  strategy: SafeRouteRequest["strategy"]
) {
  const queue = [{ node: start, cost: 0, path: [] as DemoEdge[] }];
  const best = new Map<string, number>([[start, 0]]);

  while (queue.length > 0) {
    queue.sort((left, right) => left.cost - right.cost);
    const current = queue.shift()!;
    if (current.node === target) {
      return current.path;
    }
    for (const edge of edges.filter((item) => item.start === current.node)) {
      const cost = current.cost + edgeWeight(edge, strategy);
      if (cost >= (best.get(edge.end) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }
      best.set(edge.end, cost);
      queue.push({
        node: edge.end,
        cost,
        path: [...current.path, edge]
      });
    }
  }

  return null;
}

function edgeWeight(edge: DemoEdge, strategy: SafeRouteRequest["strategy"]) {
  if (strategy === "fastest_available") {
    return edge.travel_time_minutes + edge.risk_score * 2;
  }
  if (strategy === "balanced") {
    return edge.travel_time_minutes + edge.risk_score * 12 + (1 - edge.confidence) * 8;
  }
  return edge.travel_time_minutes + edge.risk_score * 22 + (1 - edge.confidence) * 10;
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
    reasons:
      recommendation === "CLOSED"
        ? ["authority_confirmed_closure"]
        : ["demo_risk_evidence"]
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
