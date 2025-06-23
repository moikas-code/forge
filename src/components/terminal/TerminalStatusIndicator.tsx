'use client';

import React from 'react';
import { 
  Circle, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Cpu, 
  MemoryStick,
  Activity 
} from 'lucide-react';
import { TerminalStatus, type TerminalPane } from '@/stores/terminalStore';
import { cn } from '@/lib/utils';

interface TerminalStatusIndicatorProps {
  status: TerminalStatus;
  show_icon?: boolean;
  show_text?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  process_info?: TerminalPane['process_info'];
}

interface ProcessResourcesProps {
  process_info: TerminalPane['process_info'];
  size?: 'sm' | 'md' | 'lg';
}

const ProcessResources: React.FC<ProcessResourcesProps> = ({ process_info, size = 'sm' }) => {
  if (!process_info?.cpu_usage && !process_info?.memory_usage) return null;
  
  const icon_size = size === 'sm' ? 10 : size === 'md' ? 12 : 14;
  
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {process_info.cpu_usage !== undefined && (
        <div className="flex items-center gap-0.5" title={`CPU: ${process_info.cpu_usage}%`}>
          <Cpu size={icon_size} />
          <span>{Math.round(process_info.cpu_usage)}%</span>
        </div>
      )}
      {process_info.memory_usage !== undefined && (
        <div className="flex items-center gap-0.5" title={`Memory: ${process_info.memory_usage} MB`}>
          <MemoryStick size={icon_size} />
          <span>{Math.round(process_info.memory_usage)}MB</span>
        </div>
      )}
    </div>
  );
};

export const TerminalStatusIndicator: React.FC<TerminalStatusIndicatorProps> = ({
  status,
  show_icon = true,
  show_text = false,
  size = 'sm',
  className = '',
  process_info
}) => {
  const get_status_config = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bg_color: 'bg-muted-foreground/20',
          text: 'Idle',
          description: 'Terminal is idle'
        };
      case 'running':
        return {
          icon: Activity,
          color: 'text-blue-500',
          bg_color: 'bg-blue-500/20',
          text: 'Running',
          description: 'Process is running'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bg_color: 'bg-red-500/20',
          text: 'Error',
          description: 'Process encountered an error'
        };
      case 'exited':
        return {
          icon: XCircle,
          color: 'text-orange-500',
          bg_color: 'bg-orange-500/20',
          text: 'Exited',
          description: 'Process has exited'
        };
      default:
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bg_color: 'bg-muted-foreground/20',
          text: 'Unknown',
          description: 'Unknown status'
        };
    }
  };
  
  const config = get_status_config();
  const Icon = config.icon;
  
  const icon_size = size === 'sm' ? 8 : size === 'md' ? 10 : 12;
  
  const get_tooltip_text = () => {
    let tooltip = config.description;
    if (process_info?.command) {
      tooltip += ` - ${process_info.command}`;
    }
    if (process_info?.pid) {
      tooltip += ` (PID: ${process_info.pid})`;
    }
    return tooltip;
  };
  
  return (
    <div 
      className={cn(
        'terminal-status-indicator flex items-center gap-1',
        className
      )}
      title={get_tooltip_text()}
    >
      {show_icon && (
        <div 
          className={cn(
            'flex items-center justify-center rounded-full',
            config.bg_color,
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
        >
          <Icon 
            size={icon_size} 
            className={cn(config.color, status === 'running' ? 'animate-pulse' : '')}
          />
        </div>
      )}
      
      {show_text && (
        <span 
          className={cn(
            'text-xs font-medium',
            config.color,
            size === 'lg' && 'text-sm'
          )}
        >
          {config.text}
        </span>
      )}
      
      {/* Show process resources if available */}
      {size !== 'sm' && process_info && (
        <ProcessResources process_info={process_info} size={size} />
      )}
    </div>
  );
};

// Utility component for tab status indicators
export const TabStatusIndicator: React.FC<{
  status: TerminalStatus;
  process_info?: TerminalPane['process_info'];
}> = ({ status, process_info }) => (
  <TerminalStatusIndicator 
    status={status}
    show_icon={true}
    show_text={false}
    size="sm"
    process_info={process_info}
    className="ml-1"
  />
);

// Utility component for detailed status displays
export const DetailedStatusIndicator: React.FC<{
  status: TerminalStatus;
  process_info?: TerminalPane['process_info'];
}> = ({ status, process_info }) => (
  <TerminalStatusIndicator 
    status={status}
    show_icon={true}
    show_text={true}
    size="md"
    process_info={process_info}
    className="px-2 py-1 rounded-md bg-secondary/50"
  />
);