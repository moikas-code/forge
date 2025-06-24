// Type definitions for Electron IPC API

interface UpdaterStatus {
  status: 'checking-for-update' | 'update-available' | 'update-not-available' | 'update-error' | 'download-progress' | 'update-downloaded';
  data?: any;
}

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface ElectronAPI {
  terminal: {
    create: (options: any) => Promise<string>;
    write: (id: string, data: string) => Promise<void>;
    resize: (id: string, cols: number, rows: number) => Promise<void>;
    close: (id: string) => Promise<void>;
    onData: (callback: (data: any) => void) => void;
    onExit: (callback: (data: any) => void) => void;
    getSessionInfo: (id: string) => Promise<any>;
    getHistory: (id: string) => Promise<string[]>;
    getCwd: (id: string) => Promise<string>;
    testSSH: (options: any) => Promise<boolean>;
  };
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    getInfo: (path: string) => Promise<any>;
    createFile: (path: string, content: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    rename: (from: string, to: string) => Promise<void>;
    copy: (from: string, to: string) => Promise<void>;
    listDirectory: (path: string) => Promise<any[]>;
    watchFile: (path: string) => Promise<void>;
    unwatchFile: (path: string) => Promise<void>;
    createBackup: (path: string) => Promise<string>;
    restoreBackup: (backupPath: string, targetPath: string) => Promise<void>;
    onFileChange: (callback: (data: any) => void) => void;
  };
  browser: {
    create: (options: any) => Promise<string>;
    navigate: (id: string, url: string) => Promise<void>;
    goBack: (id: string) => Promise<void>;
    goForward: (id: string) => Promise<void>;
    refresh: (id: string) => Promise<void>;
    close: (id: string) => Promise<void>;
    setBounds: (id: string, bounds: any) => Promise<void>;
    show: (id: string) => Promise<void>;
    hide: (id: string) => Promise<void>;
    openDevTools: (id: string) => Promise<void>;
    closeDevTools: (id: string) => Promise<void>;
    captureScreenshot: (id: string) => Promise<string>;
    captureRegion: (id: string, rect: any) => Promise<string>;
    saveScreenshot: (id: string, filePath: string) => Promise<void>;
    startRecording: (id: string) => Promise<void>;
    stopRecording: (id: string) => Promise<string>;
    getRecordingStatus: (id: string) => Promise<boolean>;
    getUrl: (id: string) => Promise<string>;
    getTitle: (id: string) => Promise<string>;
    canGoBack: (id: string) => Promise<boolean>;
    canGoForward: (id: string) => Promise<boolean>;
    onNavigate: (callback: (data: any) => void) => void;
    onTitleUpdate: (callback: (data: any) => void) => void;
    onLoadStart: (callback: (data: any) => void) => void;
    onLoadStop: (callback: (data: any) => void) => void;
    onNewTabRequest: (callback: (data: BrowserNewTabEvent) => void) => void;
  };
  editor: {
    saveSession: (sessionData: any) => Promise<void>;
    loadSession: (sessionId: string) => Promise<any>;
    listSessions: () => Promise<any[]>;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  system: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
    getPath: (name: string) => Promise<string>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    unmaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    setAlwaysOnTop: (flag: boolean) => Promise<void>;
  };
  updater: {
    check: () => Promise<void>;
    download: () => Promise<void>;
    install: () => Promise<void>;
    getVersion: () => Promise<string>;
    onStatus: (callback: (status: UpdaterStatus) => void) => void;
  };
  removeAllListeners: (channel: string) => void;
}

interface BrowserNewTabEvent {
  url: string;
  disposition: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { ElectronAPI, BrowserNewTabEvent, UpdaterStatus, UpdateProgress, UpdateInfo };