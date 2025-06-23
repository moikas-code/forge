'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  useTerminalStore, 
  type TerminalProfile 
} from '@/stores/terminalStore';
import { TerminalSearchOverlay } from './TerminalSearchOverlay';
import 'xterm/css/xterm.css';
import './Terminal.css';

interface AdvancedTerminalProps {
  className?: string;
  terminal_id?: string;
  pane_id?: string;
  profile?: TerminalProfile;
  onReady?: (terminal_id: string) => void;
}

export function AdvancedTerminal({ 
  className, 
  terminal_id: provided_terminal_id, 
  pane_id,
  profile,
  onReady 
}: AdvancedTerminalProps) {
  const terminal_ref = useRef<HTMLDivElement>(null);
  const container_ref = useRef<HTMLDivElement>(null);
  const xterm_ref = useRef<any>(null);
  const fit_addon_ref = useRef<any>(null);
  const resize_observer_ref = useRef<ResizeObserver | null>(null);
  
  const [terminal_id, set_terminal_id] = useState<string | null>(provided_terminal_id || null);
  const [is_ready, set_is_ready] = useState(false);
  const [show_search, set_show_search] = useState(false);
  
  const unlisten_output_ref = useRef<(() => void) | null>(null);
  const unlisten_exit_ref = useRef<(() => void) | null>(null);
  const unlisten_error_ref = useRef<(() => void) | null>(null);

  // Command history state
  const current_line_ref = useRef<string>('');
  const cursor_position_ref = useRef<number>(0);
  const in_command_input_ref = useRef<boolean>(false);
  
  const {
    add_to_history,
    navigate_history,
    reset_history_index,
    get_profile,
  } = useTerminalStore();

  // Get effective profile
  const effective_profile = profile || get_profile(profile?.id || '');

  useEffect(() => {
    if (!terminal_ref.current) return;

    // Dynamic import to avoid SSR issues
    const init_terminal = async () => {
      const { Terminal: XTerm } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      await import('xterm/css/xterm.css');

      // Initialize terminal instance with macOS-style theme
      const terminal = new XTerm({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 13,
        fontFamily: 'SF Mono, Monaco, Menlo, "Courier New", monospace',
        fontWeight: 'normal',
        fontWeightBold: 'bold',
        lineHeight: 1.2,
        letterSpacing: 0,
        scrollback: 10000,
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

      // Initialize addons
      const fit_addon = new FitAddon();
      const web_links_addon = new WebLinksAddon();
      
      terminal.loadAddon(fit_addon);
      terminal.loadAddon(web_links_addon);

      // Store references
      xterm_ref.current = terminal;
      fit_addon_ref.current = fit_addon;

      // Open terminal in the DOM element
      if (terminal_ref.current) {
        terminal.open(terminal_ref.current);
      }
      
      // Initial fit
      setTimeout(() => {
        fit_addon.fit();
      }, 0);
      
      // Create backend terminal
      await create_backend_terminal(terminal, fit_addon);

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

      // Set up keyboard shortcuts
      terminal.attachCustomKeyEventHandler((e) => {
        // Ctrl+F for search
        if (e.ctrlKey && e.key === 'f' && e.type === 'keydown') {
          e.preventDefault();
          set_show_search(true);
          return false;
        }
        
        // Ctrl+R for reverse search
        if (e.ctrlKey && e.key === 'r' && e.type === 'keydown') {
          e.preventDefault();
          handle_reverse_search();
          return false;
        }

        // History navigation with arrow keys
        if (in_command_input_ref.current && e.type === 'keydown') {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            handle_history_navigation('up');
            return false;
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handle_history_navigation('down');
            return false;
          }
        }

        return true;
      });

      set_is_ready(true);

      // Function to create backend terminal
      async function create_backend_terminal(term: any, fit: any) {
        try {
          // Get terminal dimensions
          const cols = term.cols;
          const rows = term.rows;
          
          // Prepare terminal options with profile
          const terminal_options: any = {
            shell: effective_profile?.shell_path || null,
            cwd: effective_profile?.working_directory || null,
            env: effective_profile?.environment || null,
            size: { rows, cols }
          };

          // Add shell arguments if available
          if (effective_profile?.shell_args) {
            terminal_options.args = effective_profile.shell_args;
          }
          
          // Create terminal in backend
          const response = await invoke<{ terminal_id: string }>('create_terminal', {
            options: terminal_options
          });
          
          const new_terminal_id = response.terminal_id;
          set_terminal_id(new_terminal_id);
          
          if (onReady) {
            onReady(new_terminal_id);
          }
          
          // Set up event listeners
          unlisten_output_ref.current = await listen<{ terminal_id: string; data: number[] }>(
            'terminal-output',
            (event) => {
              if (event.payload.terminal_id === new_terminal_id && xterm_ref.current) {
                const data = new Uint8Array(event.payload.data);
                const text = new TextDecoder().decode(data);
                
                // Track terminal state for command input detection
                track_terminal_state(text);
                
                xterm_ref.current.write(data);
              }
            }
          );
          
          unlisten_exit_ref.current = await listen<{ terminal_id: string; exit_code?: number }>(
            'terminal-exit',
            (event) => {
              if (event.payload.terminal_id === new_terminal_id && xterm_ref.current) {
                xterm_ref.current.write('\r\n[Process exited]\r\n');
              }
            }
          );
          
          unlisten_error_ref.current = await listen<{ terminal_id: string; message: string }>(
            'terminal-error',
            (event) => {
              if (event.payload.terminal_id === new_terminal_id && xterm_ref.current) {
                xterm_ref.current.write(`\r\n[Error: ${event.payload.message}]\r\n`);
              }
            }
          );
          
          // Set up input handler with command history tracking
          term.onData(async (data: string) => {
            if (new_terminal_id) {
              // Track input for command history
              handle_input_data(data);
              
              try {
                const bytes = new TextEncoder().encode(data);
                await invoke('write_to_terminal', {
                  terminalId: new_terminal_id,
                  data: Array.from(bytes)
                });
              } catch (error) {
                console.error('Failed to write to terminal:', error);
              }
            }
          });
          
          // Handle resize
          term.onResize(async ({ cols, rows }: { cols: number; rows: number }) => {
            if (new_terminal_id) {
              try {
                await invoke('resize_terminal', {
                  terminalId: new_terminal_id,
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
  }, [terminal_id, pane_id, effective_profile, onReady]);

  // Track terminal state for command detection
  const track_terminal_state = useCallback((text: string) => {
    // Simple prompt detection - look for common prompt patterns
    const prompt_patterns = [
      /\n.*?[\$\#>\%]\s*$/,  // Basic shell prompts
      /\n.*?:\s*$/,           // Simple colon prompts
    ];

    const has_prompt = prompt_patterns.some(pattern => pattern.test(text));
    
    if (has_prompt) {
      in_command_input_ref.current = true;
      current_line_ref.current = '';
      cursor_position_ref.current = 0;
    }
  }, []);

  // Handle input data for command history
  const handle_input_data = useCallback((data: string) => {
    if (!pane_id || !in_command_input_ref.current) return;

    for (const char of data) {
      if (char === '\r' || char === '\n') {
        // Command submitted
        if (current_line_ref.current.trim()) {
          add_to_history(pane_id, current_line_ref.current.trim());
        }
        reset_history_index(pane_id);
        current_line_ref.current = '';
        cursor_position_ref.current = 0;
        in_command_input_ref.current = false;
      } else if (char === '\x08' || char === '\x7f') {
        // Backspace
        if (cursor_position_ref.current > 0) {
          current_line_ref.current = 
            current_line_ref.current.slice(0, cursor_position_ref.current - 1) +
            current_line_ref.current.slice(cursor_position_ref.current);
          cursor_position_ref.current--;
        }
      } else if (char === '\x03') {
        // Ctrl+C - reset current line
        current_line_ref.current = '';
        cursor_position_ref.current = 0;
        reset_history_index(pane_id);
      } else if (char >= ' ' && char <= '~') {
        // Printable character
        current_line_ref.current = 
          current_line_ref.current.slice(0, cursor_position_ref.current) +
          char +
          current_line_ref.current.slice(cursor_position_ref.current);
        cursor_position_ref.current++;
      }
    }
  }, [pane_id, add_to_history, reset_history_index]);

  // Handle history navigation
  const handle_history_navigation = useCallback((direction: 'up' | 'down') => {
    if (!pane_id || !xterm_ref.current) return;

    const history_command = navigate_history(pane_id, direction);
    
    if (history_command !== null) {
      // Clear current line and write history command
      const terminal = xterm_ref.current;
      
      // Clear the current line
      const clear_line = '\x1b[2K\r';
      terminal.write(clear_line);
      
      // Write the prompt (this is a simplification - real prompts are more complex)
      terminal.write('$ ');
      
      // Write the history command
      terminal.write(history_command);
      
      // Update internal state
      current_line_ref.current = history_command;
      cursor_position_ref.current = history_command.length;
    }
  }, [pane_id, navigate_history]);

  // Handle reverse search (Ctrl+R)
  const handle_reverse_search = useCallback(() => {
    if (!pane_id) return;
    
    // For now, just show the search overlay
    // In a more complete implementation, this would show a special reverse search UI
    set_show_search(true);
  }, [pane_id]);

  return (
    <div 
      ref={container_ref}
      className={`advanced-terminal-container relative ${className || ''}`}
    >
      <div 
        ref={terminal_ref} 
        className="terminal-wrapper h-full"
      />
      
      {/* Search overlay */}
      {show_search && (
        <TerminalSearchOverlay
          terminal_ref={xterm_ref}
          onClose={() => set_show_search(false)}
        />
      )}
      
      <style jsx>{`
        .advanced-terminal-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .terminal-wrapper {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}