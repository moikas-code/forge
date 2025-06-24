const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal API
  terminal: {
    create: (options) => ipcRenderer.invoke('terminal:create', options),
    write: (id, data) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    close: (id) => ipcRenderer.invoke('terminal:close', id),
    onData: (callback) => {
      console.log('[Preload] Setting up terminal:data listener');
      ipcRenderer.on('terminal:data', (event, data) => {
        console.log('[Preload] Received terminal:data event:', data.terminalId, data.data.length, 'bytes');
        callback(data);
      });
    },
    onExit: (callback) => {
      console.log('[Preload] Setting up terminal:exit listener');
      ipcRenderer.on('terminal:exit', (event, data) => {
        console.log('[Preload] Received terminal:exit event:', data);
        callback(data);
      });
    },
    getSessionInfo: (id) => ipcRenderer.invoke('terminal:getSessionInfo', id),
    getHistory: (id) => ipcRenderer.invoke('terminal:getHistory', id),
    getCwd: (id) => ipcRenderer.invoke('terminal:getCwd', id),
    testSSH: (options) => ipcRenderer.invoke('terminal:testSSH', options),
  },

  // File System API
  fs: {
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    exists: (path) => ipcRenderer.invoke('fs:exists', path),
    getInfo: (path) => ipcRenderer.invoke('fs:getInfo', path),
    createFile: (path, content) => ipcRenderer.invoke('fs:createFile', path, content),
    deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
    rename: (from, to) => ipcRenderer.invoke('fs:rename', from, to),
    copy: (from, to) => ipcRenderer.invoke('fs:copy', from, to),
    listDirectory: (path) => ipcRenderer.invoke('fs:listDirectory', path),
    watchFile: (path) => ipcRenderer.invoke('fs:watchFile', path),
    unwatchFile: (path) => ipcRenderer.invoke('fs:unwatchFile', path),
    createBackup: (path) => ipcRenderer.invoke('fs:createBackup', path),
    restoreBackup: (backupPath, targetPath) => ipcRenderer.invoke('fs:restoreBackup', backupPath, targetPath),
    onFileChange: (callback) => {
      ipcRenderer.on('fs:fileChanged', (event, data) => callback(data));
    },
  },

  // Browser API
  browser: {
    create: (options) => ipcRenderer.invoke('browser:create', options),
    navigate: (id, url) => ipcRenderer.invoke('browser:navigate', id, url),
    goBack: (id) => ipcRenderer.invoke('browser:goBack', id),
    goForward: (id) => ipcRenderer.invoke('browser:goForward', id),
    refresh: (id) => ipcRenderer.invoke('browser:refresh', id),
    close: (id) => ipcRenderer.invoke('browser:close', id),
    setBounds: (id, bounds) => ipcRenderer.invoke('browser:setBounds', id, bounds),
    show: (id) => ipcRenderer.invoke('browser:show', id),
    hide: (id) => ipcRenderer.invoke('browser:hide', id),
    openDevTools: (id) => ipcRenderer.invoke('browser:openDevTools', id),
    closeDevTools: (id) => ipcRenderer.invoke('browser:closeDevTools', id),
    captureScreenshot: (id) => ipcRenderer.invoke('browser:captureScreenshot', id),
    captureRegion: (id, rect) => ipcRenderer.invoke('browser:captureRegion', id, rect),
    saveScreenshot: (id, filePath) => ipcRenderer.invoke('browser:saveScreenshot', id, filePath),
    startRecording: (id) => ipcRenderer.invoke('browser:startRecording', id),
    stopRecording: (id) => ipcRenderer.invoke('browser:stopRecording', id),
    getRecordingStatus: (id) => ipcRenderer.invoke('browser:getRecordingStatus', id),
    getUrl: (id) => ipcRenderer.invoke('browser:getUrl', id),
    getTitle: (id) => ipcRenderer.invoke('browser:getTitle', id),
    canGoBack: (id) => ipcRenderer.invoke('browser:canGoBack', id),
    canGoForward: (id) => ipcRenderer.invoke('browser:canGoForward', id),
    onNavigate: (callback) => {
      ipcRenderer.on('browser:navigate', (event, data) => callback(data));
    },
    onTitleUpdate: (callback) => {
      ipcRenderer.on('browser:titleUpdate', (event, data) => callback(data));
    },
    onLoadStart: (callback) => {
      ipcRenderer.on('browser:loadStart', (event, data) => callback(data));
    },
    onLoadStop: (callback) => {
      ipcRenderer.on('browser:loadStop', (event, data) => callback(data));
    },
    onNewTabRequest: (callback) => {
      ipcRenderer.on('browser:newTabRequest', (event, data) => callback(data));
    },
  },

  // Editor Session API
  editor: {
    saveSession: (sessionData) => ipcRenderer.invoke('editor:saveSession', sessionData),
    loadSession: (sessionId) => ipcRenderer.invoke('editor:loadSession', sessionId),
    listSessions: () => ipcRenderer.invoke('editor:listSessions'),
  },

  // Store API
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear'),
  },

  // System API
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),
    showItemInFolder: (path) => ipcRenderer.invoke('system:showItemInFolder', path),
    getPath: (name) => ipcRenderer.invoke('system:getPath', name),
  },

  // Window API
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    unmaximize: () => ipcRenderer.invoke('window:unmaximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    setAlwaysOnTop: (flag) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
  },

  // Updater API
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    getVersion: () => ipcRenderer.invoke('updater:getVersion'),
    onStatus: (callback) => {
      ipcRenderer.on('updater:status', (event, data) => callback(data));
    },
  },

  // Remove all listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});