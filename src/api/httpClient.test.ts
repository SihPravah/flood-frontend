import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpClient } from "./httpClient";

describe("createHttpClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits scenario_stage by default so API mode receives the latest monitoring snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient("http://backend");

    await client.getMapIntelligence("WARNING");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend/api/v1/map/intelligence",
      undefined
    );
  });

  it("can include scenario_stage for explicit backend demo review", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient("http://backend", {
      includeScenarioStage: true
    });

    await client.getRoadDetail("ROAD-SHELTER-CORRIDOR", "SEVERE");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend/api/v1/map/roads/ROAD-SHELTER-CORRIDOR?scenario_stage=SEVERE",
      undefined
    );
  });

  it("requests backend GIS inspection for clicked map coordinates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpClient("http://backend", {
      includeScenarioStage: true
    });

    await client.getEntityDetail(
      {
        type: "location",
        id: "clicked-coordinate",
        coordinates: [77.978689, 30.285029]
      },
      "WARNING"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend/api/v1/map/inspect?longitude=77.978689&latitude=30.285029&scenario_stage=WARNING",
      undefined
    );
  });
});

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
