const { app, BrowserWindow, BrowserView, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
// Comment out for now as electron-squirrel-startup is not installed
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// Initialize auto-updater
let appUpdater;
if (!isDev) {
  const AppUpdater = require('./updater');
  appUpdater = new AppUpdater();
}

let mainWindow;
let browserViews = new Map();
let isAppQuitting = false;

function createWindow() {
  // Create the browser window with cyberpunk theme
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#000000',
    titleBarStyle: 'hiddenInset', // macOS style
    trafficLightPosition: { x: 20, y: 20 },
    autoHideMenuBar: true, // Hide menu bar on Windows/Linux
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    },
    icon: path.join(__dirname, '../public', 'icon.png')
  });

  // Load the app
  if (isDev) {
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000')
      .then(() => {
        console.log('Successfully loaded development URL');
      })
      .catch((error) => {
        console.error('Failed to load development URL:', error);
      });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Debug: Log when page finishes loading
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Main window finished loading');
  });

  // Debug: Log any load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Handle window close event
  mainWindow.on('close', (event) => {
    // Don't do cleanup here - it causes "object has been destroyed" errors
    // Cleanup will be handled in before-quit event
    isAppQuitting = true;
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Prevent error dialogs on window close
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't show dialog if app is quitting
  if (!isAppQuitting) {
    isAppQuitting = true;
    app.quit();
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Hide the menu bar
  Menu.setApplicationMenu(null);
  
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // Initialize all IPC handlers
  const { setupTerminalHandlers } = require('./terminal');
  const { setupFileSystemHandlers } = require('./filesystem');
  const { setupBrowserHandlers } = require('./browser');
  const { setupIPCHandlers } = require('./ipc');
  
  setupTerminalHandlers(ipcMain, () => mainWindow);
  setupFileSystemHandlers(ipcMain);
  setupBrowserHandlers(ipcMain, () => mainWindow, browserViews);
  setupIPCHandlers(ipcMain);
  
  // Check for updates on startup
  if (appUpdater) {
    appUpdater.checkForUpdatesOnStartup();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running unless explicitly quit
  if (process.platform !== 'darwin') {
    isAppQuitting = true;
    app.quit();
  }
});

// Clean up before app quits
app.on('before-quit', () => {
  console.log('App before-quit event');
  isAppQuitting = true;
});

// Handle app quit
app.on('will-quit', (event) => {
  console.log('App is quitting...');
  isAppQuitting = true;
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

