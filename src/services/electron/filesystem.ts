import { getElectronAPI } from './index';
import type { FileInfo, FileChangeEvent } from './index';

// File system service wrapper for Electron API
export class FileSystemService {
  private api = getElectronAPI();
  private changeListeners = new Map<string, (event: FileChangeEvent) => void>();

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }

    // Set up global file change listener
    this.api.fs.onFileChange((event: FileChangeEvent) => {
      const listener = this.changeListeners.get(event.path);
      if (listener) {
        listener(event);
      }
    });
  }

  async readFile(path: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.readFile(path);
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.writeFile(path, content);
  }

  async exists(path: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.exists(path);
  }

  async getInfo(path: string): Promise<FileInfo> {
    if (!this.api) throw new Error('Electron API not available');
    const info = await this.api.fs.getInfo(path);
    // Convert date strings back to Date objects
    return {
      ...info,
      created: new Date(info.created),
      modified: new Date(info.modified),
      accessed: new Date(info.accessed)
    };
  }

  async createFile(path: string, content: string = ''): Promise<FileInfo> {
    if (!this.api) throw new Error('Electron API not available');
    const info = await this.api.fs.createFile(path, content);
    return {
      ...info,
      created: new Date(info.created),
      modified: new Date(info.modified),
      accessed: new Date(info.accessed)
    };
  }

  async deleteFile(path: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.deleteFile(path);
  }

  async rename(from: string, to: string): Promise<FileInfo> {
    if (!this.api) throw new Error('Electron API not available');
    const info = await this.api.fs.rename(from, to);
    return {
      ...info,
      created: new Date(info.created),
      modified: new Date(info.modified),
      accessed: new Date(info.accessed)
    };
  }

  async copy(from: string, to: string): Promise<FileInfo> {
    if (!this.api) throw new Error('Electron API not available');
    const info = await this.api.fs.copy(from, to);
    return {
      ...info,
      created: new Date(info.created),
      modified: new Date(info.modified),
      accessed: new Date(info.accessed)
    };
  }

  async listDirectory(path: string): Promise<FileInfo[]> {
    if (!this.api) throw new Error('Electron API not available');
    const files = await this.api.fs.listDirectory(path);
    return files.map(file => ({
      ...file,
      created: new Date(file.created),
      modified: new Date(file.modified),
      accessed: new Date(file.accessed)
    }));
  }

  async watchFile(path: string, callback: (event: FileChangeEvent) => void): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    
    // Store the callback
    this.changeListeners.set(path, callback);
    
    // Start watching
    return this.api.fs.watchFile(path);
  }

  async unwatchFile(path: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    
    // Remove the callback
    this.changeListeners.delete(path);
    
    // Stop watching
    return this.api.fs.unwatchFile(path);
  }

  async createBackup(path: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.createBackup(path);
  }

  async restoreBackup(backupPath: string, targetPath: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.fs.restoreBackup(backupPath, targetPath);
  }

  // Cleanup all listeners
  cleanup(): void {
    this.changeListeners.clear();
    if (this.api) {
      this.api.removeAllListeners('fs:fileChanged');
    }
  }
}

// Singleton instance
let fileSystemService: FileSystemService | null = null;

export function getFileSystemService(): FileSystemService {
  if (!fileSystemService) {
    fileSystemService = new FileSystemService();
  }
  return fileSystemService;
}