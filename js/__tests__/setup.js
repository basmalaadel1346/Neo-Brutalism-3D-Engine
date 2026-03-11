// Mock ResizeObserver
const ResizeObserverMock = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() { }

  unobserve() { }

  disconnect() { }
};

// Set globally before any modules use it
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock;
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverMock;
}

// Ensure window.scrollY is accessible (should be set by jsdom by default)
if (typeof window !== 'undefined' && typeof window.scrollY === 'undefined') {
  Object.defineProperty(window, 'scrollY', {
    value: 0,
    writable: true,
    configurable: true
  });
}