# Testing Documentation for Forge MOI

This document provides comprehensive information about the testing infrastructure, methodologies, and best practices for the Forge MOI terminal component.

## Overview

The testing suite includes multiple layers of testing to ensure reliability, performance, and quality:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test communication between frontend and Rust backend
- **End-to-End Tests**: Test complete user workflows in a browser environment
- **Performance Tests**: Benchmark and monitor performance metrics
- **Quality Assurance**: Code linting, type checking, and security audits

## Testing Architecture

### Frontend Testing Stack

- **Vitest**: Fast unit test runner with TypeScript support
- **Testing Library**: Component testing utilities for React
- **Playwright**: End-to-end testing framework
- **jsdom**: DOM simulation for unit tests

### Backend Testing Stack

- **Cargo Test**: Native Rust testing framework
- **Tokio Test**: Async testing utilities
- **Mock dependencies**: Simulated external services

### Performance Monitoring

- **Custom Performance Tracker**: Real-time metrics collection
- **Memory Profiling**: Heap usage and leak detection
- **Benchmark Suites**: Automated performance regression testing

## Quick Start

### Install Dependencies

```bash
bun install
bunx playwright install
```

### Run All Tests

```bash
# Run comprehensive test suite
bun test:all

# Run specific test types
bun test              # Unit tests
bun test:e2e          # End-to-end tests
bun test:perf         # Performance tests
bun test:integration  # Integration tests
```

### Development Testing

```bash
# Watch mode for unit tests
bun test --watch

# Interactive E2E testing
bun test:e2e:ui

# Performance monitoring
bun perf:monitor
bun perf:benchmark
```

## Test Structure

### Unit Tests

Located in `**/__tests__/` directories alongside source files:

```
src/
├── utils/
│   ├── terminalCommands.ts
│   └── __tests__/
│       └── terminalCommands.test.ts
├── stores/
│   ├── terminalStore.ts
│   └── __tests__/
│       └── terminalStore.test.ts
└── components/
    └── terminal/
        ├── TerminalManager.tsx
        └── __tests__/
            └── TerminalManager.test.tsx
```

### Integration Tests

Located in `src/test/integration/`:

```
src/test/integration/
├── terminal-backend.test.ts    # Backend communication tests
├── terminal-lifecycle.test.ts  # Component lifecycle tests
└── terminal-performance.test.ts # Performance integration tests
```

### E2E Tests

Located in `e2e/` directory:

```
e2e/
├── terminal.e2e.ts           # Main terminal functionality
├── terminal-commands.e2e.ts  # Custom command testing
├── terminal-performance.e2e.ts # Performance E2E tests
└── results/                  # Test artifacts
```

### Performance Tests

Located in `performance/` directory:

```
performance/
├── terminal-performance.test.ts  # Performance benchmarks
├── memory-usage.test.ts         # Memory leak detection
├── load-testing.test.ts         # Stress testing
└── results/                     # Performance reports
```

## Testing Guidelines

### Unit Test Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Use vi.mock() for external modules
3. **Descriptive Test Names**: Use clear, specific test descriptions
4. **Arrange-Act-Assert**: Structure tests with clear phases
5. **Edge Cases**: Test boundary conditions and error states

Example:
```typescript
describe('parseCommand', () => {
  it('should parse commands with arguments and flags', () => {
    // Arrange
    const input = 'open --file test.txt --line 42';
    
    // Act
    const result = parseCommand(input);
    
    // Assert
    expect(result).toEqual({
      command: 'open',
      args: [],
      flags: { file: 'test.txt', line: 42 }
    });
  });
});
```

### Integration Test Best Practices

1. **Real Backend Communication**: Test actual Tauri API calls
2. **Event Handling**: Verify event listeners and cleanup
3. **Error Scenarios**: Test network failures and timeouts
4. **Concurrent Operations**: Test race conditions and parallelism

### E2E Test Best Practices

1. **User-Centric**: Test actual user workflows
2. **Wait Strategies**: Use proper waiting for async operations
3. **Test Data**: Use consistent, isolated test data
4. **Visual Verification**: Verify UI states and feedback
5. **Cross-Browser**: Test on multiple browsers

### Performance Test Best Practices

1. **Baseline Measurements**: Establish performance baselines
2. **Threshold Monitoring**: Set and enforce performance thresholds
3. **Memory Tracking**: Monitor for memory leaks
4. **Load Testing**: Test under various load conditions
5. **Regression Detection**: Compare against historical performance

## Configuration Files

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

## Custom Test Utilities

### Performance Tracker

```typescript
import { TerminalPerformanceTracker } from '@/utils/terminalCommands';

const tracker = new TerminalPerformanceTracker();
const endTiming = tracker.startTiming('operation-name');
// ... perform operation
endTiming();

const metrics = tracker.getMetrics('operation-name');
```

### Mock Helpers

```typescript
import { createMockTerminalContext } from '@/test/helpers';

const mockContext = createMockTerminalContext({
  currentDirectory: '/test/path'
});
```

### Custom Matchers

```typescript
// Available custom matchers
expect(output).toHaveTerminalOutput('Hello World');
expect(session).toBeValidTerminalSession();
```

## Continuous Integration

### GitHub Actions Workflow

The CI pipeline runs multiple test suites in parallel:

1. **Unit Tests**: Fast feedback on code changes
2. **Performance Tests**: Regression detection
3. **E2E Tests**: Cross-browser compatibility
4. **Rust Tests**: Backend functionality
5. **Integration Tests**: Cross-platform testing
6. **Quality Checks**: Linting and type checking

### Test Artifacts

- **Coverage Reports**: Code coverage metrics
- **Performance Reports**: Benchmark results
- **E2E Screenshots/Videos**: Visual test evidence
- **Test Results**: JUnit XML for CI integration

## Performance Monitoring

### Real-Time Monitoring

```bash
# Monitor terminal performance for 2 minutes
bun perf:monitor --monitor 120

# Run comprehensive benchmarks
bun perf:benchmark

# Custom monitoring with output
bun perf:monitor --monitor 60 --output custom-report.json
```

### Performance Thresholds

| Operation | Threshold | Description |
|-----------|-----------|-------------|
| Terminal Creation | 100ms | Time to create new terminal instance |
| Command Parsing | 10ms | Time to parse command string |
| Command Execution | 50ms | Time to execute custom commands |
| Memory Growth | 50MB | Maximum memory growth during operation |

### Performance Alerts

The system automatically generates alerts when:
- Operations exceed performance thresholds
- Memory usage grows beyond limits
- Performance degrades over time
- Resource leaks are detected

## Debugging Tests

### Debugging Unit Tests

```bash
# Run tests in debug mode
bun test --inspect-brk

# Run specific test file
bun test terminalCommands.test.ts

# Run with verbose output
bun test --verbose
```

### Debugging E2E Tests

```bash
# Run in headed mode
bun test:e2e:headed

# Run with UI for debugging
bun test:e2e:ui

# Debug specific test
bunx playwright test --debug terminal.e2e.ts
```

### Common Issues

1. **Timeout Errors**: Increase timeout values for slow operations
2. **Mock Failures**: Ensure mocks are properly reset between tests
3. **Race Conditions**: Use proper waiting strategies
4. **Memory Leaks**: Check for event listener cleanup
5. **Async Issues**: Properly handle async operations

## Test Data Management

### Test Fixtures

Store reusable test data in `src/test/fixtures/`:

```typescript
export const mockTerminalSession = {
  id: 'test-session-123',
  title: 'Test Terminal',
  created_at: new Date('2023-01-01'),
  // ... other properties
};
```

### Test Environment

Use environment variables for test configuration:

```bash
# Test environment variables
TEST_TIMEOUT=30000
HEADLESS=true
SLOW_MO=100
```

## Reporting and Metrics

### Test Reports

Generated reports include:
- **HTML Reports**: Visual test results with screenshots
- **JSON Reports**: Structured data for analysis
- **JUnit XML**: CI integration format
- **Coverage Reports**: Code coverage metrics

### Performance Metrics

Tracked metrics include:
- **Operation Duration**: Time taken for operations
- **Memory Usage**: Heap usage and growth
- **Throughput**: Operations per second
- **Error Rates**: Failure percentages
- **Resource Utilization**: CPU and memory usage

## Contributing

### Adding New Tests

1. Follow the established directory structure
2. Use descriptive test names and organize in logical groups
3. Include both positive and negative test cases
4. Add performance considerations for new features
5. Update documentation for new testing patterns

### Test Review Guidelines

1. **Coverage**: Ensure adequate test coverage for new code
2. **Performance**: Include performance tests for critical paths
3. **Edge Cases**: Test boundary conditions and error states
4. **Documentation**: Update test documentation as needed
5. **CI Integration**: Ensure tests run properly in CI environment

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)

---

For questions or issues with the testing setup, please refer to the team documentation or create an issue in the project repository.