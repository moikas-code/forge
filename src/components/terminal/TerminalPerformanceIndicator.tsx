'use client';

import React from 'react';
import { Activity, AlertTriangle, Cpu, MemoryStick, Zap } from 'lucide-react';
import { PerformanceMetrics } from '@/utils/terminalPerformance';

interface TerminalPerformanceIndicatorProps {
  metrics: PerformanceMetrics | null;
  className?: string;
  show_details?: boolean;
}

export function TerminalPerformanceIndicator({ 
  metrics, 
  className = '',
  show_details = false 
}: TerminalPerformanceIndicatorProps) {
  if (!metrics) return null;

  const is_under_stress = metrics.throttle_active || 
    metrics.output_chunks_queued > 50 || 
    metrics.memory_usage_mb > 80 ||
    metrics.frames_dropped > 100;

  const get_memory_color = (usage_mb: number) => {
    if (usage_mb > 80) return 'text-red-500';
    if (usage_mb > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const get_buffer_color = (lines: number) => {
    if (lines > 8000) return 'text-red-500';
    if (lines > 5000) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!show_details) {
    // Compact indicator for normal view
    return (
      <div className={`terminal-performance-indicator ${className}`}>
        {is_under_stress && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400"
            title="Terminal is under performance stress"
          >
            <Zap size={12} />
            <span>Optimizing...</span>
          </div>
        )}
        {metrics.throttle_active && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-600 dark:text-blue-400"
            title="Output throttling active for better performance"
          >
            <Activity size={12} />
            <span>Throttling</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed view for dev tools
  return (
    <div className={`terminal-performance-details ${className}`}>
      <div className="space-y-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Cpu size={14} />
          Terminal Performance
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <MemoryStick size={12} />
              <span className="text-muted-foreground">Memory</span>
            </div>
            <div className={`font-mono ${get_memory_color(metrics.memory_usage_mb)}`}>
              {metrics.memory_usage_mb.toFixed(1)} MB
            </div>
          </div>

          {/* Buffer Lines */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Activity size={12} />
              <span className="text-muted-foreground">Buffer</span>
            </div>
            <div className={`font-mono ${get_buffer_color(metrics.buffer_lines)}`}>
              {metrics.buffer_lines.toLocaleString()} lines
            </div>
          </div>

          {/* Throttle Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span className="text-muted-foreground">Throttle</span>
            </div>
            <div className={`font-mono ${metrics.throttle_active ? 'text-yellow-500' : 'text-green-500'}`}>
              {metrics.throttle_active ? 'Active' : 'Inactive'}
            </div>
          </div>

          {/* Queued Output */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} />
              <span className="text-muted-foreground">Queue</span>
            </div>
            <div className={`font-mono ${metrics.output_chunks_queued > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
              {metrics.output_chunks_queued} chunks
            </div>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="pt-2 border-t border-border/30 space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Frames dropped:</span>
            <span className="font-mono">{metrics.frames_dropped}</span>
          </div>
          <div className="flex justify-between">
            <span>Last GC:</span>
            <span className="font-mono">
              {new Date(metrics.last_gc_time).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        {is_under_stress && (
          <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={12} />
            <span>Performance optimizations active</span>
          </div>
        )}
      </div>
    </div>
  );
}