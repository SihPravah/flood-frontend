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
npm install
npm run dev
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```

## Data Mode

Set `VITE_PRAVAHA_DATA_MODE=mock` for deterministic local demo data or
`VITE_PRAVAHA_DATA_MODE=api` with `VITE_PRAVAHA_API_BASE_URL` to use the
backend.

Mock data is isolated in `src/api/mockProvider.ts` and is visibly tagged as
`SIMULATED / DEMO`.

## Product Surface

- map-first operational view
- catchment, ward, rainfall, sensor, stream, drain, road, landslide, closure,
  shelter and route layers
- click-anything intelligence drawer
- route comparison with explicit `NO_SAFE_ROUTE`
- anticipation timeline for NOW, +30 min and +60 min
- confidence, provenance, freshness and reasons exposed alongside risk
