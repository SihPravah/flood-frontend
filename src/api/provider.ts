import { createHttpClient } from "./httpClient";
import { mockProvider } from "./mockProvider";
import type { PravahaApi } from "./types";

const queryMode =
  typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("mode");
const mode = queryMode ?? import.meta.env.VITE_PRAVAHA_DATA_MODE ?? "mock";
const baseUrl =
  import.meta.env.VITE_PRAVAHA_API_BASE_URL ?? "http://127.0.0.1:8000";
const refreshMs = Number(import.meta.env.VITE_PRAVAHA_REFRESH_INTERVAL_MS ?? 15000);
const includeScenarioStage =
  String(import.meta.env.VITE_PRAVAHA_API_INCLUDE_SCENARIO_STAGE ?? "false")
    .toLowerCase() === "true";

export const pravahaDataMode = mode === "api" ? "api" : "mock";
export const pravahaRefreshIntervalMs = Number.isFinite(refreshMs)
  ? refreshMs
  : 15000;
export const pravahaApi: PravahaApi =
  pravahaDataMode === "api"
    ? createHttpClient(baseUrl, { includeScenarioStage })
    : mockProvider;
