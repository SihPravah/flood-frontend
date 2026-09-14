import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {
    void _callback;
  }

  observe(_target: Element, _options?: ResizeObserverOptions) {
    void _target;
    void _options;
  }

  unobserve(_target: Element) {
    void _target;
  }

  disconnect() {
    return undefined;
  }
}

globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverMock as typeof ResizeObserver);
