import type {
  Alert,
  CatchmentDetail,
  DrainDetail,
  IntelligenceDetail,
  LocationInspection,
  MapIntelligenceResponse,
  PravahaApi,
  RoadDetail,
  SafeRouteResponse,
  SensorDetail,
  SourceHealthDetail,
  StructuredEvent
} from "./types";

interface HttpClientOptions {
  includeScenarioStage?: boolean;
}

export function createHttpClient(
  baseUrl: string,
  options: HttpClientOptions = {}
): PravahaApi {
  const includeScenarioStage = options.includeScenarioStage ?? false;

  return {
    getMapIntelligence: (stage) =>
      request<MapIntelligenceResponse>(
        `${baseUrl}/api/v1/map/intelligence${stageParam(stage, includeScenarioStage)}`
      ),
    getCatchmentDetail: (id, stage) =>
      request<CatchmentDetail>(
        `${baseUrl}/api/v1/map/catchments/${id}${stageParam(stage, includeScenarioStage)}`
      ),
    getDrainDetail: (id, stage) =>
      request<DrainDetail>(
        `${baseUrl}/api/v1/map/drains/${id}${stageParam(stage, includeScenarioStage)}`
      ),
    getRoadDetail: (id, stage) =>
      request<RoadDetail>(
        `${baseUrl}/api/v1/map/roads/${id}${stageParam(stage, includeScenarioStage)}`
      ),
    getSensorDetail: (id, stage) =>
      request<SensorDetail>(
        `${baseUrl}/api/v1/map/sensors/${id}${stageParam(stage, includeScenarioStage)}`
      ),
    getEntityDetail: async (selection, stage) => {
      if (selection.type === "catchment") {
        return request<CatchmentDetail>(
          `${baseUrl}/api/v1/map/catchments/${selection.id}${stageParam(stage, includeScenarioStage)}`
        );
      }
      if (selection.type === "drain") {
        return request<DrainDetail>(
          `${baseUrl}/api/v1/map/drains/${selection.id}${stageParam(stage, includeScenarioStage)}`
        );
      }
      if (selection.type === "road") {
        return request<RoadDetail>(
          `${baseUrl}/api/v1/map/roads/${selection.id}${stageParam(stage, includeScenarioStage)}`
        );
      }
      if (selection.type === "sensor") {
        return request<SensorDetail>(
          `${baseUrl}/api/v1/map/sensors/${selection.id}${stageParam(stage, includeScenarioStage)}`
        );
      }
      if (selection.type === "location") {
        return request<LocationInspection>(
          locationInspectUrl(baseUrl, selection.coordinates, stage, includeScenarioStage)
        );
      }
      if (selection.type === "source_health") {
        const snapshot = await request<MapIntelligenceResponse>(
          `${baseUrl}/api/v1/map/intelligence${stageParam(stage, includeScenarioStage)}`
        );
        return {
          type: "source_health",
          id: selection.id,
          snapshot_id: snapshot.snapshot_id,
          generated_at: snapshot.generated_at,
          mode: snapshot.mode,
          sources: snapshot.source_health,
          events: snapshot.events,
          model_metadata: snapshot.model_metadata
        } satisfies SourceHealthDetail;
      }
      return Promise.reject(
        new Error(
          `Backend detail endpoint is not available yet for ${selection.type}`
        )
      ) as Promise<IntelligenceDetail>;
    },
    getAlerts: (stage) =>
      request<Alert[]>(
        `${baseUrl}/api/v1/map/alerts${stageParam(stage, includeScenarioStage)}`
      ),
    getEvents: (stage) =>
      request<StructuredEvent[]>(
        `${baseUrl}/api/v1/events${stageParam(stage, includeScenarioStage)}`
      ),
    planSafeRoute: (payload, stage) =>
      request<SafeRouteResponse>(
        `${baseUrl}/api/v1/routes/safe${stageParam(stage, includeScenarioStage)}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        }
      )
  } satisfies PravahaApi;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function stageParam(
  stage: string | undefined,
  includeScenarioStage: boolean
) {
  if (!includeScenarioStage || !stage) {
    return "";
  }
  return `?scenario_stage=${encodeURIComponent(stage)}`;
}

function locationInspectUrl(
  baseUrl: string,
  coordinates: [number, number] | undefined,
  stage: string | undefined,
  includeScenarioStage: boolean
) {
  if (!coordinates) {
    throw new Error("A coordinate is required for map location inspection.");
  }

  const [longitude, latitude] = coordinates;
  const search = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude)
  });
  if (includeScenarioStage && stage) {
    search.set("scenario_stage", stage);
  }

  return `${baseUrl}/api/v1/map/inspect?${search.toString()}`;
}
