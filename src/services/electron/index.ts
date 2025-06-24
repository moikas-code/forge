// Main entry point for Electron API services
export * from './terminal';
export * from './filesystem';
export * from './browser';
export * from './store';
export * from './system';
export * from './window';

// Type definitions for the Electron API
export interface ElectronAPI {
  terminal: {
    create: (options?: TerminalOptions) => Promise<TerminalInfo>;
    write: (id: string, data: Uint8Array) => Promise<boolean>;
    resize: (id: string, cols: number, rows: number) => Promise<boolean>;
    close: (id: string) => Promise<boolean>;
    onData: (callback: (data: TerminalData) => void) => void;
    onExit: (callback: (data: TerminalExit) => void) => void;
    getSessionInfo: (id: string) => Promise<TerminalSessionInfo>;
    getHistory: (id: string) => Promise<string[]>;
    getCwd: (id: string) => Promise<string>;
    testSSH: (options: SSHOptions) => Promise<boolean>;
  };
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<boolean>;
    exists: (path: string) => Promise<boolean>;
    getInfo: (path: string) => Promise<FileInfo>;
    createFile: (path: string, content?: string) => Promise<FileInfo>;
    deleteFile: (path: string) => Promise<boolean>;
    rename: (from: string, to: string) => Promise<FileInfo>;
    copy: (from: string, to: string) => Promise<FileInfo>;
    listDirectory: (path: string) => Promise<FileInfo[]>;
    watchFile: (path: string) => Promise<boolean>;
    unwatchFile: (path: string) => Promise<boolean>;
    createBackup: (path: string) => Promise<string>;
    restoreBackup: (backupPath: string, targetPath: string) => Promise<boolean>;
    onFileChange: (callback: (data: FileChangeEvent) => void) => void;
  };
  browser: {
    create: (options?: BrowserOptions) => Promise<BrowserInfo>;
    navigate: (id: string, url: string) => Promise<boolean>;
    goBack: (id: string) => Promise<boolean>;
    goForward: (id: string) => Promise<boolean>;
    refresh: (id: string) => Promise<boolean>;
    close: (id: string) => Promise<boolean>;
    setBounds: (id: string, bounds: BrowserBounds) => Promise<boolean>;
    show: (id: string) => Promise<boolean>;
    hide: (id: string) => Promise<boolean>;
    openDevTools: (id: string) => Promise<boolean>;
    closeDevTools: (id: string) => Promise<boolean>;
    captureScreenshot: (id: string) => Promise<string>;
    captureRegion: (id: string, rect: { x: number; y: number; width: number; height: number }) => Promise<string>;
    saveScreenshot: (id: string, filePath: string) => Promise<string>;
    startRecording: (id: string) => Promise<{ sourceId: string; bounds: BrowserBounds }>;
    stopRecording: (id: string) => Promise<{ duration: number }>;
    getRecordingStatus: (id: string) => Promise<boolean>;
    getUrl: (id: string) => Promise<string>;
    getTitle: (id: string) => Promise<string>;
    canGoBack: (id: string) => Promise<boolean>;
    canGoForward: (id: string) => Promise<boolean>;
    onNavigate: (callback: (data: BrowserNavigateEvent) => void) => void;
    onTitleUpdate: (callback: (data: BrowserTitleEvent) => void) => void;
    onLoadStart: (callback: (data: BrowserLoadEvent) => void) => void;
    onLoadStop: (callback: (data: BrowserLoadEvent) => void) => void;
    onNewTabRequest: (callback: (data: BrowserNewTabEvent) => void) => void;
  };
  editor: {
    saveSession: (sessionData: EditorSession) => Promise<string>;
    loadSession: (sessionId: string) => Promise<EditorSession>;
    listSessions: () => Promise<EditorSession[]>;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<boolean>;
  };
  system: {
    openExternal: (url: string) => Promise<boolean>;
    showItemInFolder: (path: string) => Promise<boolean>;
    getPath: (name: PathName) => Promise<string>;
  };
  window: {
    minimize: () => Promise<boolean>;
    maximize: () => Promise<boolean>;
    unmaximize: () => Promise<boolean>;
    close: () => Promise<boolean>;
    isMaximized: () => Promise<boolean>;
    setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
  };
  removeAllListeners: (channel: string) => void;
}

// Type definitions
export interface TerminalOptions {
  id?: string;
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
}

export interface TerminalInfo {
  id: string;
  shell: string;
  cwd: string;
}

export interface TerminalData {
  terminalId: string;
  data: number[];
}

export interface TerminalExit {
  terminalId: string;
  exitCode: number;
}

export interface TerminalSessionInfo {
  id: string;
  shell: string;
  cwd: string;
  environment: Record<string, string>;
  isRunning: boolean;
  cols: number;
  rows: number;
}

export interface SSHOptions {
  host: string;
  port?: number;
  username: string;
  keyPath?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: number;
  extension: string;
}

export interface FileChangeEvent {
  path: string;
  type: 'modified' | 'deleted' | 'created';
}

export interface BrowserOptions {
  id?: string;
  url?: string;
  bounds?: BrowserBounds;
  hidden?: boolean;
}

export interface BrowserInfo {
  id: string;
  url: string;
}

export interface BrowserBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserNavigateEvent {
  id: string;
  url: string;
}

export interface BrowserTitleEvent {
  id: string;
  title: string;
}

export interface BrowserLoadEvent {
  id: string;
}

export interface BrowserNewTabEvent {
  url: string;
  disposition: string;
}

export interface EditorSession {
  id?: string;
  openFiles: string[];
  activeFile?: string;
  savedAt?: string;
}

export type PathName = 'home' | 'appData' | 'userData' | 'temp' | 'desktop' | 'documents' | 'downloads' | 'pictures' | 'videos';

// Check if we're in Electron environment
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

// Get the Electron API
export function getElectronAPI(): ElectronAPI | null {
  if (isElectron()) {
    return (window as any).electronAPI;
  }
  return null;
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}