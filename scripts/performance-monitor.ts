#!/usr/bin/env bun

/**
 * Performance monitoring script for terminal operations
 * Tracks and reports performance metrics over time
 */

import { promises as fs } from 'fs';
import path from 'path';

interface PerformanceMetric {
  timestamp: number;
  operation: string;
  duration: number;
  memory_usage: number;
  cpu_usage?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  summary: {
    total_operations: number;
    avg_duration: number;
    p95_duration: number;
    p99_duration: number;
    memory_peak: number;
    memory_avg: number;
  };
  operations: Record<string, {
    count: number;
    avg_duration: number;
    min_duration: number;
    max_duration: number;
    p95_duration: number;
  }>;
  timeline: PerformanceMetric[];
  alerts: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private baselineMemory: number = 0;

  // Performance thresholds
  private readonly THRESHOLDS = {
    TERMINAL_CREATION: 100, // ms
    COMMAND_PARSING: 10, // ms
    COMMAND_EXECUTION: 50, // ms
    MEMORY_GROWTH: 100, // MB
    HIGH_MEMORY_USAGE: 500, // MB
  };

  constructor() {
    this.baselineMemory = this.getCurrentMemoryUsage();
  }

  /**
   * Start monitoring a performance operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    return () => {
      const duration = performance.now() - startTime;
      const endMemory = this.getCurrentMemoryUsage();
      
      this.recordMetric({
        timestamp: Date.now(),
        operation,
        duration,
        memory_usage: endMemory,
        metadata: {
          ...metadata,
          memory_delta: endMemory - startMemory,
        },
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Check for performance alerts
    this.checkPerformanceAlerts(metric);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const operations = this.groupMetricsByOperation();
    const durations = this.metrics.map(m => m.duration);
    const memoryUsages = this.metrics.map(m => m.memory_usage);

    return {
      summary: {
        total_operations: this.metrics.length,
        avg_duration: this.average(durations),
        p95_duration: this.percentile(durations, 95),
        p99_duration: this.percentile(durations, 99),
        memory_peak: Math.max(...memoryUsages),
        memory_avg: this.average(memoryUsages),
      },
      operations,
      timeline: this.metrics.slice(), // Copy
      alerts: this.generateAlerts(),
    };
  }

  /**
   * Save performance report to file
   */
  async saveReport(filename?: string): Promise<string> {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = filename || `performance/results/perf-report-${timestamp}.json`;
    
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    return filepath;
  }

  /**
   * Monitor terminal operations in real-time
   */
  async monitorTerminalOperations(duration: number = 60000): Promise<void> {
    console.log(`🔍 Starting terminal performance monitoring for ${duration / 1000}s...`);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      this.recordSystemMetrics();
    }, 1000); // Record system metrics every second

    // Simulate terminal operations for monitoring
    const operationInterval = setInterval(() => {
      this.simulateTerminalOperations();
    }, 100); // Simulate operations every 100ms

    // Wait for monitoring duration
    await new Promise(resolve => setTimeout(resolve, duration));

    clearInterval(interval);
    clearInterval(operationInterval);

    console.log('✅ Performance monitoring completed');
    
    // Generate and save report
    const reportPath = await this.saveReport();
    console.log(`📊 Performance report saved to: ${reportPath}`);
    
    // Print summary
    this.printSummary();
  }

  /**
   * Run performance benchmarks
   */
  async runBenchmarks(): Promise<void> {
    console.log('🏃 Running performance benchmarks...');

    // Terminal creation benchmark
    await this.benchmarkTerminalCreation();
    
    // Command parsing benchmark
    await this.benchmarkCommandParsing();
    
    // Memory usage benchmark
    await this.benchmarkMemoryUsage();
    
    // Concurrent operations benchmark
    await this.benchmarkConcurrentOperations();

    console.log('✅ Benchmarks completed');
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    const operation = metric.operation;
    const duration = metric.duration;
    const memoryUsage = metric.memory_usage;

    // Check duration thresholds
    const threshold = this.THRESHOLDS[operation as keyof typeof this.THRESHOLDS];
    if (threshold && duration > threshold) {
      console.warn(`⚠️  Performance Alert: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Check memory usage
    if (memoryUsage > this.THRESHOLDS.HIGH_MEMORY_USAGE) {
      console.warn(`⚠️  Memory Alert: High memory usage ${memoryUsage.toFixed(2)}MB`);
    }

    const memoryGrowth = memoryUsage - this.baselineMemory;
    if (memoryGrowth > this.THRESHOLDS.MEMORY_GROWTH) {
      console.warn(`⚠️  Memory Growth Alert: ${memoryGrowth.toFixed(2)}MB growth from baseline`);
    }
  }

  /**
   * Benchmark terminal creation performance
   */
  private async benchmarkTerminalCreation(): Promise<void> {
    console.log('  📊 Benchmarking terminal creation...');
    
    for (let i = 0; i < 100; i++) {
      const endOperation = this.startOperation('TERMINAL_CREATION', { iteration: i });
      
      // Simulate terminal creation
      await this.simulateAsyncOperation(50 + Math.random() * 50);
      
      endOperation();
    }
  }

  /**
   * Benchmark command parsing performance
   */
  private async benchmarkCommandParsing(): Promise<void> {
    console.log('  📊 Benchmarking command parsing...');
    
    const commands = [
      'help',
      'open file.txt',
      'git commit -m "test"',
      'search --pattern "test" --files "*.ts"',
      'complex-command --flag1 value1 --flag2 value2 arg1 arg2',
    ];

    for (let i = 0; i < 1000; i++) {
      const command = commands[i % commands.length];
      const endOperation = this.startOperation('COMMAND_PARSING', { command });
      
      // Simulate command parsing
      await this.simulateAsyncOperation(1 + Math.random() * 5);
      
      endOperation();
    }
  }

  /**
   * Benchmark memory usage patterns
   */
  private async benchmarkMemoryUsage(): Promise<void> {
    console.log('  📊 Benchmarking memory usage...');
    
    const operations = [
      'terminal_output_processing',
      'command_history_management',
      'session_state_updates',
      'large_data_transfer',
    ];

    for (let i = 0; i < 200; i++) {
      const operation = operations[i % operations.length];
      const endOperation = this.startOperation(operation, { size: 'large' });
      
      // Simulate memory-intensive operation
      await this.simulateMemoryIntensiveOperation();
      
      endOperation();
    }
  }

  /**
   * Benchmark concurrent operations
   */
  private async benchmarkConcurrentOperations(): Promise<void> {
    console.log('  📊 Benchmarking concurrent operations...');
    
    const promises = [];
    
    for (let i = 0; i < 50; i++) {
      promises.push(this.simulateConcurrentOperation(i));
    }

    await Promise.all(promises);
  }

  /**
   * Simulate concurrent operation
   */
  private async simulateConcurrentOperation(id: number): Promise<void> {
    const endOperation = this.startOperation('CONCURRENT_OPERATION', { 
      thread_id: id,
      operation_type: 'multi_terminal_management'
    });
    
    await this.simulateAsyncOperation(20 + Math.random() * 30);
    
    endOperation();
  }

  /**
   * Record current system metrics
   */
  private recordSystemMetrics(): void {
    this.recordMetric({
      timestamp: Date.now(),
      operation: 'SYSTEM_METRICS',
      duration: 0,
      memory_usage: this.getCurrentMemoryUsage(),
      metadata: {
        type: 'system_monitoring',
        uptime: Date.now() - this.startTime,
      },
    });
  }

  /**
   * Simulate terminal operations for monitoring
   */
  private simulateTerminalOperations(): void {
    const operations = [
      'terminal_input_processing',
      'output_rendering',
      'scroll_update',
      'cursor_movement',
      'text_selection',
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const endOperation = this.startOperation(operation);
    
    // Simulate operation duration
    setTimeout(() => {
      endOperation();
    }, Math.random() * 10);
  }

  /**
   * Simulate async operation with duration
   */
  private async simulateAsyncOperation(durationMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, durationMs));
  }

  /**
   * Simulate memory-intensive operation
   */
  private async simulateMemoryIntensiveOperation(): Promise<void> {
    // Simulate memory allocation and cleanup
    const data = new Array(10000).fill(0).map(() => ({
      id: Math.random(),
      data: new Array(100).fill('test data'),
    }));
    
    await this.simulateAsyncOperation(10);
    
    // Cleanup
    data.length = 0;
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    
    return 0;
  }

  /**
   * Group metrics by operation type
   */
  private groupMetricsByOperation(): Record<string, any> {
    const groups: Record<string, PerformanceMetric[]> = {};
    
    this.metrics.forEach(metric => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
    });

    const result: Record<string, any> = {};
    
    Object.entries(groups).forEach(([operation, metrics]) => {
      const durations = metrics.map(m => m.duration);
      result[operation] = {
        count: metrics.length,
        avg_duration: this.average(durations),
        min_duration: Math.min(...durations),
        max_duration: Math.max(...durations),
        p95_duration: this.percentile(durations, 95),
      };
    });

    return result;
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(): string[] {
    const alerts: string[] = [];
    const report = this.generateReport();

    // Check overall performance
    if (report.summary.avg_duration > 100) {
      alerts.push(`High average operation duration: ${report.summary.avg_duration.toFixed(2)}ms`);
    }

    if (report.summary.memory_peak > this.THRESHOLDS.HIGH_MEMORY_USAGE) {
      alerts.push(`High peak memory usage: ${report.summary.memory_peak.toFixed(2)}MB`);
    }

    // Check specific operations
    Object.entries(report.operations).forEach(([operation, stats]) => {
      const threshold = this.THRESHOLDS[operation as keyof typeof this.THRESHOLDS];
      if (threshold && stats.avg_duration > threshold) {
        alerts.push(`${operation} average duration exceeds threshold: ${stats.avg_duration.toFixed(2)}ms > ${threshold}ms`);
      }
    });

    return alerts;
  }

  /**
   * Print performance summary
   */
  private printSummary(): void {
    const report = this.generateReport();
    
    console.log('\n📊 Performance Summary');
    console.log('=====================');
    console.log(`Total Operations: ${report.summary.total_operations}`);
    console.log(`Average Duration: ${report.summary.avg_duration.toFixed(2)}ms`);
    console.log(`P95 Duration: ${report.summary.p95_duration.toFixed(2)}ms`);
    console.log(`P99 Duration: ${report.summary.p99_duration.toFixed(2)}ms`);
    console.log(`Peak Memory: ${report.summary.memory_peak.toFixed(2)}MB`);
    console.log(`Average Memory: ${report.summary.memory_avg.toFixed(2)}MB`);

    if (report.alerts.length > 0) {
      console.log('\n⚠️  Performance Alerts:');
      report.alerts.forEach(alert => {
        console.log(`  - ${alert}`);
      });
    }

    console.log('\n🔝 Top Operations by Duration:');
    const sortedOps = Object.entries(report.operations)
      .sort(([,a], [,b]) => b.avg_duration - a.avg_duration)
      .slice(0, 5);

    sortedOps.forEach(([operation, stats]) => {
      console.log(`  ${operation}: ${stats.avg_duration.toFixed(2)}ms avg (${stats.count} ops)`);
    });
  }

  /**
   * Calculate average of array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate percentile of array
   */
  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const monitor = new PerformanceMonitor();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Terminal Performance Monitor

Usage: bun run scripts/performance-monitor.ts [options]

Options:
  --help, -h           Show this help message
  --monitor <time>     Monitor for specified time in seconds (default: 60)
  --benchmark          Run performance benchmarks
  --output <file>      Output file for results

Examples:
  bun run scripts/performance-monitor.ts --monitor 120
  bun run scripts/performance-monitor.ts --benchmark
  bun run scripts/performance-monitor.ts --benchmark --output results.json
    `);
    process.exit(0);
  }

  if (args.includes('--benchmark')) {
    await monitor.runBenchmarks();
  } else {
    const monitorTime = args.includes('--monitor') 
      ? parseInt(args[args.indexOf('--monitor') + 1]) * 1000 
      : 60000;
    
    await monitor.monitorTerminalOperations(monitorTime);
  }

  // Save report if output specified
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && outputIndex + 1 < args.length) {
    const outputFile = args[outputIndex + 1];
    await monitor.saveReport(outputFile);
    console.log(`📁 Results saved to: ${outputFile}`);
  }
}

// Check if running as main module
if (require.main === module) {
  main().catch(error => {
    console.error('Performance monitor failed:', error);
    process.exit(1);
  });
}

export { PerformanceMonitor };