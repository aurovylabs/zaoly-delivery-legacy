import '@testing-library/jest-dom/vitest'

/** jsdom lacks ResizeObserver; NavRail SnapDock needs it in App shell tests. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub
