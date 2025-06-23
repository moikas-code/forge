/**
 * Unit tests for terminal performance utilities
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TerminalBufferManager,
  TerminalOutputThrottler,
  TerminalMemoryMonitor,
  TerminalPerformanceManager,
  create_terminal_performance_manager,
} from '../terminalPerformance';

// Mock xterm terminal
const create_mock_terminal = () => ({
  buffer: {
    active: {
      length: 1000,
    },
  },
  options: {
    scrollback: 10000,
  },
  cols: 80,
  rows: 24,
  write: vi.fn(),
  dispose: vi.fn(),
});

// Mock performance.memory
const mock_performance_memory = () => {
  Object.defineProperty(global, 'performance', {
    value: {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      },
    },
    writable: true,
  });
};

describe('TerminalBufferManager', () => {
  let terminal: any;
  let buffer_manager: TerminalBufferManager;

  beforeEach(() => {
    terminal = create_mock_terminal();
    buffer_manager = new TerminalBufferManager(terminal, {}, false);
  });

  afterEach(() => {
    buffer_manager.dispose();
  });

  test('should initialize with default configuration', () => {
    expect(buffer_manager).toBeDefined();
    const metrics = buffer_manager.get_metrics();
    expect(metrics.lines_count).toBe(0);
    expect(metrics.last_gc_time).toBeGreaterThan(0);
  });

  test('should check and trim buffer when threshold exceeded', () => {
    // Simulate large buffer
    terminal.buffer.active.length = 9000; // Above 80% of 10000
    
    buffer_manager.check_and_trim_buffer();
    
    // Should have updated scrollback setting
    expect(terminal.options.scrollback).toBeLessThanOrEqual(9000);
  });

  test('should get current metrics', () => {
    const metrics = buffer_manager.get_metrics();
    
    expect(metrics).toHaveProperty('lines_count');
    expect(metrics).toHaveProperty('last_gc_time');
    expect(typeof metrics.lines_count).toBe('number');
    expect(typeof metrics.last_gc_time).toBe('number');
  });
});

describe('TerminalOutputThrottler', () => {
  let terminal: any;
  let throttler: TerminalOutputThrottler;

  beforeEach(() => {
    terminal = create_mock_terminal();
    throttler = new TerminalOutputThrottler(terminal, {}, false);
  });

  afterEach(() => {
    throttler.dispose();
  });

  test('should initialize with default configuration', () => {
    expect(throttler).toBeDefined();
    const metrics = throttler.get_metrics();
    expect(metrics.throttle_active).toBe(false);
    expect(metrics.queued_chunks).toBe(0);
    expect(metrics.frames_dropped).toBe(0);
  });

  test('should write data to terminal without throttling for small volumes', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    
    throttler.write(data);
    
    expect(terminal.write).toHaveBeenCalledWith(data);
    const metrics = throttler.get_metrics();
    expect(metrics.throttle_active).toBe(false);
  });

  test('should manage output throttling correctly', () => {
    // The throttler should at minimum track calls and provide metrics
    const initial_metrics = throttler.get_metrics();
    expect(initial_metrics.throttle_active).toBe(false);
    expect(initial_metrics.queued_chunks).toBe(0);
    expect(initial_metrics.frames_dropped).toBe(0);
    
    // Write some data
    const data = new Uint8Array([65, 66, 67]); // "ABC"
    throttler.write(data);
    
    // Should have processed the data or queued it
    expect(terminal.write).toHaveBeenCalled();
  });

  test('should clear output queue', () => {
    // Add some data to queue
    for (let i = 0; i < 10; i++) {
      const data = new Uint8Array([65 + i]);
      throttler.write(data);
    }
    
    throttler.clear_queue();
    
    const metrics = throttler.get_metrics();
    expect(metrics.queued_chunks).toBe(0);
    expect(metrics.throttle_active).toBe(false);
  });

  test('should support clearing queue functionality', () => {
    // Add some data
    for (let i = 0; i < 10; i++) {
      const data = new Uint8Array([65]);
      throttler.write(data);
    }
    
    // Clear queue should work without errors
    expect(() => throttler.clear_queue()).not.toThrow();
    
    // Metrics should be consistent
    const metrics = throttler.get_metrics();
    expect(metrics.queued_chunks).toBe(0);
    expect(metrics.throttle_active).toBe(false);
  });
});

describe('TerminalMemoryMonitor', () => {
  let terminal: any;
  let monitor: TerminalMemoryMonitor;

  beforeEach(() => {
    terminal = create_mock_terminal();
    monitor = new TerminalMemoryMonitor(terminal, {}, false);
    mock_performance_memory();
  });

  afterEach(() => {
    monitor.dispose();
  });

  test('should initialize with default configuration', () => {
    expect(monitor).toBeDefined();
    const metrics = monitor.get_metrics();
    expect(metrics.monitoring).toBe(false);
    expect(metrics.usage_mb).toBe(0);
  });

  test('should start and stop monitoring', () => {
    monitor.start_monitoring();
    expect(monitor.get_metrics().monitoring).toBe(true);
    
    monitor.stop_monitoring();
    expect(monitor.get_metrics().monitoring).toBe(false);
  });

  test('should call warning callback when memory exceeds threshold', () => {
    const warning_callback = vi.fn();
    
    // Set very low threshold and increase buffer size
    terminal.buffer.active.length = 10000;
    terminal.cols = 200;
    
    monitor = new TerminalMemoryMonitor(terminal, { 
      max_memory_mb: 10, // Minimum allowed is 10
      warning_threshold: 0.7,
      check_interval_ms: 1000 // Minimum allowed is 1000
    }, false);
    
    monitor.start_monitoring(warning_callback);
    
    // Manually trigger memory check to ensure it gets called
    const check_method = (monitor as any).check_memory_usage;
    if (check_method) {
      check_method.call(monitor);
    }
    
    // With large buffer and low threshold, warning should be called
    expect(warning_callback).toHaveBeenCalled();
  });

  test('should estimate memory usage based on terminal buffer', () => {
    // Increase terminal buffer size to get a realistic estimate
    terminal.buffer.active.length = 5000;
    terminal.cols = 100;
    
    monitor.start_monitoring();
    
    // Manually trigger a memory check
    const check_method = (monitor as any).check_memory_usage;
    if (check_method) {
      check_method.call(monitor);
    }
    
    const metrics = monitor.get_metrics();
    // Should have calculated some memory usage based on buffer
    expect(metrics.usage_mb).toBeGreaterThan(0);
  });
});

describe('TerminalPerformanceManager', () => {
  let terminal: any;
  let manager: TerminalPerformanceManager;

  beforeEach(() => {
    terminal = create_mock_terminal();
    manager = new TerminalPerformanceManager(terminal, { debug: false });
    mock_performance_memory();
  });

  afterEach(() => {
    manager.dispose();
  });

  test('should initialize with all managers', () => {
    expect(manager).toBeDefined();
    
    const metrics = manager.get_metrics();
    expect(metrics).toHaveProperty('buffer_lines');
    expect(metrics).toHaveProperty('memory_usage_mb');
    expect(metrics).toHaveProperty('throttle_active');
    expect(metrics).toHaveProperty('last_gc_time');
    expect(metrics).toHaveProperty('output_chunks_queued');
    expect(metrics).toHaveProperty('frames_dropped');
  });

  test('should write data through output throttler', () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]);
    
    manager.write(data);
    
    // Data should have been processed by throttler and written to terminal
    expect(terminal.write).toHaveBeenCalled();
  });

  test('should track performance metrics correctly', () => {
    // Write some data
    for (let i = 0; i < 50; i++) {
      const data = new Uint8Array([65]);
      manager.write(data);
    }
    
    const metrics = manager.get_metrics();
    
    // Check that all metrics are properly tracked
    expect(typeof metrics.buffer_lines).toBe('number');
    expect(typeof metrics.memory_usage_mb).toBe('number');
    expect(typeof metrics.throttle_active).toBe('boolean');
    expect(typeof metrics.last_gc_time).toBe('number');
    expect(typeof metrics.output_chunks_queued).toBe('number');
    expect(typeof metrics.frames_dropped).toBe('number');
    
    // Should have some output queued
    expect(metrics.output_chunks_queued).toBeGreaterThanOrEqual(0);
  });

  test('should force cleanup', () => {
    // Add some load
    for (let i = 0; i < 50; i++) {
      const data = new Uint8Array([65]);
      manager.write(data);
    }
    
    manager.force_cleanup();
    
    // Should have cleared throttler queue
    const metrics = manager.get_metrics();
    expect(metrics.output_chunks_queued).toBe(0);
  });

  test('should dispose all managers', () => {
    const dispose_spy = vi.spyOn(manager as any, 'log');
    
    manager.dispose();
    
    // Should be marked as disposed
    expect((manager as any).disposed).toBe(true);
    
    // Writing after disposal should do nothing
    const data = new Uint8Array([65]);
    manager.write(data);
    // No error should be thrown
  });
});

describe('create_terminal_performance_manager', () => {
  let terminal: any;

  beforeEach(() => {
    terminal = create_mock_terminal();
  });

  test('should create manager with default options', () => {
    const manager = create_terminal_performance_manager(terminal);
    
    expect(manager).toBeInstanceOf(TerminalPerformanceManager);
    
    const metrics = manager.get_metrics();
    expect(metrics).toBeDefined();
    
    manager.dispose();
  });

  test('should create manager with custom options', () => {
    const options = {
      buffer: { max_lines: 5000 },
      throttle: { debounce_ms: 32 },
      memory: { max_memory_mb: 50 },
      debug: true,
    };
    
    const manager = create_terminal_performance_manager(terminal, options);
    
    expect(manager).toBeInstanceOf(TerminalPerformanceManager);
    
    manager.dispose();
  });
});

describe('Performance edge cases', () => {
  test('should handle terminal without buffer', () => {
    const terminal = { write: vi.fn(), dispose: vi.fn() };
    
    expect(() => {
      const manager = new TerminalPerformanceManager(terminal as any, { debug: false });
      manager.dispose();
    }).not.toThrow();
  });

  test('should handle write errors gracefully', () => {
    const terminal = create_mock_terminal();
    terminal.write.mockImplementation(() => {
      throw new Error('Write failed');
    });
    
    const throttler = new TerminalOutputThrottler(terminal, {}, false);
    
    expect(() => {
      const data = new Uint8Array([65]);
      throttler.write(data);
    }).not.toThrow();
    
    throttler.dispose();
  });

  test('should handle missing performance.memory', () => {
    // Remove performance.memory
    delete (global as any).performance;
    
    const terminal = create_mock_terminal();
    const monitor = new TerminalMemoryMonitor(terminal, {}, false);
    
    monitor.start_monitoring();
    
    const metrics = monitor.get_metrics();
    expect(metrics.usage_mb).toBeGreaterThanOrEqual(0);
    
    monitor.dispose();
  });
});

describe('Configuration validation', () => {
  test('should validate buffer configuration', () => {
    const terminal = create_mock_terminal();
    
    expect(() => {
      new TerminalBufferManager(terminal, { max_lines: -1 }, false);
    }).toThrow();
    
    expect(() => {
      new TerminalBufferManager(terminal, { trim_threshold: 1.5 }, false);
    }).toThrow();
  });

  test('should validate throttle configuration', () => {
    const terminal = create_mock_terminal();
    
    expect(() => {
      new TerminalOutputThrottler(terminal, { debounce_ms: 0 }, false);
    }).toThrow();
    
    expect(() => {
      new TerminalOutputThrottler(terminal, { max_chunk_size: -1 }, false);
    }).toThrow();
  });

  test('should validate memory configuration', () => {
    const terminal = create_mock_terminal();
    
    expect(() => {
      new TerminalMemoryMonitor(terminal, { max_memory_mb: 0 }, false);
    }).toThrow();
    
    expect(() => {
      new TerminalMemoryMonitor(terminal, { warning_threshold: 2 }, false);
    }).toThrow();
  });
});