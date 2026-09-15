import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { defaultEnabledLayers, useMapStore } from "./state/mapStore";

vi.mock("./components/MapView", async () => {
  const ReactModule = await import("react");
  const { useMapStore: store } = await import("./state/mapStore");
  return {
    MapView: () =>
      ReactModule.createElement(
        "div",
        { "aria-label": "Mock GIS map" },
        ReactModule.createElement(
          "button",
          {
            type: "button",
            onClick: () =>
              store
                .getState()
                .selectEntity("sensor", "SENSOR-SIM-RAIN-SOIL-01")
          },
          "Select sensor"
        ),
        ReactModule.createElement(
          "button",
          {
            type: "button",
            onClick: () =>
              store
                .getState()
                .selectEntity("sensor", "SENSOR-SIM-RAIN-SOIL-02")
          },
          "Select missing sensor"
        ),
        ReactModule.createElement(
          "button",
          {
            type: "button",
            onClick: () =>
              store
                .getState()
                .selectEntity("location", "clicked-location", [78.042, 30.331])
          },
          "Inspect coordinate"
        )
      )
  };
});

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useMapStore.setState({
      scenario: "WARNING",
      selectedEntity: {
        type: "catchment",
        id: "UK-CHM-DEHRADUN-01"
      },
      hoverCoordinates: null,
      clickedCoordinates: null,
      routeStrategy: "safest",
      demoPlaying: false,
      demoSpeed: 1,
      leftRailCollapsed: false,
      layerManagerOpen: true,
      legendOpen: true,
      basemap: "muted",
      enabledLayers: defaultEnabledLayers
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  it("renders operational risk, provenance, and rainfall-window intelligence", async () => {
    renderApp();

    expect((await screen.findAllByText("Chandrabani upper catchment")).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText("SIMULATED DEMO").length).toBeGreaterThan(0);
    expect(screen.getByText("Current Rainfall")).toBeInTheDocument();
    expect(screen.getByText("Data Provenance")).toBeInTheDocument();
    expect(screen.getAllByText("DERIVED").length).toBeGreaterThan(0);
  });

  it("opens the intelligence drawer for a selected sensor", async () => {
    renderApp();

    await screen.findAllByText("Chandrabani upper catchment");
    fireEvent.click(await screen.findByRole("button", { name: "Select sensor" }));

    expect(await screen.findByText("SENSOR-SIM-RAIN-SOIL-01")).toBeInTheDocument();
    expect(await screen.findByText("Measurements")).toBeInTheDocument();
    expect(screen.getByText("Rainfall Mm Per Hr")).toBeInTheDocument();
  }, 15000);

  it("shows missing-data states instead of zeroing unavailable sensor values", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "SEVERE" }));
    fireEvent.click(await screen.findByRole("button", { name: "Select missing sensor" }));

    expect(await screen.findByText("SENSOR-SIM-RAIN-SOIL-02")).toBeInTheDocument();
    expect((await screen.findAllByText("MISSING")).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Missing:/)).toBeInTheDocument();
  });

  it("renders a deliberate no-safe-route state", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "SEVERE" }));
    fireEvent.change(screen.getByLabelText("Route destination"), {
      target: { value: "Isolated hillside hamlet" }
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Fastest Available" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Compare routes" }));

    expect((await screen.findAllByText("NO RELIABLE ROUTE AVAILABLE")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/does not guarantee route safety/i).length).toBeGreaterThan(0);
  });

  it("supports generic coordinate inspection", async () => {
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Inspect coordinate" }));

    expect(await screen.findByText("Generic map-pixel inspection")).toBeInTheDocument();
    expect(screen.getByText("HAND")).toBeInTheDocument();
    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
  });
});
