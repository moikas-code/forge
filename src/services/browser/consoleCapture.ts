import { invoke } from '@tauri-apps/api/core';

export interface ConsoleMessage {
  level: string;
  message: string;
  source: string;
  line: number;
  timestamp: number;
}

/**
 * JavaScript code to inject into the iframe/webview for capturing console logs
 */
export const consoleInjectionScript = `
(function() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  const captureMessage = (level, args) => {
    try {
      const message = Array.from(args).map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const error = new Error();
      const stack = error.stack || '';
      const stackLines = stack.split('\\n');
      let source = 'unknown';
      let line = 0;

      // Try to extract source info from stack trace
      if (stackLines.length > 2) {
        const match = stackLines[2].match(/\\((.*?):(\\d+):(\\d+)\\)/);
        if (match) {
          source = match[1].split('/').pop() || 'unknown';
          line = parseInt(match[2], 10);
        }
      }

      // Send to parent window or Tauri
      const msg = {
        type: 'console-message',
        level: level,
        message: message,
        source: source,
        line: line,
        timestamp: Date.now()
      };

      // If in iframe, post to parent
      if (window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
      
      // If Tauri is available, invoke command
      if (window.__TAURI_INTERNALS__) {
        window.__TAURI_INTERNALS__.invoke('add_console_message', msg);
      }
    } catch (e) {
      // Silently fail to avoid infinite loops
    }
  };

  // Override console methods
  console.log = function(...args) {
    captureMessage('log', args);
    originalConsole.log.apply(console, args);
  };

  console.warn = function(...args) {
    captureMessage('warn', args);
    originalConsole.warn.apply(console, args);
  };

  console.error = function(...args) {
    captureMessage('error', args);
    originalConsole.error.apply(console, args);
  };

  console.info = function(...args) {
    captureMessage('info', args);
    originalConsole.info.apply(console, args);
  };

  console.debug = function(...args) {
    captureMessage('debug', args);
    originalConsole.debug.apply(console, args);
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    captureMessage('error', [
      'Uncaught Error:',
      event.message,
      'at',
      event.filename + ':' + event.lineno + ':' + event.colno
    ]);
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureMessage('error', ['Unhandled Promise Rejection:', event.reason]);
  });
})();
`;

/**
 * Inject console capture script into an iframe
 */
export function injectConsoleCapture(iframe: HTMLIFrameElement, onMessage: (msg: ConsoleMessage) => void) {
  try {
    // Listen for messages from the iframe
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console-message') {
        onMessage({
          level: event.data.level,
          message: event.data.message,
          source: event.data.source,
          line: event.data.line,
          timestamp: event.data.timestamp
        });
      }
    };

    window.addEventListener('message', messageHandler);

    // Try to inject the script when iframe loads
    iframe.addEventListener('load', () => {
      try {
        // This will only work for same-origin iframes
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow && iframe.contentDocument) {
          const script = iframe.contentDocument.createElement('script');
          script.textContent = consoleInjectionScript;
          iframe.contentDocument.head.appendChild(script);
        }
      } catch (e) {
        // Cross-origin iframe, can't inject
        console.warn('Cannot inject console capture into cross-origin iframe');
      }
    });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  } catch (e) {
    console.error('Failed to set up console capture:', e);
    return () => {};
  }
}

/**
 * Format console message for display
 */
export function formatConsoleMessage(msg: ConsoleMessage): string {
  const time = new Date(msg.timestamp).toLocaleTimeString();
  return `[${time}] [${msg.level.toUpperCase()}] ${msg.message}`;
}

/**
 * Get console level color class
 */
export function getConsoleLevelClass(level: string): string {
  switch (level.toLowerCase()) {
    case 'error': return 'text-red-500';
    case 'warn': return 'text-yellow-500';
    case 'info': return 'text-blue-500';
    case 'debug': return 'text-gray-500';
    default: return 'text-gray-400';
  }
}