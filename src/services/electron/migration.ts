// Migration helper to replace Tauri APIs with Electron APIs

import { 
  getTerminalService,
  getFileSystemService,
  getBrowserService,
  getStoreService,
  getSystemService,
  getWindowService
} from './index';

// Create a compatibility layer that mimics Tauri API structure
export const electronCompat = {
  // File system operations (replaces @tauri-apps/plugin-fs)
  fs: {
    readTextFile: async (path: string) => {
      const fs = getFileSystemService();
      return fs.readFile(path);
    },
    writeTextFile: async (path: string, content: string) => {
      const fs = getFileSystemService();
      await fs.writeFile(path, content);
    },
    exists: async (path: string) => {
      const fs = getFileSystemService();
      return fs.exists(path);
    },
    createDir: async (path: string, options?: { recursive?: boolean }) => {
      // In Electron, directories are created automatically when writing files
      // This is a no-op for compatibility
      return;
    },
    removeFile: async (path: string) => {
      const fs = getFileSystemService();
      await fs.deleteFile(path);
    },
    removeDir: async (path: string) => {
      const fs = getFileSystemService();
      await fs.deleteFile(path); // Works for both files and directories
    },
    renameFile: async (oldPath: string, newPath: string) => {
      const fs = getFileSystemService();
      await fs.rename(oldPath, newPath);
    },
    copyFile: async (source: string, destination: string) => {
      const fs = getFileSystemService();
      await fs.copy(source, destination);
    },
    readDir: async (path: string) => {
      const fs = getFileSystemService();
      const files = await fs.listDirectory(path);
      return files.map(f => ({
        name: f.name,
        path: f.path,
        children: undefined // Tauri compatibility
      }));
    }
  },

  // Shell operations (replaces @tauri-apps/plugin-shell)
  shell: {
    open: async (url: string) => {
      const system = getSystemService();
      await system.openExternal(url);
    },
    Command: class {
      constructor(public program: string, public args?: string[]) {}
      
      async execute() {
        // For terminal commands, create a terminal session
        const terminal = getTerminalService();
        const session = await terminal.create();
        const command = [this.program, ...(this.args || [])].join(' ');
        await terminal.write(session.id, command + '\n');
        
        // Note: This is simplified - real implementation would need to
        // capture output and return it properly
        return { stdout: '', stderr: '', code: 0 };
      }
    }
  },

  // Window operations (replaces @tauri-apps/api/window)
  window: {
    getCurrent: () => ({
      minimize: async () => {
        const window = getWindowService();
        await window.minimize();
      },
      maximize: async () => {
        const window = getWindowService();
        await window.maximize();
      },
      unmaximize: async () => {
        const window = getWindowService();
        await window.unmaximize();
      },
      close: async () => {
        const window = getWindowService();
        await window.close();
      },
      isMaximized: async () => {
        const window = getWindowService();
        return window.isMaximized();
      },
      setAlwaysOnTop: async (alwaysOnTop: boolean) => {
        const window = getWindowService();
        await window.setAlwaysOnTop(alwaysOnTop);
      }
    })
  },

  // Store operations (replaces @tauri-apps/plugin-store)
  store: {
    Store: class {
      constructor(public filename?: string) {}
      
      async get(key: string) {
        const store = getStoreService();
        return store.get(key);
      }
      
      async set(key: string, value: any) {
        const store = getStoreService();
        await store.set(key, value);
      }
      
      async delete(key: string) {
        const store = getStoreService();
        await store.delete(key);
      }
      
      async clear() {
        const store = getStoreService();
        await store.clear();
      }
      
      async save() {
        // No-op in Electron (auto-saves)
      }
    }
  },

  // Path operations (replaces @tauri-apps/api/path)
  path: {
    homeDir: async () => {
      const system = getSystemService();
      return system.getHomePath();
    },
    appDataDir: async () => {
      const system = getSystemService();
      return system.getAppDataPath();
    },
    desktopDir: async () => {
      const system = getSystemService();
      return system.getDesktopPath();
    },
    documentDir: async () => {
      const system = getSystemService();
      return system.getDocumentsPath();
    },
    downloadDir: async () => {
      const system = getSystemService();
      return system.getDownloadsPath();
    },
    join: async (...paths: string[]) => {
      // Simple path join (in real app, use path module)
      return paths.join('/').replace(/\/+/g, '/');
    }
  },

  // Dialog operations (bonus - not in original Tauri migration)
  dialog: {
    open: async (options?: any) => {
      // This would need to be implemented in the Electron backend
      console.warn('Dialog.open not yet implemented in Electron migration');
      return null;
    },
    save: async (options?: any) => {
      console.warn('Dialog.save not yet implemented in Electron migration');
      return null;
    }
  }
};

// Export individual services for direct use
export {
  getTerminalService,
  getFileSystemService,
  getBrowserService,
  getStoreService,
  getSystemService,
  getWindowService
} from './index';