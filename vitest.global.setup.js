// Global setup - runs once before ALL tests and module imports
export async function setup() {
    // Mock ResizeObserver
    const ResizeObserverMock = class ResizeObserver {
        constructor(callback) {
            this.callback = callback;
        }
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    globalThis.ResizeObserver = ResizeObserverMock;

    // Mock window properties needed at module level
    if (typeof window !== 'undefined') {
        window.ResizeObserver = ResizeObserverMock;
        // Ensure window.scrollY is available
        Object.defineProperty(window, 'scrollY', {
            value: 0,
            writable: true,
            configurable: true
        });
    }
}
