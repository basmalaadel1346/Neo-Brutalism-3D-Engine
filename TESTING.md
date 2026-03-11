# Unit Testing Guide

## Overview
This project uses **Jest** as the testing framework for unit testing all JavaScript modules. Tests are configured with ES modules support and jsdom environment for DOM testing.

## Setup

### Installation
Tests are configured in `package.json`. To run tests:

```bash
npm install
npm test
```

### Configuration Files
- **jest.config.js** - Main Jest configuration with jsdom environment
- **.babelrc** - Babel configuration to support ES6+ syntax in tests
- **jest.setup.js** - Global setup with mocks for browser APIs

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Files

Tests are located in `js/__tests__/` directory:

### CardRenderer.test.js
Tests for the `RenderNode` class that handles 3D card rendering and physics:
- ✓ Initialization with correct properties
- ✓ Rectangle updating on element resize
- ✓ Mouse enter/leave event handling
- ✓ Local mouse position calculation
- ✓ Spring physics application
- ✓ CSS variable application
- ✓ Dirty flag management

**Key Methods Tested:**
- `constructor()` - Initialization
- `updateRect()` - Bounding rectangle updates
- `update()` - Physics simulation
- `initEvents()` - Event listener setup

### InputManager.test.js
Tests for global input state management and event listeners:
- ✓ GlobalState initialization
- ✓ Weights default values
- ✓ Mouse movement tracking
- ✓ Mouse coordinate normalization (-1 to 1 range)
- ✓ Input slider listeners
- ✓ Scroll event tracking
- ✓ Weight updates from range inputs

**Key Components Tested:**
- `GlobalState` - Global input and state object
- `Weights` - Physics weight parameters
- `initInputListeners()` - Event initialization
- `toggleGyro()` - Gyroscope toggle functionality

### Physics.test.js
Tests for proximity-based physics interactions:
- ✓ Null hovered node handling
- ✓ Proximity-based influence calculation
- ✓ Distance-based physics application
- ✓ Boundary distance handling
- ✓ Self-collision avoidance
- ✓ Empty array handling

**Key Functions Tested:**
- `applyProximityPhysics()` - Proximity-based affect

## Browser API Mocks

The test environment includes mocks for critical browser APIs:

```javascript
// ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// requestAnimationFrame mock
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));

// performance.now() mock
global.performance = {
    now: jest.fn(() => Date.now()),
};
```

## Coverage Goals

Target coverage for production code:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

View coverage report after running tests:
```bash
npm run test:coverage
```

## Writing New Tests

### Test Structure
```javascript
describe('Module Name', () => {
    beforeEach(() => {
        // Setup before each test
    });

    afterEach(() => {
        // Cleanup after each test
    });

    test('should do something specific', () => {
        // Arrange
        const input = createTestData();
        
        // Act
        const result = functionUnderTest(input);
        
        // Assert
        expect(result).toBe(expectedValue);
    });
});
```

### Best Practices
1. **One assertion per test** - Keep tests focused
2. **Descriptive test names** - Use "should X when Y" format
3. **Setup/Teardown** - Use beforeEach/afterEach for common setup
4. **Mocks for external dependencies** - Mock DOM, timers, etc.
5. **Use test data** - Create realistic test fixtures
6. **Test edge cases** - Test boundary conditions and error states

## Continuous Integration

Tests should pass before deploying to production. Integrate with CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test -- --coverage
```

## Troubleshooting

### ReferenceError: ResizeObserver is not defined
- Ensure jest.setup.js is configured in jest.config.js

### Tests timing out
- Check for infinite loops or unresolved promises
- Increase timeout: `jest.setTimeout(10000)`

### DOM not available
- Verify jest.config.js has `testEnvironment: 'jsdom'`

## Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Jest Matchers](https://jestjs.io/docs/using-matchers)
