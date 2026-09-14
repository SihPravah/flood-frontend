import { createHttpClient } from "./httpClient";
import { mockProvider } from "./mockProvider";
import type { PravahaApi } from "./types";

const mode = import.meta.env.VITE_PRAVAHA_DATA_MODE ?? "mock";
const baseUrl =
  import.meta.env.VITE_PRAVAHA_API_BASE_URL ?? "http://127.0.0.1:8000";

export const pravahaApi: PravahaApi =
  mode === "api" ? createHttpClient(baseUrl) : mockProvider;
