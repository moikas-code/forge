const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');
const { app } = require('electron');

// File watchers map
const fileWatchers = new Map();

// Validate path to prevent directory traversal attacks
function validatePath(filePath) {
  const normalizedPath = path.normalize(filePath);
  const homeDir = app.getPath('home');
  const appDataDir = app.getPath('userData');
  
  // Allow access to home directory and app data
  if (!normalizedPath.startsWith(homeDir) && !normalizedPath.startsWith(appDataDir)) {
    throw new Error('Access denied: Path outside allowed directories');
  }
  
  return normalizedPath;
}

// Get file metadata
async function getFileMetadata(filePath) {
  const stats = await fs.stat(filePath);
  const name = path.basename(filePath);
  
  return {
    name,
    path: filePath,
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    permissions: stats.mode,
    extension: path.extname(name).toLowerCase()
  };
}

function setupFileSystemHandlers(ipcMain) {
  // Read file
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      const content = await fs.readFile(validPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    try {
      const validPath = validatePath(filePath);
      
      // Ensure parent directory exists
      const dir = path.dirname(validPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(validPath, content, 'utf-8');
      return true;
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  });

  // Check if file exists
  ipcMain.handle('fs:exists', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      await fs.access(validPath);
      return true;
    } catch {
      return false;
    }
  });

  // Get file info
  ipcMain.handle('fs:getInfo', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      return await getFileMetadata(validPath);
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  });

  // Create file
  ipcMain.handle('fs:createFile', async (event, filePath, content = '') => {
    try {
      const validPath = validatePath(filePath);
      
      // Check if file already exists
      try {
        await fs.access(validPath);
        throw new Error('File already exists');
      } catch {
        // File doesn't exist, good to create
      }
      
      // Ensure parent directory exists
      const dir = path.dirname(validPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(validPath, content, 'utf-8');
      return await getFileMetadata(validPath);
    } catch (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  });

  // Delete file or directory
  ipcMain.handle('fs:deleteFile', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      const stats = await fs.stat(validPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(validPath, { recursive: true });
      } else {
        await fs.unlink(validPath);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  });

  // Rename/move file
  ipcMain.handle('fs:rename', async (event, fromPath, toPath) => {
    try {
      const validFromPath = validatePath(fromPath);
      const validToPath = validatePath(toPath);
      
      // Ensure target directory exists
      const dir = path.dirname(validToPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.rename(validFromPath, validToPath);
      return await getFileMetadata(validToPath);
    } catch (error) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  });

  // Copy file
  ipcMain.handle('fs:copy', async (event, fromPath, toPath) => {
    try {
      const validFromPath = validatePath(fromPath);
      const validToPath = validatePath(toPath);
      
      // Ensure target directory exists
      const dir = path.dirname(validToPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.copyFile(validFromPath, validToPath);
      return await getFileMetadata(validToPath);
    } catch (error) {
      throw new Error(`Failed to copy: ${error.message}`);
    }
  });

  // List directory contents
  ipcMain.handle('fs:listDirectory', async (event, dirPath) => {
    try {
      const validPath = validatePath(dirPath);
      const entries = await fs.readdir(validPath);
      
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(validPath, entry);
          try {
            return await getFileMetadata(fullPath);
          } catch {
            return null; // Skip files we can't read
          }
        })
      );
      
      return files.filter(Boolean).sort((a, b) => {
        // Directories first, then alphabetical
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  });

  // Watch file for changes
  ipcMain.handle('fs:watchFile', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      
      // Stop existing watcher if any
      if (fileWatchers.has(validPath)) {
        fileWatchers.get(validPath).close();
      }
      
      // Create new watcher
      const watcher = chokidar.watch(validPath, {
        persistent: true,
        ignoreInitial: true
      });
      
      watcher.on('change', () => {
        event.sender.send('fs:fileChanged', {
          path: validPath,
          type: 'modified'
        });
      });
      
      watcher.on('unlink', () => {
        event.sender.send('fs:fileChanged', {
          path: validPath,
          type: 'deleted'
        });
        watcher.close();
        fileWatchers.delete(validPath);
      });
      
      fileWatchers.set(validPath, watcher);
      return true;
    } catch (error) {
      throw new Error(`Failed to watch file: ${error.message}`);
    }
  });

  // Stop watching file
  ipcMain.handle('fs:unwatchFile', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      
      if (fileWatchers.has(validPath)) {
        fileWatchers.get(validPath).close();
        fileWatchers.delete(validPath);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to unwatch file: ${error.message}`);
    }
  });

  // Create backup
  ipcMain.handle('fs:createBackup', async (event, filePath) => {
    try {
      const validPath = validatePath(filePath);
      const content = await fs.readFile(validPath, 'utf-8');
      
      // Generate backup path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(app.getPath('userData'), 'backups');
      const fileName = path.basename(validPath);
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.backup`);
      
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      
      // Write backup
      await fs.writeFile(backupPath, content, 'utf-8');
      
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  });

  // Restore from backup
  ipcMain.handle('fs:restoreBackup', async (event, backupPath, targetPath) => {
    try {
      const validBackupPath = validatePath(backupPath);
      const validTargetPath = validatePath(targetPath);
      
      const content = await fs.readFile(validBackupPath, 'utf-8');
      await fs.writeFile(validTargetPath, content, 'utf-8');
      
      return true;
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  });

  // Clean up watchers on quit
  process.on('exit', () => {
    fileWatchers.forEach(watcher => watcher.close());
  });
}

module.exports = { setupFileSystemHandlers };