/**
 * Terminal Performance Optimization Utilities
 * 
 * This module provides utilities for optimizing terminal performance including:
 * - Virtual scrolling and buffer management
 * - Output throttling for high-volume commands
 * - Memory optimization and cleanup
 * - Performance monitoring
 */

import React from 'react';
import { z } from 'zod';

// Configuration schemas
const BufferConfigSchema = z.object({
  max_lines: z.number().min(1000).max(100000).default(10000),
  trim_threshold: z.number().min(0.7).max(0.95).default(0.8),
  trim_lines: z.number().min(100).max(5000).default(1000),
  gc_interval_ms: z.number().min(5000).max(60000).default(30000),
});

const ThrottleConfigSchema = z.object({
  debounce_ms: z.number().min(1).max(1000).default(16), // ~60fps
  max_chunk_size: z.number().min(100).max(10000).default(1000),
  high_volume_threshold: z.number().min(10).max(1000).default(100),
  throttle_timeout_ms: z.number().min(50).max(500).default(100),
});

const MemoryConfigSchema = z.object({
  max_memory_mb: z.number().min(10).max(500).default(100),
  check_interval_ms: z.number().min(1000).max(30000).default(5000),
  warning_threshold: z.number().min(0.7).max(0.95).default(0.8),
});

// Types
export type BufferConfig = z.infer<typeof BufferConfigSchema>;
export type ThrottleConfig = z.infer<typeof ThrottleConfigSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

export interface PerformanceMetrics {
  buffer_lines: number;
  memory_usage_mb: number;
  throttle_active: boolean;
  last_gc_time: number;
  output_chunks_queued: number;
  frames_dropped: number;
}

export interface TerminalPerformanceOptions {
  buffer?: Partial<BufferConfig>;
  throttle?: Partial<ThrottleConfig>;
  memory?: Partial<MemoryConfig>;
  debug?: boolean;
}

// Buffer Management Class
export class TerminalBufferManager {
  private config: BufferConfig;
  private terminal: any; // xterm instance
  private lines_count = 0;
  private last_gc_time = Date.now();
  private debug: boolean;

  constructor(terminal: any, config: Partial<BufferConfig> = {}, debug = false) {
    this.config = BufferConfigSchema.parse(config);
    this.terminal = terminal;
    this.debug = debug;
    
    this.setup_gc_interval();
    this.log('BufferManager initialized', this.config);
  }

  /**
   * Check if buffer needs trimming and perform if necessary
   */
  check_and_trim_buffer(): void {
    if (!this.terminal?.buffer?.active) return;

    const current_lines = this.terminal.buffer.active.length;
    this.lines_count = current_lines;

    if (current_lines > this.config.max_lines * this.config.trim_threshold) {
      this.trim_buffer();
    }
  }

  /**
   * Trim buffer to optimal size
   */
  private trim_buffer(): void {
    if (!this.terminal?.buffer?.active) return;

    const lines_to_keep = this.config.max_lines - this.config.trim_lines;
    
    try {
      // Use xterm's built-in scrollback management
      this.terminal.options.scrollback = lines_to_keep;
      
      // Force buffer cleanup by writing a control sequence
      this.terminal.write('\x1b[3J'); // Clear scrollback buffer
      
      this.last_gc_time = Date.now();
      this.log(`Buffer trimmed to ${lines_to_keep} lines`);
    } catch (error) {
      console.error('Failed to trim terminal buffer:', error);
    }
  }

  /**
   * Setup periodic garbage collection
   */
  private setup_gc_interval(): void {
    setInterval(() => {
      this.check_and_trim_buffer();
      this.force_gc();
    }, this.config.gc_interval_ms);
  }

  /**
   * Force garbage collection if available
   */
  private force_gc(): void {
    if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        this.log('Forced garbage collection');
      } catch (error) {
        // Silently ignore GC errors
      }
    }
  }

  /**
   * Get current buffer metrics
   */
  get_metrics(): { lines_count: number; last_gc_time: number } {
    return {
      lines_count: this.lines_count,
      last_gc_time: this.last_gc_time,
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.log('BufferManager disposed');
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[TerminalBufferManager] ${message}`, data || '');
    }
  }
}

// Output Throttling Class
export class TerminalOutputThrottler {
  private config: ThrottleConfig;
  private terminal: any;
  private output_queue: Uint8Array[] = [];
  private throttle_active = false;
  private last_render_time = 0;
  private frames_dropped = 0;
  private render_timeout_id: NodeJS.Timeout | null = null;
  private debug: boolean;

  constructor(terminal: any, config: Partial<ThrottleConfig> = {}, debug = false) {
    this.config = ThrottleConfigSchema.parse(config);
    this.terminal = terminal;
    this.debug = debug;
    
    this.log('OutputThrottler initialized', this.config);
  }

  /**
   * Write data to terminal with throttling
   */
  write(data: Uint8Array): void {
    this.output_queue.push(data);

    // Check if we need to start throttling
    if (this.output_queue.length > this.config.high_volume_threshold && !this.throttle_active) {
      this.start_throttling();
    }

    // Process queue
    this.process_queue();
  }

  /**
   * Start throttling mode
   */
  private start_throttling(): void {
    this.throttle_active = true;
    this.log('High-volume output detected, starting throttling');
    
    // Clear any existing timeout
    if (this.render_timeout_id) {
      clearTimeout(this.render_timeout_id);
    }
    
    // Set timeout to exit throttling mode
    this.render_timeout_id = setTimeout(() => {
      this.stop_throttling();
    }, this.config.throttle_timeout_ms);
  }

  /**
   * Stop throttling mode
   */
  private stop_throttling(): void {
    this.throttle_active = false;
    this.log('Throttling stopped');
    
    if (this.render_timeout_id) {
      clearTimeout(this.render_timeout_id);
      this.render_timeout_id = null;
    }
  }

  /**
   * Process the output queue with debouncing
   */
  private process_queue(): void {
    const now = Date.now();
    
    if (this.throttle_active) {
      // In throttling mode, use debounced rendering
      if (now - this.last_render_time < this.config.debounce_ms) {
        this.frames_dropped++;
        return;
      }
    }

    this.render_queued_output();
    this.last_render_time = now;
  }

  /**
   * Render queued output to terminal
   */
  private render_queued_output(): void {
    if (this.output_queue.length === 0) return;

    try {
      let processed_count = 0;
      const max_chunks = this.throttle_active ? this.config.max_chunk_size : this.output_queue.length;

      while (this.output_queue.length > 0 && processed_count < max_chunks) {
        const data = this.output_queue.shift();
        if (data) {
          this.terminal.write(data);
          processed_count++;
        }
      }

      this.log(`Rendered ${processed_count} chunks, ${this.output_queue.length} remaining`);

      // If there's more data to process, schedule next render
      if (this.output_queue.length > 0) {
        requestAnimationFrame(() => this.process_queue());
      }
    } catch (error) {
      console.error('Failed to render terminal output:', error);
      // Clear queue to prevent error loops
      this.output_queue = [];
    }
  }

  /**
   * Get current throttling metrics
   */
  get_metrics(): { throttle_active: boolean; queued_chunks: number; frames_dropped: number } {
    return {
      throttle_active: this.throttle_active,
      queued_chunks: this.output_queue.length,
      frames_dropped: this.frames_dropped,
    };
  }

  /**
   * Clear output queue
   */
  clear_queue(): void {
    this.output_queue = [];
    this.stop_throttling();
    this.log('Output queue cleared');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clear_queue();
    if (this.render_timeout_id) {
      clearTimeout(this.render_timeout_id);
    }
    this.log('OutputThrottler disposed');
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[TerminalOutputThrottler] ${message}`, data || '');
    }
  }
}

// Memory Monitoring Class
export class TerminalMemoryMonitor {
  private config: MemoryConfig;
  private terminal: any;
  private monitoring = false;
  private monitor_interval_id: NodeJS.Timeout | null = null;
  private last_memory_usage = 0;
  private debug: boolean;
  private on_warning_callback?: (usage_mb: number) => void;

  constructor(terminal: any, config: Partial<MemoryConfig> = {}, debug = false) {
    this.config = MemoryConfigSchema.parse(config);
    this.terminal = terminal;
    this.debug = debug;
    
    this.log('MemoryMonitor initialized', this.config);
  }

  /**
   * Start memory monitoring
   */
  start_monitoring(on_warning?: (usage_mb: number) => void): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.on_warning_callback = on_warning;
    
    this.monitor_interval_id = setInterval(() => {
      this.check_memory_usage();
    }, this.config.check_interval_ms);

    this.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stop_monitoring(): void {
    if (!this.monitoring) return;

    this.monitoring = false;
    
    if (this.monitor_interval_id) {
      clearInterval(this.monitor_interval_id);
      this.monitor_interval_id = null;
    }

    this.log('Memory monitoring stopped');
  }

  /**
   * Check current memory usage
   */
  private check_memory_usage(): void {
    try {
      // Estimate memory usage
      const memory_usage = this.estimate_memory_usage();
      this.last_memory_usage = memory_usage;

      this.log(`Memory usage: ${memory_usage.toFixed(2)} MB`);

      // Check if we exceed warning threshold
      if (memory_usage > this.config.max_memory_mb * this.config.warning_threshold) {
        this.log(`Memory warning: ${memory_usage.toFixed(2)} MB exceeds threshold`);
        
        if (this.on_warning_callback) {
          this.on_warning_callback(memory_usage);
        }
      }
    } catch (error) {
      console.error('Failed to check memory usage:', error);
    }
  }

  /**
   * Estimate memory usage of terminal
   */
  private estimate_memory_usage(): number {
    let estimated_mb = 0;

    try {
      // Estimate based on buffer size
      if (this.terminal?.buffer?.active) {
        const lines = this.terminal.buffer.active.length;
        const cols = this.terminal.cols || 80;
        // Rough estimate: 2 bytes per character + overhead
        estimated_mb = (lines * cols * 2) / 1024 / 1024;
      }

      // Add base overhead for terminal instance
      estimated_mb += 5; // Base overhead

      // Use performance.memory if available
      if (typeof performance !== 'undefined' && performance.memory) {
        const heap_used_mb = performance.memory.usedJSHeapSize / 1024 / 1024;
        // Use a fraction of total heap as terminal estimate
        estimated_mb = Math.max(estimated_mb, heap_used_mb * 0.1);
      }
    } catch (error) {
      // Fallback to base estimate
      estimated_mb = 10;
    }

    return estimated_mb;
  }

  /**
   * Get current memory metrics
   */
  get_metrics(): { usage_mb: number; monitoring: boolean } {
    return {
      usage_mb: this.last_memory_usage,
      monitoring: this.monitoring,
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop_monitoring();
    this.log('MemoryMonitor disposed');
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[TerminalMemoryMonitor] ${message}`, data || '');
    }
  }
}

// Main Performance Manager
export class TerminalPerformanceManager {
  private terminal: any;
  private buffer_manager: TerminalBufferManager;
  private output_throttler: TerminalOutputThrottler;
  private memory_monitor: TerminalMemoryMonitor;
  private debug: boolean;
  private disposed = false;

  constructor(terminal: any, options: TerminalPerformanceOptions = {}) {
    this.terminal = terminal;
    this.debug = options.debug ?? false;

    // Initialize managers
    this.buffer_manager = new TerminalBufferManager(
      terminal,
      options.buffer,
      this.debug
    );

    this.output_throttler = new TerminalOutputThrottler(
      terminal,
      options.throttle,
      this.debug
    );

    this.memory_monitor = new TerminalMemoryMonitor(
      terminal,
      options.memory,
      this.debug
    );

    // Start memory monitoring with warning callback
    this.memory_monitor.start_monitoring((usage_mb) => {
      this.log(`Memory warning: ${usage_mb.toFixed(2)} MB - forcing cleanup`);
      this.buffer_manager.check_and_trim_buffer();
    });

    this.log('PerformanceManager initialized');
  }

  /**
   * Write data to terminal with all optimizations applied
   */
  write(data: Uint8Array): void {
    if (this.disposed) return;

    // Use output throttler for optimized rendering
    this.output_throttler.write(data);
    
    // Check buffer periodically
    if (Math.random() < 0.01) { // 1% chance to check buffer
      this.buffer_manager.check_and_trim_buffer();
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  get_metrics(): PerformanceMetrics {
    const buffer_metrics = this.buffer_manager.get_metrics();
    const throttle_metrics = this.output_throttler.get_metrics();
    const memory_metrics = this.memory_monitor.get_metrics();

    return {
      buffer_lines: buffer_metrics.lines_count,
      memory_usage_mb: memory_metrics.usage_mb,
      throttle_active: throttle_metrics.throttle_active,
      last_gc_time: buffer_metrics.last_gc_time,
      output_chunks_queued: throttle_metrics.queued_chunks,
      frames_dropped: throttle_metrics.frames_dropped,
    };
  }

  /**
   * Force cleanup and optimization
   */
  force_cleanup(): void {
    this.log('Forcing cleanup and optimization');
    
    this.buffer_manager.check_and_trim_buffer();
    this.output_throttler.clear_queue();
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
      } catch (error) {
        // Ignore GC errors
      }
    }
  }

  /**
   * Check if terminal is under performance stress
   */
  is_under_stress(): boolean {
    const metrics = this.get_metrics();
    
    return (
      metrics.throttle_active ||
      metrics.output_chunks_queued > 50 ||
      metrics.memory_usage_mb > 80 ||
      metrics.frames_dropped > 100
    );
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    if (this.disposed) return;
    
    this.disposed = true;
    this.buffer_manager.dispose();
    this.output_throttler.dispose();
    this.memory_monitor.dispose();
    
    this.log('PerformanceManager disposed');
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[TerminalPerformanceManager] ${message}`, data || '');
    }
  }
}

// Utility function to create performance manager with sensible defaults
export function create_terminal_performance_manager(
  terminal: any,
  options: TerminalPerformanceOptions = {}
): TerminalPerformanceManager {
  return new TerminalPerformanceManager(terminal, {
    buffer: {
      max_lines: 10000,
      trim_threshold: 0.8,
      trim_lines: 1000,
      gc_interval_ms: 30000,
      ...options.buffer,
    },
    throttle: {
      debounce_ms: 16, // 60fps
      max_chunk_size: 1000,
      high_volume_threshold: 100,
      throttle_timeout_ms: 100,
      ...options.throttle,
    },
    memory: {
      max_memory_mb: 100,
      check_interval_ms: 5000,
      warning_threshold: 0.8,
      ...options.memory,
    },
    debug: options.debug ?? false,
  });
}

// React hook for terminal performance monitoring
export function useTerminalPerformanceMetrics(
  performance_manager: TerminalPerformanceManager | null
): PerformanceMetrics | null {
  const [metrics, set_metrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    if (!performance_manager) return;

    const update_metrics = () => {
      set_metrics(performance_manager.get_metrics());
    };

    // Update metrics initially
    update_metrics();

    // Update metrics periodically
    const interval = setInterval(update_metrics, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [performance_manager]);

  return metrics;
}