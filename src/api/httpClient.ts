import type {
  Alert,
  CatchmentDetail,
  DrainDetail,
  MapIntelligenceResponse,
  PravahaApi,
  RoadDetail,
  SafeRouteResponse,
  SensorDetail
} from "./types";

export function createHttpClient(baseUrl: string): PravahaApi {
  return {
    getMapIntelligence: () =>
      request<MapIntelligenceResponse>(
        `${baseUrl}/api/v1/map/intelligence`
      ),
    getCatchmentDetail: (id) =>
      request<CatchmentDetail>(`${baseUrl}/api/v1/map/catchments/${id}`),
    getDrainDetail: (id) =>
      request<DrainDetail>(`${baseUrl}/api/v1/map/drains/${id}`),
    getRoadDetail: (id) =>
      request<RoadDetail>(`${baseUrl}/api/v1/map/roads/${id}`),
    getSensorDetail: (id) =>
      request<SensorDetail>(`${baseUrl}/api/v1/map/sensors/${id}`),
    getAlerts: () => request<Alert[]>(`${baseUrl}/api/v1/map/alerts`),
    planSafeRoute: (payload) =>
      request<SafeRouteResponse>(`${baseUrl}/api/v1/routes/safe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
  } satisfies PravahaApi;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
