'use client';

import React from 'react';
import { 
  Terminal as TerminalIcon, 
  Minimize2, 
  Maximize2, 
  X, 
  Cpu, 
  Clock,
  HardDrive,
  Wifi,
  ChevronDown,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DetailedStatusIndicator } from './TerminalStatusIndicator';
import { TerminalStatus, type TerminalPane } from '@/stores/terminalStore';
import { get_theme_by_id } from '@/lib/terminal-themes';
import { cn } from '@/lib/utils';

interface TerminalWindowChromeProps {
  title: string;
  status: TerminalStatus;
  process_info?: TerminalPane['process_info'];
  theme_id?: string;
  is_focused?: boolean;
  show_traffic_lights?: boolean;
  show_process_info?: boolean;
  className?: string;
  on_minimize?: () => void;
  on_maximize?: () => void;
  on_close?: () => void;
  on_focus?: () => void;
}

interface TrafficLightsProps {
  on_minimize?: () => void;
  on_maximize?: () => void;
  on_close?: () => void;
  is_focused?: boolean;
}

const TrafficLights: React.FC<TrafficLightsProps> = ({
  on_minimize,
  on_maximize,
  on_close,
  is_focused = true
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={on_close}
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          is_focused 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gray-400 hover:bg-red-500'
        )}
        aria-label="Close terminal"
        title="Close terminal"
      >
        {is_focused && (
          <X size={8} className="text-red-900 opacity-0 hover:opacity-100 transition-opacity m-auto" />
        )}
      </button>
      
      <button
        onClick={on_minimize}
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          is_focused 
            ? 'bg-yellow-500 hover:bg-yellow-600' 
            : 'bg-gray-400 hover:bg-yellow-500'
        )}
        aria-label="Minimize terminal"
        title="Minimize terminal"
      >
        {is_focused && (
          <Minimize2 size={8} className="text-yellow-900 opacity-0 hover:opacity-100 transition-opacity m-auto" />
        )}
      </button>
      
      <button
        onClick={on_maximize}
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          is_focused 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-gray-400 hover:bg-green-500'
        )}
        aria-label="Maximize terminal"
        title="Maximize terminal"
      >
        {is_focused && (
          <Maximize2 size={8} className="text-green-900 opacity-0 hover:opacity-100 transition-opacity m-auto" />
        )}
      </button>
    </div>
  );
};

export const TerminalWindowChrome: React.FC<TerminalWindowChromeProps> = ({
  title,
  status,
  process_info,
  theme_id = 'macos-default',
  is_focused = true,
  show_traffic_lights = true,
  show_process_info = true,
  className = '',
  on_minimize,
  on_maximize,
  on_close,
  on_focus
}) => {
  const theme = get_theme_by_id(theme_id);
  
  const format_uptime = (start_time?: Date) => {
    if (!start_time) return 'N/A';
    const now = new Date();
    const diff = now.getTime() - start_time.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  return (
    <div 
      className={cn(
        'terminal-window-chrome flex items-center justify-between px-4 py-2 border-b border-border/30',
        'transition-all duration-200',
        is_focused ? 'shadow-sm' : 'opacity-75',
        className
      )}
      style={{
        backgroundColor: theme.background,
        borderBottomColor: `${theme.foreground}20`
      }}
      onClick={on_focus}
    >
      {/* Left side - Traffic lights and title */}
      <div className="flex items-center gap-3">
        {show_traffic_lights && (
          <TrafficLights
            on_minimize={on_minimize}
            on_maximize={on_maximize}
            on_close={on_close}
            is_focused={is_focused}
          />
        )}
        
        <div className="flex items-center gap-2">
          <TerminalIcon 
            size={14} 
            className="text-muted-foreground" 
            style={{ color: `${theme.foreground}80` }}
          />
          <span 
            className="text-sm font-medium truncate max-w-[200px]"
            style={{ color: theme.foreground }}
          >
            {title}
          </span>
        </div>
      </div>
      
      {/* Center - Status and process info */}
      {show_process_info && (
        <div className="flex items-center gap-3">
          <DetailedStatusIndicator 
            status={status}
            process_info={process_info}
          />
          
          {process_info?.command && (
            <div 
              className="text-xs px-2 py-1 rounded bg-black/20 font-mono"
              style={{ 
                color: `${theme.foreground}90`,
                backgroundColor: `${theme.black}40`
              }}
            >
              {process_info.command}
            </div>
          )}
        </div>
      )}
      
      {/* Right side - Additional info and controls */}
      <div className="flex items-center gap-2">
        {process_info && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                style={{ color: `${theme.foreground}80` }}
              >
                <Circle size={8} className="mr-1" />
                Info
                <ChevronDown size={10} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Process Information</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {process_info.pid && (
                <DropdownMenuItem>
                  <Cpu size={14} className="mr-2" />
                  PID: {process_info.pid}
                </DropdownMenuItem>
              )}
              
              {process_info.command && (
                <DropdownMenuItem>
                  <TerminalIcon size={14} className="mr-2" />
                  Command: {process_info.command}
                </DropdownMenuItem>
              )}
              
              {process_info.cpu_usage !== undefined && (
                <DropdownMenuItem>
                  <Cpu size={14} className="mr-2" />
                  CPU: {Math.round(process_info.cpu_usage)}%
                </DropdownMenuItem>
              )}
              
              {process_info.memory_usage !== undefined && (
                <DropdownMenuItem>
                  <HardDrive size={14} className="mr-2" />
                  Memory: {Math.round(process_info.memory_usage)} MB
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem>
                <Clock size={14} className="mr-2" />
                Uptime: {format_uptime(new Date())}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};