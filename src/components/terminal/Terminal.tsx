'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create_terminal_performance_manager, TerminalPerformanceManager, useTerminalPerformanceMetrics } from '@/utils/terminalPerformance';
import { TerminalPerformanceIndicator } from './TerminalPerformanceIndicator';
import 'xterm/css/xterm.css';
import './Terminal.css';
import { get_theme_by_id } from '@/lib/terminal-themes';
import { useTerminalStore } from '@/stores/terminalStore';
import { TerminalWindowChrome } from './TerminalWindowChrome';

interface TerminalActions {
  onClear: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onNewTab?: () => void;
}

interface TerminalProps {
  className?: string;
  terminalId?: string;
  actions?: TerminalActions;
  show_performance_indicator?: boolean;
  performance_debug?: boolean;
  pane_id?: string;
  theme_id?: string;
  show_window_chrome?: boolean;
  title?: string;
  aria_label?: string;
  aria_describedby?: string;
}

export function Terminal({ 
  className, 
  terminalId, 
  actions,
  show_performance_indicator = false,
  performance_debug = false,
  pane_id,
  theme_id,
  show_window_chrome = false,
  title = 'Terminal',
  aria_label,
  aria_describedby
}: TerminalProps) {
  const terminal_ref = useRef<HTMLDivElement>(null);
  const container_ref = useRef<HTMLDivElement>(null);
  const xterm_ref = useRef<any>(null);
  const fit_addon_ref = useRef<any>(null);
  const resize_observer_ref = useRef<ResizeObserver | null>(null);
  const [terminal_id, set_terminal_id] = useState<string | null>(terminalId || null);
  const unlisten_output_ref = useRef<(() => void) | null>(null);
  const unlisten_exit_ref = useRef<(() => void) | null>(null);
  const unlisten_error_ref = useRef<(() => void) | null>(null);
  const performance_manager_ref = useRef<TerminalPerformanceManager | null>(null);
  const actions_ref = useRef<TerminalActions | null>(null);
  
  // Store actions reference to prevent re-initialization on actions change
  actions_ref.current = actions;
  
  // Get terminal store for theme access
  const { sessions } = useTerminalStore();
  
  // Memoize current theme to prevent unnecessary re-calculations
  const current_theme = useMemo(() => {
    let base_theme_id = theme_id || 'default';
    
    // Apply high contrast theme if needed
    if (high_contrast_mode) {
      const base_theme = get_theme_by_id(base_theme_id);
      return {
        ...base_theme,
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#ffffff',
        selectionForeground: '#000000',
        // Enhance ANSI colors for high contrast
        black: '#000000',
        white: '#ffffff',
        red: '#ff4444',
        green: '#44ff44',
        blue: '#4444ff',
        yellow: '#ffff44',
        magenta: '#ff44ff',
        cyan: '#44ffff',
        brightBlack: '#444444',
        brightWhite: '#ffffff',
        brightRed: '#ff6666',
        brightGreen: '#66ff66',
        brightBlue: '#6666ff',
        brightYellow: '#ffff66',
        brightMagenta: '#ff66ff',
        brightCyan: '#66ffff'
      };
    }
    
    return get_theme_by_id(base_theme_id);
  }, [theme_id, high_contrast_mode]);
  
  // Memoize current pane information for window chrome
  const current_pane = useMemo(() => {
    if (!pane_id) return null;
    
    // For now, return basic pane info since the store doesn't have splits/panes structure
    return {
      id: pane_id,
      status: 'idle' as const,
      process_info: null
    };
  }, [pane_id]);
  
  // Get performance metrics for display
  const performance_metrics = useTerminalPerformanceMetrics(performance_manager_ref.current);
  const [selection_text, set_selection_text] = useState<string>('');
  const [feedback_message, set_feedback_message] = useState<string>('');
  const [feedback_type, set_feedback_type] = useState<'success' | 'error' | null>(null);
  const [screen_reader_announcement, set_screen_reader_announcement] = useState<string>('');
  const [high_contrast_mode, set_high_contrast_mode] = useState<boolean>(false);

  // Detect high contrast mode and accessibility preferences
  useEffect(() => {
    const detect_high_contrast = () => {
      if (typeof window !== 'undefined') {
        const media_query = window.matchMedia('(prefers-contrast: high)');
        set_high_contrast_mode(media_query.matches);
        
        const handle_change = (e: MediaQueryListEvent) => {
          set_high_contrast_mode(e.matches);
        };
        
        media_query.addEventListener('change', handle_change);
        return () => media_query.removeEventListener('change', handle_change);
      }
    };
    
    detect_high_contrast();
  }, []);
  
  // Helper function for screen reader announcements
  const announce_to_screen_reader = (message: string) => {
    set_screen_reader_announcement(message);
    // Clear announcement after a short delay to prevent spam
    setTimeout(() => set_screen_reader_announcement(''), 1000);
  };

  // Stable terminal initialization - only depend on essential props
  useEffect(() => {
    if (!terminal_ref.current) return;

    // Dynamic import to avoid SSR issues
    const init_terminal = async () => {
      const { Terminal: XTerm } = await import('xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
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
        background: current_theme.background,
        foreground: current_theme.foreground,
        cursor: current_theme.cursor,
        cursorAccent: current_theme.cursorAccent,
        selectionBackground: current_theme.selectionBackground,
        selectionForeground: current_theme.selectionForeground,
        // ANSI colors from theme
        black: current_theme.black,
        red: current_theme.red,
        green: current_theme.green,
        yellow: current_theme.yellow,
        blue: current_theme.blue,
        magenta: current_theme.magenta,
        cyan: current_theme.cyan,
        white: current_theme.white,
        brightBlack: current_theme.brightBlack,
        brightRed: current_theme.brightRed,
        brightGreen: current_theme.brightGreen,
        brightYellow: current_theme.brightYellow,
        brightBlue: current_theme.brightBlue,
        brightMagenta: current_theme.brightMagenta,
        brightCyan: current_theme.brightCyan,
        brightWhite: current_theme.brightWhite
      },
      // macOS-style options
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      rightClickSelectsWord: true,
      // Accessibility options
      screenReaderMode: true,
      tabStopWidth: 4,
      // Enhanced for screen readers
      convertEol: true
      });

      // Initialize addons with performance optimizations
      const fit_addon = new FitAddon();
      const web_links_addon = new WebLinksAddon();
      
      // Load performance addons first
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
      
      terminal.loadAddon(fit_addon);
      terminal.loadAddon(web_links_addon);
      
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
      
      // Terminal action handlers
      const handle_clear = () => {
        if (terminal) {
          terminal.clear();
          show_feedback('Terminal cleared', 'success');
        }
      };
      
      const handle_copy = async () => {
        if (!terminal) return;
        
        const selection = terminal.getSelection();
        if (!selection) {
          show_feedback('No text selected', 'error');
          return;
        }
        
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(selection);
            show_feedback('Copied to clipboard', 'success');
          } else {
            // Fallback for older browsers
            const text_area = document.createElement('textarea');
            text_area.value = selection;
            text_area.style.position = 'fixed';
            text_area.style.opacity = '0';
            document.body.appendChild(text_area);
            text_area.select();
            document.execCommand('copy');
            document.body.removeChild(text_area);
            show_feedback('Copied to clipboard', 'success');
          }
        } catch (error) {
          console.error('Failed to copy text:', error);
          show_feedback('Failed to copy text', 'error');
        }
      };
      
      let current_terminal_id: string | null = null;
      
      const handle_paste = async () => {
        if (!terminal) return;
        
        try {
          let text_to_paste = '';
          
          if (navigator.clipboard && navigator.clipboard.readText) {
            text_to_paste = await navigator.clipboard.readText();
          } else {
            // Fallback - prompt user to paste manually
            show_feedback('Press Ctrl+V to paste', 'error');
            return;
          }
          
          if (text_to_paste && current_terminal_id) {
            // Send paste data to backend terminal
            const bytes = new TextEncoder().encode(text_to_paste);
            await invoke('write_to_terminal', {
              terminalId: current_terminal_id,
              data: Array.from(bytes)
            });
            show_feedback('Pasted from clipboard', 'success');
          }
        } catch (error) {
          console.error('Failed to paste text:', error);
          show_feedback('Failed to paste text', 'error');
        }
      };
      
      const handle_new_tab = () => {
        if (actions?.onNewTab) {
          actions.onNewTab();
          show_feedback('New tab created', 'success');
        }
      };
      
      const show_feedback = (message: string, type: 'success' | 'error') => {
        set_feedback_message(message);
        set_feedback_type(type);
        setTimeout(() => {
          set_feedback_message('');
          set_feedback_type(null);
        }, 2000);
      };

      // Set up selection change handler
      terminal.onSelectionChange(() => {
        const selection = terminal.getSelection();
        set_selection_text(selection);
      });

      // Open terminal in the DOM element
      if (terminal_ref.current) {
        terminal.open(terminal_ref.current);
        
        // Focus the terminal after it's opened
        setTimeout(() => {
          terminal.focus();
        }, 100);
      }
      
      // Initial fit
      setTimeout(() => {
        fit_addon.fit();
      }, 100);
      
      // Set up keyboard shortcuts
      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        const is_cmd_or_ctrl = e.metaKey || e.ctrlKey;
        
        if (is_cmd_or_ctrl) {
          switch (e.key.toLowerCase()) {
            case 'k':
              e.preventDefault();
              handle_clear();
              return false;
            case 'c':
              if (terminal.hasSelection()) {
                e.preventDefault();
                handle_copy();
                return false;
              }
              break;
            case 'v':
              e.preventDefault();
              handle_paste();
              return false;
            case 't':
              e.preventDefault();
              handle_new_tab();
              return false;
          }
        }
        return true;
      });
      
      // Create backend terminal
      create_backend_terminal(terminal, fit_addon);

      // Set up resize observer
      resize_observer_ref.current = new ResizeObserver(() => {
        if (fit_addon_ref.current && xterm_ref.current) {
          fit_addon_ref.current.fit();
        }
      });

      if (container_ref.current) {
        resize_observer_ref.current.observe(container_ref.current);
      }

      // Handle window resize
      const handle_resize = () => {
        if (fit_addon_ref.current && xterm_ref.current) {
          fit_addon_ref.current.fit();
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
        current_terminal_id = response.terminal_id;
        
        // Set up event listeners
        unlisten_output_ref.current = await listen<{ terminal_id: string; data: number[] }>(
          'terminal-output',
          (event) => {
            if (event.payload.terminal_id === response.terminal_id && xterm_ref.current) {
              const data = new Uint8Array(event.payload.data);
              
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
        
        // Set up input handler
        term.onData(async (data: string) => {
          if (response.terminal_id) {
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

      // Expose terminal actions to parent component using ref
      if (actions_ref.current) {
        actions_ref.current.onClear = handle_clear;
        actions_ref.current.onCopy = handle_copy;
        actions_ref.current.onPaste = handle_paste;
        if (actions_ref.current.onNewTab) {
          actions_ref.current.onNewTab = handle_new_tab;
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
  }, [terminalId, theme_id, pane_id]); // Only depend on stable identifiers

  return (
    <div 
      ref={container_ref}
      className={`terminal-container ${className || ''} relative flex flex-col`}
      style={{ backgroundColor: current_theme.background }}
      role="application"
      aria-label={aria_label || `Terminal ${title}`}
      aria-describedby={aria_describedby || `${terminalId}-instructions`}
      tabIndex={0}
      onFocus={() => {
        // When container gains focus, focus the terminal
        if (xterm_ref.current) {
          xterm_ref.current.focus();
        }
      }}
    >
      {/* Window chrome */}
      {show_window_chrome && (
        <TerminalWindowChrome
          title={title}
          status={current_pane?.status || 'idle'}
          process_info={current_pane?.process_info}
          theme_id={theme_id}
          is_focused={true}
          show_traffic_lights={true}
          show_process_info={true}
        />
      )}
      
      {/* Performance indicator */}
      {show_performance_indicator && (
        <div className="absolute top-2 left-2 z-10">
          <TerminalPerformanceIndicator 
            metrics={performance_metrics}
            show_details={performance_debug}
          />
        </div>
      )}
      
      <div 
        ref={terminal_ref} 
        className={`terminal-wrapper ${show_window_chrome ? 'flex-1' : ''}`}
        onClick={() => {
          // Ensure terminal gets focus when clicked
          if (xterm_ref.current) {
            xterm_ref.current.focus();
          }
        }}
      />
      
      {/* Feedback message */}
      {feedback_message && (
        <div 
          className={`absolute top-2 right-2 px-3 py-2 rounded-md text-sm font-medium z-50 animate-in fade-in-0 zoom-in-95 duration-150 ${
            feedback_type === 'success' 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
          }`}
          role="alert"
          aria-live="polite"
        >
          {feedback_message}
        </div>
      )}
      
      {/* Screen reader announcements */}
      {screen_reader_announcement && (
        <div 
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {screen_reader_announcement}
        </div>
      )}
      
      {/* Accessibility instructions (hidden, shown to screen readers) */}
      <div 
        id={`${terminalId}-instructions`}
        className="sr-only"
      >
        Terminal window. Use arrow keys to navigate output. 
        Press Ctrl+C to copy selection, Ctrl+V to paste. 
        Press Ctrl+K to clear terminal. 
        Press Ctrl+F to search. 
        Status: {current_pane?.status || 'idle'}.
        {current_pane?.process_info?.command && ` Running: ${current_pane.process_info.command}.`}
      </div>
    </div>
  );
}