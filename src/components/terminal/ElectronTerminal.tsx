'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getTerminalService, isElectron } from '@/services/electron';
import { create_terminal_performance_manager, TerminalPerformanceManager } from '@/utils/terminalPerformance';
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
  pane_id?: string;
  theme_id?: string;
  show_window_chrome?: boolean;
  title?: string;
  aria_label?: string;
  aria_describedby?: string;
  autoFocus?: boolean;
}

export function ElectronTerminal({ 
  className, 
  terminalId, 
  actions,
  pane_id,
  theme_id,
  show_window_chrome = false,
  title = 'Terminal',
  aria_label,
  aria_describedby,
  autoFocus = false
}: TerminalProps) {
  const terminal_ref = useRef<HTMLDivElement>(null);
  const container_ref = useRef<HTMLDivElement>(null);
  const xterm_ref = useRef<any>(null);
  const fit_addon_ref = useRef<any>(null);
  const resize_observer_ref = useRef<ResizeObserver | null>(null);
  const [terminal_id, set_terminal_id] = useState<string | null>(terminalId || null);
  const session_id_ref = useRef<string | null>(null);
  const performance_manager_ref = useRef<TerminalPerformanceManager | null>(null);
  const actions_ref = useRef<TerminalActions | null>(null);
  const terminal_service_ref = useRef(getTerminalService());
  
  // Store actions reference to prevent re-initialization on actions change
  actions_ref.current = actions || null;
  
  // Get terminal store for theme access
  const { sessions } = useTerminalStore();
  
  // State for accessibility and high contrast mode
  const [high_contrast_mode, set_high_contrast_mode] = useState<boolean>(false);
  
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
  
  const initialize_terminal = useCallback(async () => {
    if (!isElectron()) {
      console.error('[ElectronTerminal] Not running in Electron environment');
      return;
    }
    
    try {
      const Terminal = (await import('xterm')).Terminal;
      const FitAddon = (await import('@xterm/addon-fit')).FitAddon;
      const WebLinksAddon = (await import('@xterm/addon-web-links')).WebLinksAddon;
      const SearchAddon = (await import('@xterm/addon-search')).SearchAddon;
      const CanvasAddon = (await import('@xterm/addon-canvas')).CanvasAddon;
      const ClipboardAddon = (await import('@xterm/addon-clipboard')).ClipboardAddon;
      
      // Performance tracking will be initialized after terminal is created
      
      // Create Electron terminal session
      const session = await terminal_service_ref.current.create({
        cols: 80,
        rows: 24
      });
      
      set_terminal_id(session.id);
      session_id_ref.current = session.id;
      
      console.log('[ElectronTerminal] Created terminal session:', session.id);
      
      // Initialize xterm
      const term = new Terminal({
        allowProposedApi: true,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        cursorInactiveStyle: 'none',
        scrollback: 10000,
        theme: current_theme,
        // Performance settings
        fastScrollModifier: 'ctrl',
        fastScrollSensitivity: 5,
        scrollSensitivity: 1,
        windowsMode: navigator.userAgent.includes('Windows'),
        // Accessibility
        screenReaderMode: false
      });
      
      xterm_ref.current = term;
      
      // Create performance manager now that terminal is initialized
      performance_manager_ref.current = create_terminal_performance_manager(term, {
        debug: true
      });
      
      // Add addons
      const fit_addon = new FitAddon();
      fit_addon_ref.current = fit_addon;
      term.loadAddon(fit_addon);
      
      term.loadAddon(new WebLinksAddon());
      term.loadAddon(new SearchAddon());
      
      // Use Canvas renderer for better performance
      const canvas_addon = new CanvasAddon();
      term.loadAddon(canvas_addon);
      
      // Enable clipboard support
      const clipboard_addon = new ClipboardAddon();
      term.loadAddon(clipboard_addon);
      
      // Open terminal
      if (terminal_ref.current) {
        console.log('[ElectronTerminal] Opening terminal in DOM element');
        term.open(terminal_ref.current);
        console.log('[ElectronTerminal] Terminal opened, rows:', term.rows, 'cols:', term.cols);
        
        // Fit terminal after opening
        setTimeout(() => {
          if (fit_addon_ref.current) {
            console.log('[ElectronTerminal] Fitting terminal to container');
            fit_addon_ref.current.fit();
            console.log('[ElectronTerminal] Terminal fitted, new size - rows:', term.rows, 'cols:', term.cols);
          }
          // Focus terminal if autoFocus is true
          if (autoFocus && xterm_ref.current) {
            xterm_ref.current.focus();
          }
        }, 0);
      } else {
        console.error('[ElectronTerminal] No terminal DOM element found!');
      }
      
      // Set up terminal event handlers
      term.onData((data) => {
        const currentSessionId = session_id_ref.current || terminal_id;
        if (currentSessionId) {
          console.log('[ElectronTerminal] Writing data to terminal:', currentSessionId, 'data length:', data.length);
          terminal_service_ref.current.write(currentSessionId, data);
        } else {
          console.error('[ElectronTerminal] No session ID available for writing data');
        }
      });
      
      term.onResize((size) => {
        const currentSessionId = session_id_ref.current || terminal_id;
        if (currentSessionId) {
          terminal_service_ref.current.resize(currentSessionId, size.cols, size.rows);
        }
      });
      
      // Set up Electron event listeners BEFORE opening terminal
      terminal_service_ref.current.onData(session.id, (data) => {
        console.log('[ElectronTerminal] Received data from backend:', data.length, 'bytes');
        if (xterm_ref.current && !xterm_ref.current.disposed) {
          // Temporarily bypass performance manager to ensure basic functionality
          console.log('[ElectronTerminal] Writing directly to xterm (bypassing performance manager)');
          const decoder = new TextDecoder();
          const text = decoder.decode(data);
          console.log('[ElectronTerminal] Decoded text:', JSON.stringify(text.substring(0, 100)));
          try {
            xterm_ref.current.write(text);
            console.log('[ElectronTerminal] Successfully wrote to xterm');
          } catch (error) {
            console.error('[ElectronTerminal] Error writing to xterm:', error);
          }
        } else {
          console.error('[ElectronTerminal] xterm not available or disposed');
        }
      });
      
      terminal_service_ref.current.onExit(session.id, (exitCode) => {
        if (xterm_ref.current && !xterm_ref.current.disposed) {
          xterm_ref.current.write(`\r\n[Process exited with code ${exitCode}]\r\n`);
        }
      });
      
      // For now, just set the terminal ID from the Electron session
      // The terminalStore seems to be designed for a different purpose
      // We'll use the Electron session ID directly
      
    } catch (error) {
      console.error('[ElectronTerminal] Failed to initialize:', error);
    }
  }, [terminal_id, pane_id, theme_id, title, current_theme, autoFocus]);
  
  // Initialize terminal on mount
  useEffect(() => {
    initialize_terminal();
    
    return () => {
      if (performance_manager_ref.current) {
        performance_manager_ref.current.dispose();
      }
      if (xterm_ref.current && !xterm_ref.current.disposed) {
        xterm_ref.current.dispose();
      }
      if (resize_observer_ref.current) {
        resize_observer_ref.current.disconnect();
      }
      const sessionToClose = session_id_ref.current || terminal_id;
      if (sessionToClose) {
        terminal_service_ref.current.close(sessionToClose);
      }
    };
  }, []);
  
  // Handle resize
  useEffect(() => {
    if (!container_ref.current || !fit_addon_ref.current) return;
    
    const handle_resize = () => {
      if (fit_addon_ref.current && xterm_ref.current && !xterm_ref.current.disposed) {
        fit_addon_ref.current.fit();
      }
    };
    
    resize_observer_ref.current = new ResizeObserver(handle_resize);
    resize_observer_ref.current.observe(container_ref.current);
    
    // Initial fit
    handle_resize();
    
    return () => {
      if (resize_observer_ref.current) {
        resize_observer_ref.current.disconnect();
      }
    };
  }, []);
  
  // Update theme
  useEffect(() => {
    if (xterm_ref.current && !xterm_ref.current.disposed) {
      xterm_ref.current.options.theme = current_theme;
    }
  }, [current_theme]);
  
  // Handle actions
  useEffect(() => {
    if (!actions || !xterm_ref.current || xterm_ref.current.disposed) return;
    
    actions.onClear = () => {
      if (xterm_ref.current && !xterm_ref.current.disposed) {
        xterm_ref.current.clear();
      }
    };
    
    actions.onCopy = () => {
      if (xterm_ref.current && !xterm_ref.current.disposed) {
        const selection = xterm_ref.current.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
        }
      }
    };
    
    actions.onPaste = async () => {
      if (xterm_ref.current && !xterm_ref.current.disposed) {
        try {
          const text = await navigator.clipboard.readText();
          const currentSessionId = session_id_ref.current || terminal_id;
          if (text && currentSessionId) {
            terminal_service_ref.current.write(currentSessionId, text);
          }
        } catch (err) {
          console.error('Failed to paste:', err);
        }
      }
    };
  }, [actions, terminal_id]);
  
  // Handle high contrast mode
  useEffect(() => {
    const media_query = window.matchMedia('(prefers-contrast: high)');
    const handle_change = (e: MediaQueryListEvent | MediaQueryList) => {
      set_high_contrast_mode(e.matches);
    };
    
    // Check initial value
    handle_change(media_query);
    
    // Listen for changes
    media_query.addEventListener('change', handle_change);
    
    return () => {
      media_query.removeEventListener('change', handle_change);
    };
  }, []);
  
  return (
    <div 
      ref={container_ref} 
      className={`terminal-container h-full bg-gray-900 flex flex-col ${className || ''}`}
      role="region"
      aria-label={aria_label || `Terminal ${terminal_id || ''}`}
      aria-describedby={aria_describedby}
    >
      {show_window_chrome && (
        <TerminalWindowChrome 
          title={title} 
          status="running"
          on_close={() => {
            const currentSessionId = session_id_ref.current || terminal_id;
            if (currentSessionId) {
              terminal_service_ref.current.close(currentSessionId);
            }
          }}
        />
      )}
      <div 
        ref={terminal_ref} 
        className="terminal-wrapper flex-1"
        role="application"
        aria-label="Terminal emulator"
      />
    </div>
  );
}