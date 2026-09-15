import { describe, expect, it } from "vitest";

import { mockProvider } from "./mockProvider";

describe("mockProvider", () => {
  it("is deterministic for the same scenario", async () => {
    const first = await mockProvider.getMapIntelligence("WARNING");
    const second = await mockProvider.getMapIntelligence("WARNING");

    expect(first).toEqual(second);
    expect(first.data_label).toBe("SIMULATED");
    expect(first.scenario_id).toBe("DEMO-001");
    expect(first.source_health.some((source) => source.provenance === "SIMULATED")).toBe(
      true
    );
    expect(first.model_metadata.operationally_validated).toBe(false);
  });

  it("shows deterioration across the demo scenario", async () => {
    const normal = await mockProvider.getCatchmentDetail(
      "UK-CHM-DEHRADUN-01",
      "NORMAL"
    );
    const severe = await mockProvider.getCatchmentDetail(
      "UK-CHM-DEHRADUN-01",
      "SEVERE"
    );

    expect(severe.risk_score).toBeGreaterThan(normal.risk_score);
    expect(severe.soil.saturation).toBeGreaterThan(normal.soil.saturation);
    expect(severe.rainfall.rain_1h).toBeGreaterThan(
      normal.rainfall.rain_1h
    );
    expect(severe.anticipation.timeline.at(-1)?.city_status).toBe("EMERGENCY");
  });

  it("returns explicit NO_SAFE_ROUTE for blocked demo routing", async () => {
    const result = await mockProvider.planSafeRoute(
      {
        origin: { lon: 78.03, lat: 30.32 },
        destination: {
          lon: 78.055,
          lat: 30.342,
          place_id: "DEMO-NO-SAFE-ROUTE"
        },
        strategy: "fastest_available"
      },
      "SEVERE"
    );

    expect(result.status).toBe("NO_SAFE_ROUTE");
    if (result.status === "NO_SAFE_ROUTE") {
      expect(result.blocked_by.map((segment) => segment.recommendation)).toContain(
        "AVOID"
      );
      expect(result.blocked_by.map((segment) => segment.recommendation)).toContain(
        "CLOSED"
      );
    }
  });

  it("supports richer click-anything entity details", async () => {
    const ward = await mockProvider.getEntityDetail(
      { type: "ward", id: "WARD-DEHRADUN-07" },
      "WARNING"
    );
    const landslide = await mockProvider.getEntityDetail(
      { type: "landslide", id: "LANDSLIDE-ZONE-S-01" },
      "SEVERE"
    );
    const location = await mockProvider.getEntityDetail(
      { type: "location", id: "clicked-location", coordinates: [78.042, 30.331] },
      "WARNING"
    );

    expect(ward.type).toBe("ward");
    expect(landslide.type).toBe("landslide");
    expect(location.type).toBe("location");
    expect(location.terrain.some((metric) => metric.value === "Not available")).toBe(
      true
    );
  });

  it("keeps missing sensor values explicit", async () => {
    const sensor = await mockProvider.getEntityDetail(
      { type: "sensor", id: "SENSOR-SIM-RAIN-SOIL-02" },
      "SEVERE"
    );

    expect(sensor.type).toBe("sensor");
    if (sensor.type === "sensor") {
      expect(sensor.status).toBe("MISSING");
      expect(sensor.measurements.rainfall_mm_per_hr).toBeNull();
      expect(sensor.missing_fields).toContain("soil_moisture_percentage");
    }
  });

  it("returns source health and structured events behind the same API", async () => {
    const detail = await mockProvider.getEntityDetail(
      { type: "source_health", id: "source-health" },
      "SEVERE"
    );
    const events = await mockProvider.getEvents("WARNING");

    expect(detail.type).toBe("source_health");
    if (detail.type === "source_health") {
      expect(detail.sources.some((source) => source.status === "UNAVAILABLE")).toBe(true);
      expect(detail.model_metadata.runtime_status).toBe("DEVELOPMENT_FALLBACK");
    }
    expect(events.some((event) => event.event_type === "road_status_change")).toBe(true);
  });
});
