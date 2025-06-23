'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useLayoutStore } from '../../stores/layoutStore';
import { useTerminalPersistenceStore } from '@/stores/terminalPersistenceStore';
import { parseCommand, isCustomCommand, executeCommand, CommandContext } from '../../utils/terminalCommands';
import { create_terminal_performance_manager, TerminalPerformanceManager, useTerminalPerformanceMetrics } from '@/utils/terminalPerformance';
import { TerminalPerformanceIndicator } from './TerminalPerformanceIndicator';
import { CommandPalette } from './CommandPalette';
import 'xterm/css/xterm.css';
import './Terminal.css';

interface EnhancedTerminalProps {
  className?: string;
  show_performance_indicator?: boolean;
  performance_debug?: boolean;
}

export function EnhancedTerminal({ 
  className,
  show_performance_indicator = false,
  performance_debug = false 
}: EnhancedTerminalProps) {
  const terminal_ref = useRef<HTMLDivElement>(null);
  const container_ref = useRef<HTMLDivElement>(null);
  const xterm_ref = useRef<any>(null);
  const fit_addon_ref = useRef<any>(null);
  const resize_observer_ref = useRef<ResizeObserver | null>(null);
  const [terminal_id, set_terminal_id] = useState<string | null>(null);
  const unlisten_output_ref = useRef<(() => void) | null>(null);
  const unlisten_exit_ref = useRef<(() => void) | null>(null);
  const unlisten_error_ref = useRef<(() => void) | null>(null);
  const performance_manager_ref = useRef<TerminalPerformanceManager | null>(null);
  
  // Get performance metrics for display
  const performance_metrics = useTerminalPerformanceMetrics(performance_manager_ref.current);
  
  // Command buffering
  const command_buffer_ref = useRef<string>('');
  const current_line_ref = useRef<string>('');
  const [current_directory, set_current_directory] = useState<string>('~');
  
  // Get addTab from layout store with stable reference
  const addTab = useLayoutStore(state => state.addTab);
  const addTab_ref = useRef(addTab);
  addTab_ref.current = addTab;
  
  // Get command palette state
  const {
    is_command_palette_open,
    toggle_command_palette,
    close_command_palette,
  } = useTerminalPersistenceStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + Shift + P
      if (e.key === 'P' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle_command_palette();
      }
    };

    document.addEventListener('keydown', handle_keydown);
    return () => document.removeEventListener('keydown', handle_keydown);
  }, [toggle_command_palette]);

  useEffect(() => {
    if (!terminal_ref.current) return;

    // Dynamic import to avoid SSR issues
    const init_terminal = async () => {
      const { Terminal: XTerm } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      await import('xterm/css/xterm.css');

      // Initialize terminal instance with macOS-style theme and performance optimizations
      const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: 'SF Mono, Monaco, Menlo, "Courier New", monospace',
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      lineHeight: 1.2,
      letterSpacing: 0,
      scrollback: 10000, // Will be managed by performance manager
      allowProposedApi: true, // Enable performance features
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#c7c7c7',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#456ca0',
        selectionForeground: '#ffffff',
        // ANSI colors matching macOS Terminal
        black: '#000000',
        red: '#c91b00',
        green: '#00c200',
        yellow: '#c7c400',
        blue: '#0225c7',
        magenta: '#c930c7',
        cyan: '#00c5c7',
        white: '#c7c7c7',
        brightBlack: '#676767',
        brightRed: '#ff6e67',
        brightGreen: '#5ff967',
        brightYellow: '#fefb67',
        brightBlue: '#6871ff',
        brightMagenta: '#ff76ff',
        brightCyan: '#5ffdff',
        brightWhite: '#feffff'
      },
      // macOS-style options
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      rightClickSelectsWord: true
    });

    // Initialize addons with performance optimizations
    const fit_addon = new FitAddon();
    const web_links_addon = new WebLinksAddon();
    
    // Load performance addons first - but load basic addons first
    terminal.loadAddon(fit_addon);
    terminal.loadAddon(web_links_addon);
    
    // Then try to load performance renderers
    try {
      const { WebglAddon } = await import('@xterm/addon-webgl');
      const webgl_addon = new WebglAddon();
      terminal.loadAddon(webgl_addon);
      console.log('WebGL renderer loaded for better performance');
    } catch (error) {
      console.log('WebGL not available, trying Canvas renderer');
      try {
        const { CanvasAddon } = await import('@xterm/addon-canvas');
        const canvas_addon = new CanvasAddon();
        terminal.loadAddon(canvas_addon);
        console.log('Canvas renderer loaded');
      } catch (canvas_error) {
        console.log('Using default DOM renderer');
      }
    }
    
    // Initialize performance manager
    performance_manager_ref.current = create_terminal_performance_manager(terminal, {
      debug: performance_debug,
      buffer: {
        max_lines: 10000,
        trim_threshold: 0.8,
        trim_lines: 1000,
      },
      throttle: {
        debounce_ms: 16, // 60fps
        max_chunk_size: 1000,
        high_volume_threshold: 100,
      },
      memory: {
        max_memory_mb: 100,
        warning_threshold: 0.8,
      },
    });

    // Store references
    xterm_ref.current = terminal;
    fit_addon_ref.current = fit_addon;

    // Open terminal in the DOM element
    if (terminal_ref.current) {
      terminal.open(terminal_ref.current);
    }
    
    // Initial fit with safety checks
    setTimeout(() => {
      try {
        if (fit_addon && terminal && terminal_ref.current && terminal_ref.current.offsetWidth > 0) {
          fit_addon.fit();
        }
      } catch (error) {
        console.warn('Initial fit failed:', error);
        // Retry after a brief delay
        setTimeout(() => {
          try {
            if (fit_addon && terminal) {
              fit_addon.fit();
            }
          } catch (retry_error) {
            console.warn('Retry fit failed:', retry_error);
          }
        }, 100);
      }
    }, 0);
    
    // Create backend terminal
    create_backend_terminal(terminal, fit_addon);

    // Set up resize observer with safety checks
    resize_observer_ref.current = new ResizeObserver(() => {
      try {
        if (fit_addon_ref.current && xterm_ref.current && container_ref.current) {
          // Check if container has dimensions
          const rect = container_ref.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fit_addon_ref.current.fit();
          }
        }
      } catch (error) {
        console.warn('Resize observer fit failed:', error);
      }
    });

    if (container_ref.current) {
      resize_observer_ref.current.observe(container_ref.current);
    }

    // Handle window resize with safety checks
    const handle_resize = () => {
      try {
        if (fit_addon_ref.current && xterm_ref.current && container_ref.current) {
          const rect = container_ref.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fit_addon_ref.current.fit();
          }
        }
      } catch (error) {
        console.warn('Window resize fit failed:', error);
      }
    };
    
    window.addEventListener('resize', handle_resize);

    // Function to create backend terminal
    async function create_backend_terminal(term: any, fit: any) {
      try {
        // Get terminal dimensions
        const cols = term.cols;
        const rows = term.rows;
        
        // Create terminal in backend
        const response = await invoke<{ terminal_id: string }>('create_terminal', {
          options: {
            shell: null,
            cwd: null,
            env: null,
            size: { rows, cols }
          }
        });
        
        set_terminal_id(response.terminal_id);
        
        // Show welcome message with available commands
        term.write('\r\n\x1b[1;36mForge MOI Terminal\x1b[0m\r\n');
        term.write('Type \x1b[1;33mhelp\x1b[0m to see available IDE commands\r\n\r\n');
        
        // Set up event listeners
        unlisten_output_ref.current = await listen<{ terminal_id: string; data: number[] }>(
          'terminal-output',
          (event) => {
            if (event.payload.terminal_id === response.terminal_id && xterm_ref.current) {
              const data = new Uint8Array(event.payload.data);
              const text = new TextDecoder().decode(data);
              
              // Track current line for command detection
              for (const char of text) {
                if (char === '\n' || char === '\r') {
                  // Line ended, check if it's a command
                  if (current_line_ref.current.trim()) {
                    handle_potential_command(current_line_ref.current);
                  }
                  current_line_ref.current = '';
                } else if (char === '\x08' || char === '\x7f') {
                  // Backspace
                  current_line_ref.current = current_line_ref.current.slice(0, -1);
                } else if (char >= ' ' && char <= '~') {
                  // Printable character
                  current_line_ref.current += char;
                }
              }
              
              // Update current directory from prompt if possible
              const prompt_match = text.match(/\n.*?([~\/][^\s]*?)[\$\#]\s*$/);
              if (prompt_match) {
                set_current_directory(prompt_match[1]);
              }
              
              // Use performance manager for optimized output
              if (performance_manager_ref.current) {
                performance_manager_ref.current.write(data);
              } else {
                xterm_ref.current.write(data);
              }
            }
          }
        );
        
        unlisten_exit_ref.current = await listen<{ terminal_id: string; exit_code?: number }>(
          'terminal-exit',
          (event) => {
            if (event.payload.terminal_id === response.terminal_id && xterm_ref.current) {
              xterm_ref.current.write('\r\n[Process exited]\r\n');
            }
          }
        );
        
        unlisten_error_ref.current = await listen<{ terminal_id: string; message: string }>(
          'terminal-error',
          (event) => {
            if (event.payload.terminal_id === response.terminal_id && xterm_ref.current) {
              xterm_ref.current.write(`\r\n[Error: ${event.payload.message}]\r\n`);
            }
          }
        );
        
        // Set up input handler with command interception
        term.onData(async (data: string) => {
          if (response.terminal_id) {
            // Track typed characters for command detection
            for (const char of data) {
              if (char === '\r' || char === '\n') {
                // Enter pressed - check if it's a custom command
                const parsed = parseCommand(command_buffer_ref.current);
                if (parsed && isCustomCommand(parsed.command)) {
                  // It's a custom command - intercept it
                  const context: CommandContext = {
                    addTab: (tab) => addTab_ref.current(tab as any),
                    writeToTerminal: (message) => term.write(message),
                    getCurrentDirectory: () => current_directory
                  };
                  
                  // Execute the command
                  await executeCommand(parsed, context);
                  
                  // Clear the command buffer
                  command_buffer_ref.current = '';
                  
                  // Don't send to the actual terminal
                  return;
                }
                
                // Not a custom command, clear buffer and proceed normally
                command_buffer_ref.current = '';
              } else if (char === '\x08' || char === '\x7f') {
                // Backspace
                command_buffer_ref.current = command_buffer_ref.current.slice(0, -1);
              } else if (char === '\x03') {
                // Ctrl+C - clear buffer
                command_buffer_ref.current = '';
              } else if (char >= ' ' && char <= '~') {
                // Printable character
                command_buffer_ref.current += char;
              }
            }
            
            // Send data to backend terminal
            try {
              const bytes = new TextEncoder().encode(data);
              await invoke('write_to_terminal', {
                terminalId: response.terminal_id,
                data: Array.from(bytes)
              });
            } catch (error) {
              console.error('Failed to write to terminal:', error);
            }
          }
        });
        
        // Handle resize
        term.onResize(async ({ cols, rows }: { cols: number; rows: number }) => {
          if (response.terminal_id) {
            try {
              await invoke('resize_terminal', {
                terminalId: response.terminal_id,
                size: { rows, cols }
              });
            } catch (error) {
              console.error('Failed to resize terminal:', error);
            }
          }
        });
        
      } catch (error) {
        console.error('Failed to create terminal:', error);
        term.write('\r\n[Failed to create terminal]\r\n');
      }
    }
    
    // Function to handle potential commands from output
    function handle_potential_command(line: string) {
      // Extract command from line (remove prompt)
      const command_match = line.match(/[\$\#]\s*(.+)$/);
      if (command_match) {
        command_buffer_ref.current = command_match[1];
      }
      }

      // Return cleanup function from async init
      return () => {
        window.removeEventListener('resize', handle_resize);
        
        if (resize_observer_ref.current) {
          resize_observer_ref.current.disconnect();
          resize_observer_ref.current = null;
        }
        
        // Clean up event listeners
        if (unlisten_output_ref.current) {
          unlisten_output_ref.current();
        }
        if (unlisten_exit_ref.current) {
          unlisten_exit_ref.current();
        }
        if (unlisten_error_ref.current) {
          unlisten_error_ref.current();
        }
        
        // Clean up performance manager
        if (performance_manager_ref.current) {
          performance_manager_ref.current.dispose();
          performance_manager_ref.current = null;
        }
        
        // Close backend terminal
        if (terminal_id) {
          invoke('close_terminal', { terminalId: terminal_id }).catch(console.error);
        }
        
        if (web_links_addon) {
          web_links_addon.dispose();
        }
        if (fit_addon) {
          fit_addon.dispose();
        }
        if (terminal) {
          terminal.dispose();
        }
        
        xterm_ref.current = null;
        fit_addon_ref.current = null;
      };
    };

    // Initialize terminal
    const cleanup = init_terminal();

    // Return cleanup function
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []); // Empty dependency array - terminal should only initialize once

  return (
    <>
      <div 
        ref={container_ref}
        className={`terminal-container ${className || ''}`}
      >
        <div 
          ref={terminal_ref} 
          className="terminal-wrapper"
        />
        
        {/* Performance Indicator */}
        {show_performance_indicator && (
          <div className="absolute top-2 right-2 z-10">
            <TerminalPerformanceIndicator
              metrics={performance_metrics}
              show_details={performance_debug}
            />
          </div>
        )}
      </div>
      
      {/* Command Palette Overlay */}
      <CommandPalette
        is_open={is_command_palette_open}
        on_close={close_command_palette}
      />
    </>
  );
}