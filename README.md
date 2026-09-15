# PRAVAHA Frontend

Premium map-first PRAVAHA interface for SIH demo and development.

## Stack

- React + TypeScript + Vite
- MapLibre GL JS
- React Router
- TanStack Query
- Zustand for map/UI state
- Recharts for compact anticipation charts

## Local Setup

```powershell
pnpm install
pnpm run dev
pnpm run lint
pnpm run typecheck
pnpm run test -- --run
pnpm run build
```

## Data Mode

Set `VITE_PRAVAHA_DATA_MODE=mock` for deterministic local demo data or
`VITE_PRAVAHA_DATA_MODE=api` with `VITE_PRAVAHA_API_BASE_URL` to use the
backend.

Mock data is isolated in `src/api/mockProvider.ts` and is visibly tagged as
`SIMULATED / DEMO`.

The browser query string can also switch transport mode for local review:
`/?mode=mock` or `/?mode=api`. API mode polls using
`VITE_PRAVAHA_REFRESH_INTERVAL_MS` when set.

In API mode the HTTP client omits `scenario_stage` by default so
`GET /api/v1/map/intelligence` receives Backend's latest monitoring snapshot,
including snapshots created by `POST /api/v1/ingest/sensors`. Set
`VITE_PRAVAHA_API_INCLUDE_SCENARIO_STAGE=true` only for explicit backend
scenario review.

The HTTP adapter in `src/api/httpClient.ts` targets the planned PRAVAHA API:

- `GET /api/v1/map/intelligence`
- `GET /api/v1/map/catchments/:id`
- `GET /api/v1/map/drains/:id`
- `GET /api/v1/map/roads/:id`
- `GET /api/v1/map/sensors/:id`
- `GET /api/v1/map/alerts`
- `GET /api/v1/events`
- `POST /api/v1/routes/safe`

Mock-mode calls pass `scenario_stage=NORMAL|WATCH|WARNING|SEVERE` during the
deterministic `DEMO-001` flow. The shared demo IDs include
`UK-CHM-DEHRADUN-01`, `D-22`, `ROAD-SHELTER-CORRIDOR`,
`ROAD-BRIDGE-APPROACH`, `SENSOR-SIM-RAIN-SOIL-01`, and
`SHELTER-SCHOOL-01`.

## Product Surface

- map-first operational view
- catchment, ward, rainfall, sensor, stream, drain, road, landslide, closure,
  shelter and route layers
- click-anything intelligence drawer
- source-health drawer and structured event feed
- route comparison with explicit `NO_SAFE_ROUTE`
- deterministic NORMAL, WATCH, WARNING and SEVERE demo progression
- anticipation timeline for NOW, +15 min, +30 min and +60 min
- confidence, provenance, freshness and reasons exposed alongside risk
- coordinate inspection that distinguishes unavailable data from zero values
