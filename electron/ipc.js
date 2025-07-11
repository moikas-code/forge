const { shell, app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Initialize electron-store with error handling
let Store;
let store;
let editorSessionsStore;

try {
  // Try ES6 import style first
  const { default: ElectronStore } = require('electron-store');
  Store = ElectronStore;
  store = new ElectronStore();
  editorSessionsStore = new ElectronStore({ name: 'editor-sessions' });
  console.log('Electron store initialized successfully (ES6 style)');
} catch (e1) {
  try {
    // Try CommonJS import style
    Store = require('electron-store');
    store = new Store();
    editorSessionsStore = new Store({ name: 'editor-sessions' });
    console.log('Electron store initialized successfully (CommonJS style)');
  } catch (e2) {
    console.error('Failed to initialize electron-store:', e2);
    // Create simple fallback stores
    store = {
      get: (key) => null,
      set: (key, value) => {},
      delete: (key) => {},
      clear: () => {}
    };
    editorSessionsStore = {
      get: (key) => null,
      set: (key, value) => {},
      store: {}
    };
    Store = null;
  }
}

function setupIPCHandlers(ipcMain) {
  // Store API
  ipcMain.handle('store:get', async (event, key) => {
    return Store ? store.get(key) : store.get(key);
  });

  ipcMain.handle('store:set', async (event, key, value) => {
    Store ? store.set(key, value) : store.set(key, value);
    return true;
  });

  ipcMain.handle('store:delete', async (event, key) => {
    Store ? store.delete(key) : store.delete(key);
    return true;
  });

  ipcMain.handle('store:clear', async (event) => {
    Store ? store.clear() : store.clear();
    return true;
  });

  // System API
  ipcMain.handle('system:openExternal', async (event, url) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('system:showItemInFolder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('system:getPath', async (event, name) => {
    // Validate path name
    const validPaths = ['home', 'appData', 'userData', 'temp', 'desktop', 'documents', 'downloads', 'pictures', 'videos'];
    if (!validPaths.includes(name)) {
      throw new Error(`Invalid path name: ${name}`);
    }
    return app.getPath(name);
  });

  // Window API
  ipcMain.handle('window:minimize', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) win.minimize();
    } catch (e) {
      console.log('Window operation failed (expected during close)');
    }
    return true;
  });

  ipcMain.handle('window:maximize', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) win.maximize();
    } catch (e) {
      console.log('Window operation failed (expected during close)');
    }
    return true;
  });

  ipcMain.handle('window:unmaximize', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) win.unmaximize();
    } catch (e) {
      console.log('Window operation failed (expected during close)');
    }
    return true;
  });

  ipcMain.handle('window:close', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) win.close();
    } catch (e) {
      console.log('Window operation failed (expected during close)');
    }
    return true;
  });

  ipcMain.handle('window:isMaximized', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      return win && !win.isDestroyed() ? win.isMaximized() : false;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('window:setAlwaysOnTop', async (event, flag) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win && !win.isDestroyed()) win.setAlwaysOnTop(flag);
    } catch (e) {
      console.log('Window operation failed (expected during close)');
    }
    return true;
  });

  // Editor Session API
  ipcMain.handle('editor:saveSession', async (event, sessionData) => {
    const sessionId = sessionData.id || `session_${Date.now()}`;
    const sessionWithTimestamp = {
      ...sessionData,
      id: sessionId,
      savedAt: new Date().toISOString()
    };
    
    Store ? editorSessionsStore.set(sessionId, sessionWithTimestamp) : editorSessionsStore.set(sessionId, sessionWithTimestamp);
    
    // Also save to file for backup
    const sessionsDir = path.join(app.getPath('userData'), 'editor-sessions');
    await fs.mkdir(sessionsDir, { recursive: true });
    await fs.writeFile(
      path.join(sessionsDir, `${sessionId}.json`),
      JSON.stringify(sessionWithTimestamp, null, 2)
    );
    
    return sessionId;
  });

  ipcMain.handle('editor:loadSession', async (event, sessionId) => {
    const session = Store ? editorSessionsStore.get(sessionId) : editorSessionsStore.get(sessionId);
    if (!session) {
      // Try to load from file
      const sessionFile = path.join(app.getPath('userData'), 'editor-sessions', `${sessionId}.json`);
      try {
        const content = await fs.readFile(sessionFile, 'utf-8');
        return JSON.parse(content);
      } catch {
        throw new Error(`Session ${sessionId} not found`);
      }
    }
    return session;
  });

  ipcMain.handle('editor:listSessions', async (event) => {
    const sessions = Store ? editorSessionsStore.store : Object.fromEntries(editorSessionsStore);
    return Object.values(sessions).sort((a, b) => {
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  });

  // Dialog API (bonus!)
  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, options);
    return result;
  });

  ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, options);
    return result;
  });

  ipcMain.handle('dialog:showMessageBox', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showMessageBox(win, options);
    return result;
  });
}

module.exports = { setupIPCHandlers };