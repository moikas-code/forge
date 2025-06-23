import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API for testing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-store', () => ({
  Store: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    keys: vi.fn(),
    length: vi.fn(),
    save: vi.fn(),
  })),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readDir: vi.fn(),
  createDir: vi.fn(),
  removeFile: vi.fn(),
  removeDir: vi.fn(),
  exists: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: vi.fn(() => ({
    execute: vi.fn(),
    spawn: vi.fn(),
  })),
}));

// Mock xterm.js for testing
vi.mock('xterm', () => ({
  Terminal: vi.fn(() => ({
    open: vi.fn(),
    write: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    cols: 80,
    rows: 24,
  })),
}));

vi.mock('xterm-addon-fit', () => ({
  FitAddon: vi.fn(() => ({
    fit: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(() => ({
    dispose: vi.fn(),
  })),
}));

vi.mock('@xterm/addon-clipboard', () => ({
  ClipboardAddon: vi.fn(() => ({
    dispose: vi.fn(),
  })),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Performance tracking utilities for tests
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Add custom matchers for terminal testing
expect.extend({
  toHaveTerminalOutput(received: string, expected: string) {
    const pass = received.includes(expected);
    if (pass) {
      return {
        message: () => `expected "${received}" not to contain "${expected}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected "${received}" to contain "${expected}"`,
        pass: false,
      };
    }
  },
  
  toBeValidTerminalSession(received: any) {
    const hasId = typeof received.id === 'string';
    const hasTitle = typeof received.title === 'string';
    const hasCreatedAt = received.created_at instanceof Date;
    
    const pass = hasId && hasTitle && hasCreatedAt;
    
    if (pass) {
      return {
        message: () => `expected terminal session not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected terminal session to be valid with id, title, and created_at properties`,
        pass: false,
      };
    }
  }
});

// Extend Jest/Vitest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveTerminalOutput(expected: string): R;
      toBeValidTerminalSession(): R;
    }
  }
}

// Console warnings for potential issues
const originalError = console.error;
console.error = (...args: any[]) => {
  // Filter out common React testing warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: useLayoutEffect does nothing on the server'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};