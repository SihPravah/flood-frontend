import { describe, expect, it } from "vitest";

import { mockProvider } from "./mockProvider";

describe("mockProvider", () => {
  it("is deterministic for the same scenario", async () => {
    const first = await mockProvider.getMapIntelligence("WARNING");
    const second = await mockProvider.getMapIntelligence("WARNING");

    expect(first).toEqual(second);
    expect(first.data_label).toBe("SIMULATED");
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
});
