const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Auto-updater module loaded');

class AppUpdater {
  constructor() {
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatusToWindow('checking-for-update');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatusToWindow('update-available', info);
      
      // Show dialog to user
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Would you like to download it now?`,
        detail: info.releaseNotes ? `Release notes:\n${info.releaseNotes}` : 'A new version is available with improvements and bug fixes.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatusToWindow('update-not-available');
    });

    // Error
    autoUpdater.on('error', (error) => {
      log.error('Error in auto-updater:', error);
      this.sendStatusToWindow('update-error', error.message);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
      logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
      logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
      this.sendStatusToWindow('download-progress', progressObj);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatusToWindow('update-downloaded', info);
      
      // Show dialog to user
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The application will restart to apply the update.',
        detail: 'Save any unsaved work before clicking OK.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    // IPC handlers for renderer process
    ipcMain.handle('updater:check', () => {
      return this.checkForUpdates();
    });

    ipcMain.handle('updater:download', () => {
      return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    ipcMain.handle('updater:getVersion', () => {
      return autoUpdater.currentVersion.version;
    });
  }

  sendStatusToWindow(status, data = null) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('updater:status', { status, data });
    });
  }

  checkForUpdates() {
    log.info('Manual check for updates requested');
    return autoUpdater.checkForUpdatesAndNotify();
  }

  checkForUpdatesOnStartup() {
    // Check for updates 3 seconds after startup
    setTimeout(() => {
      log.info('Checking for updates on startup');
      autoUpdater.checkForUpdates();
    }, 3000);
  }
}

module.exports = AppUpdater;