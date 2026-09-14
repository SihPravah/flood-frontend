import { describe, expect, it } from "vitest";

import { mockProvider } from "./mockProvider";

describe("mockProvider", () => {
  it("is deterministic for the same scenario", async () => {
    const first = await mockProvider.getMapIntelligence("WARNING");
    const second = await mockProvider.getMapIntelligence("WARNING");

    expect(first).toEqual(second);
    expect(first.data_label).toBe("SIMULATED");
    expect(first.summary.source_health.some((source) => source.provenance === "SIMULATED")).toBe(
      true
    );
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
        destination: { lon: 78.056, lat: 30.338 },
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
      { type: "ward", id: "WARD-07" },
      "WARNING"
    );
    const landslide = await mockProvider.getEntityDetail(
      { type: "landslide", id: "SLOPE-01" },
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
      { type: "sensor", id: "SIM_NODE_08" },
      "SEVERE"
    );

    expect(sensor.type).toBe("sensor");
    if (sensor.type === "sensor") {
      expect(sensor.status).toBe("MISSING");
      expect(sensor.measurements.rainfall_mm_per_hr).toBeNull();
      expect(sensor.missing_fields).toContain("soil_moisture_percentage");
    }
  });
});
