'use client';

import React from 'react';
import { TerminalPerformanceIndicator } from './TerminalPerformanceIndicator';
import { PerformanceMetrics } from '@/utils/terminalPerformance';
import { 
  Terminal as TerminalIcon,
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Create a more complete metrics type for the status bar
interface TerminalStatusBarMetrics extends Partial<PerformanceMetrics> {
  fps?: number;
  writes_per_second?: number;
  max_buffer_lines?: number;
  buffer_usage?: number;
}

interface TerminalStatusBarProps {
  terminal_id?: string;
  session_name?: string;
  rows?: number;
  cols?: number;
  metrics?: TerminalStatusBarMetrics | null;
  show_performance?: boolean;
  show_details?: boolean;
  className?: string;
}

export function TerminalStatusBar({
  terminal_id,
  session_name,
  rows,
  cols,
  metrics,
  show_performance = true,
  show_details = false,
  className = ''
}: TerminalStatusBarProps) {
  return (
    <TooltipProvider>
      <div className={`terminal-status-bar flex items-center justify-between h-6 px-3 bg-background/50 border-t border-border/50 text-xs text-muted-foreground ${className}`}>
        {/* Left side - Terminal info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TerminalIcon size={12} />
            <span className="font-medium">{session_name || 'Terminal'}</span>
            {terminal_id && (
              <span className="opacity-50">#{terminal_id.slice(0, 8)}</span>
            )}
          </div>
          
          {rows && cols && (
            <div className="flex items-center gap-1 opacity-70">
              <span>{cols}×{rows}</span>
            </div>
          )}
        </div>

        {/* Right side - Performance metrics */}
        {show_performance && metrics && (
          <div className="flex items-center gap-3">
            {/* FPS */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help">
                  <Zap size={12} />
                  <span>{metrics.fps?.toFixed(0) || 0} FPS</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Render performance</p>
                <p className="text-xs opacity-70">Target: 60 FPS</p>
              </TooltipContent>
            </Tooltip>

            {/* Buffer Usage */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help">
                  <HardDrive size={12} />
                  <span>{metrics.buffer_usage && metrics.max_buffer_lines ? ((metrics.buffer_usage / metrics.max_buffer_lines) * 100).toFixed(0) : 0}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buffer usage</p>
                <p className="text-xs opacity-70">{metrics.buffer_usage?.toLocaleString() || 0} / {metrics.max_buffer_lines?.toLocaleString() || 0} lines</p>
              </TooltipContent>
            </Tooltip>

            {/* Write Speed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help">
                  <Activity size={12} />
                  <span>{format_write_speed(metrics.writes_per_second || 0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Data throughput</p>
                <p className="text-xs opacity-70">Writes per second</p>
              </TooltipContent>
            </Tooltip>

            {/* Memory */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help">
                  <Cpu size={12} />
                  <span>{metrics.memory_usage?.toFixed(1) || 0} MB</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Memory usage</p>
                <p className="text-xs opacity-70">Terminal process memory</p>
              </TooltipContent>
            </Tooltip>

            {/* Detailed metrics toggle */}
            {show_details && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1 hover:text-foreground transition-colors"
                    onClick={() => {
                      // Toggle detailed performance overlay
                      // This could emit an event or call a callback
                    }}
                  >
                    <Info size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show detailed metrics</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function format_write_speed(writes_per_second: number): string {
  if (writes_per_second < 1000) {
    return `${writes_per_second.toFixed(0)}/s`;
  } else if (writes_per_second < 1000000) {
    return `${(writes_per_second / 1000).toFixed(1)}k/s`;
  } else {
    return `${(writes_per_second / 1000000).toFixed(1)}M/s`;
  }
}