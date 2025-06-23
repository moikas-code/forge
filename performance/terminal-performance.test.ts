import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerminalStore } from '@/stores/terminalStore';
import { 
  parseCommand, 
  executeCommand, 
  TerminalPerformanceTracker,
  type CommandContext 
} from '@/utils/terminalCommands';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  TERMINAL_CREATION: 100, // ms
  COMMAND_PARSING: 10, // ms
  COMMAND_EXECUTION: 50, // ms
  SESSION_CLEANUP: 200, // ms
  BULK_OPERATIONS: 1000, // ms
  MEMORY_GROWTH_LIMIT: 50, // MB
};

// Performance measurement utilities
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();
  private memoryBaseline: number = 0;

  startMeasurement(name: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const existing = this.measurements.get(name) || [];
      existing.push(duration);
      this.measurements.set(name, existing);
      return duration;
    };
  }

  getStatistics(name: string) {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    return { avg, min, max, p95, count: times.length };
  }

  measureMemory(): number {
    // In Node.js environment, use process.memoryUsage()
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    
    // In browser environment, use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    return 0;
  }

  setMemoryBaseline(): void {
    this.memoryBaseline = this.measureMemory();
  }

  getMemoryGrowth(): number {
    return this.measureMemory() - this.memoryBaseline;
  }

  clear(): void {
    this.measurements.clear();
    this.memoryBaseline = 0;
  }

  getAllStatistics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, times] of this.measurements.entries()) {
      result[name] = this.getStatistics(name);
    }
    return result;
  }
}

describe('Terminal Performance Benchmarks', () => {
  let profiler: PerformanceProfiler;
  let mockContext: CommandContext;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    profiler.setMemoryBaseline();
    
    mockContext = {
      addTab: vi.fn(),
      writeToTerminal: vi.fn(),
      getCurrentDirectory: vi.fn().mockReturnValue('/test'),
    };

    // Clear terminal store
    const store = useTerminalStore.getState();
    store.sessions.forEach(session => {
      store.remove_session(session.id);
    });
  });

  afterEach(() => {
    profiler.clear();
    vi.clearAllMocks();
  });

  describe('Terminal Creation Performance', () => {
    it('should create terminal sessions within performance threshold', () => {
      const { result } = renderHook(() => useTerminalStore());

      const endMeasurement = profiler.startMeasurement('terminal_creation');

      act(() => {
        result.current.create_session();
      });

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.TERMINAL_CREATION);
      expect(result.current.sessions).toHaveLength(1);
    });

    it('should handle bulk terminal creation efficiently', () => {
      const { result } = renderHook(() => useTerminalStore());

      const endMeasurement = profiler.startMeasurement('bulk_terminal_creation');

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.create_session(`Terminal ${i + 1}`);
        }
      });

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
      
      // Should enforce max sessions limit
      expect(result.current.sessions.length).toBeLessThanOrEqual(10);
    });

    it('should maintain consistent creation performance', () => {
      const { result } = renderHook(() => useTerminalStore());

      // Create multiple sessions and measure each
      for (let i = 0; i < 20; i++) {
        const endMeasurement = profiler.startMeasurement('consistent_creation');
        
        act(() => {
          result.current.create_session();
        });
        
        endMeasurement();
      }

      const stats = profiler.getStatistics('consistent_creation');
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TERMINAL_CREATION);
      expect(stats!.max).toBeLessThan(PERFORMANCE_THRESHOLDS.TERMINAL_CREATION * 2);
    });
  });

  describe('Command Parsing Performance', () => {
    it('should parse simple commands quickly', () => {
      const commands = [
        'help',
        'open file.txt',
        'new-file',
        'ls -la',
        'git status',
      ];

      for (const cmd of commands) {
        const endMeasurement = profiler.startMeasurement('simple_parsing');
        
        const result = parseCommand(cmd);
        
        endMeasurement();
        
        expect(result).toBeDefined();
      }

      const stats = profiler.getStatistics('simple_parsing');
      expect(stats!.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_PARSING);
    });

    it('should parse complex commands efficiently', () => {
      const complexCommands = [
        'git commit -m "Long commit message with spaces and special chars !@#$%^&*()" --author "John Doe <john@example.com>"',
        'search --pattern "complex regex [a-zA-Z0-9]+" --files "*.ts,*.tsx,*.js" --exclude node_modules --case-sensitive',
        'open --file "/very/long/path/to/some/file/with/spaces and special chars.txt" --line 42 --column 10',
      ];

      for (const cmd of complexCommands) {
        const endMeasurement = profiler.startMeasurement('complex_parsing');
        
        const result = parseCommand(cmd);
        
        endMeasurement();
        
        expect(result).toBeDefined();
      }

      const stats = profiler.getStatistics('complex_parsing');
      expect(stats!.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_PARSING * 2);
    });

    it('should handle bulk command parsing', () => {
      const endMeasurement = profiler.startMeasurement('bulk_parsing');

      for (let i = 0; i < 1000; i++) {
        parseCommand(`command-${i} --flag value-${i}`);
      }

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
    });
  });

  describe('Command Execution Performance', () => {
    it('should execute help command quickly', async () => {
      const command = parseCommand('help')!;
      
      const endMeasurement = profiler.startMeasurement('help_execution');
      
      await executeCommand(command, mockContext);
      
      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_EXECUTION);
      expect(mockContext.writeToTerminal).toHaveBeenCalled();
    });

    it('should execute file operations efficiently', async () => {
      const commands = [
        'open file.txt',
        'new-file test.js',
        'preview index.html',
        'pwd',
      ];

      for (const cmdStr of commands) {
        const command = parseCommand(cmdStr)!;
        
        const endMeasurement = profiler.startMeasurement('file_operations');
        
        await executeCommand(command, mockContext);
        
        endMeasurement();
      }

      const stats = profiler.getStatistics('file_operations');
      expect(stats!.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_EXECUTION);
    });

    it('should handle rapid command execution', async () => {
      const endMeasurement = profiler.startMeasurement('rapid_execution');

      for (let i = 0; i < 100; i++) {
        const command = parseCommand('pwd')!;
        await executeCommand(command, mockContext);
      }

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
    });
  });

  describe('Session Management Performance', () => {
    it('should handle session switching efficiently', () => {
      const { result } = renderHook(() => useTerminalStore());

      // Create multiple sessions
      const sessionIds: string[] = [];
      act(() => {
        for (let i = 0; i < 10; i++) {
          sessionIds.push(result.current.create_session());
        }
      });

      // Test switching performance
      const endMeasurement = profiler.startMeasurement('session_switching');

      act(() => {
        for (const sessionId of sessionIds) {
          result.current.set_active_session(sessionId);
        }
      });

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_EXECUTION);
    });

    it('should cleanup sessions efficiently', () => {
      const { result } = renderHook(() => useTerminalStore());

      // Create sessions with old timestamps
      act(() => {
        for (let i = 0; i < 20; i++) {
          const sessionId = result.current.create_session();
          // Make sessions old
          const oldTime = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
          result.current.update_session(sessionId, { created_at: oldTime });
        }
      });

      const endMeasurement = profiler.startMeasurement('session_cleanup');

      act(() => {
        result.current.cleanup_sessions();
      });

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SESSION_CLEANUP);
    });

    it('should handle large output buffers efficiently', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      const endMeasurement = profiler.startMeasurement('large_output');

      act(() => {
        for (let i = 0; i < 10000; i++) {
          result.current.add_output(sessionId, `Output line ${i}\n`);
        }
      });

      const duration = endMeasurement();

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
      
      // Should limit buffer size
      const session = result.current.get_session(sessionId);
      expect(session?.output_buffer.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause significant memory growth during normal operations', () => {
      const { result } = renderHook(() => useTerminalStore());

      profiler.setMemoryBaseline();

      // Perform normal operations
      act(() => {
        for (let i = 0; i < 100; i++) {
          const sessionId = result.current.create_session();
          result.current.add_to_history(sessionId, `command-${i}`);
          result.current.add_output(sessionId, `output-${i}`);
          
          if (i % 10 === 0) {
            result.current.remove_session(sessionId);
          }
        }
      });

      const memoryGrowth = profiler.getMemoryGrowth();
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_GROWTH_LIMIT);
    });

    it('should handle memory efficiently with command history', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      profiler.setMemoryBaseline();

      // Add large command history
      act(() => {
        for (let i = 0; i < 2000; i++) {
          result.current.add_to_history(sessionId, `command-${i} with some arguments and flags --flag${i}`);
        }
      });

      const session = result.current.get_session(sessionId);
      
      // Should limit history size
      expect(session?.command_history.length).toBeLessThanOrEqual(1000);
      
      const memoryGrowth = profiler.getMemoryGrowth();
      expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_GROWTH_LIMIT);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', () => {
      const tracker = new TerminalPerformanceTracker();

      // Simulate operations with known timing
      const endTiming1 = tracker.startTiming('test-operation');
      // Simulate work
      const start = performance.now();
      while (performance.now() - start < 10) {} // Wait ~10ms
      endTiming1();

      const endTiming2 = tracker.startTiming('test-operation');
      const start2 = performance.now();
      while (performance.now() - start2 < 20) {} // Wait ~20ms
      endTiming2();

      const metrics = tracker.getMetrics('test-operation');
      expect(metrics).toBeDefined();
      expect(metrics!.count).toBe(2);
      expect(metrics!.avg).toBeGreaterThan(10);
      expect(metrics!.min).toBeGreaterThan(5);
      expect(metrics!.max).toBeGreaterThan(15);
    });

    it('should handle concurrent performance tracking', () => {
      const tracker = new TerminalPerformanceTracker();

      // Start multiple concurrent operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(tracker.startTiming(`operation-${i}`));
      }

      // End them at different times
      operations.forEach((endTiming, index) => {
        setTimeout(() => endTiming(), index * 2);
      });

      // Wait for all to complete
      setTimeout(() => {
        const allMetrics = tracker.getAllMetrics();
        expect(Object.keys(allMetrics)).toHaveLength(10);
      }, 25);
    });
  });

  describe('Stress Testing', () => {
    it('should handle stress testing scenarios', () => {
      const { result } = renderHook(() => useTerminalStore());

      const endMeasurement = profiler.startMeasurement('stress_test');

      act(() => {
        // Rapidly create and destroy sessions
        for (let i = 0; i < 1000; i++) {
          const sessionId = result.current.create_session();
          
          // Add some data
          result.current.add_to_history(sessionId, `stress-command-${i}`);
          result.current.add_output(sessionId, `stress-output-${i}`);
          
          // Remove every other session
          if (i % 2 === 0) {
            result.current.remove_session(sessionId);
          }
        }
      });

      const duration = endMeasurement();

      // Should complete within reasonable time
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS * 2);
      
      // Should enforce limits
      expect(result.current.sessions.length).toBeLessThanOrEqual(10);
    });

    it('should maintain performance under load', () => {
      const measurements: number[] = [];

      for (let iteration = 0; iteration < 100; iteration++) {
        const endMeasurement = profiler.startMeasurement('load_test');
        
        const command = parseCommand('help')!;
        executeCommand(command, mockContext);
        
        measurements.push(endMeasurement());
      }

      // Performance should remain consistent
      const avg = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const max = Math.max(...measurements);
      
      expect(avg).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_EXECUTION);
      expect(max).toBeLessThan(PERFORMANCE_THRESHOLDS.COMMAND_EXECUTION * 3);
    });
  });

  // Performance summary
  afterEach(() => {
    const allStats = profiler.getAllStatistics();
    const memoryUsage = profiler.measureMemory();
    
    console.log('\n=== Performance Summary ===');
    console.log(`Memory Usage: ${memoryUsage.toFixed(2)} MB`);
    console.log(`Memory Growth: ${profiler.getMemoryGrowth().toFixed(2)} MB`);
    
    for (const [operation, stats] of Object.entries(allStats)) {
      if (stats) {
        console.log(`${operation}: avg=${stats.avg.toFixed(2)}ms, p95=${stats.p95.toFixed(2)}ms, count=${stats.count}`);
      }
    }
    console.log('===========================\n');
  });
});