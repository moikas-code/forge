import { getElectronAPI } from './index';
import type { PathName } from './index';

// System service wrapper for Electron API
export class SystemService {
  private api = getElectronAPI();

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }
  }

  async openExternal(url: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.system.openExternal(url);
  }

  async showItemInFolder(path: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.system.showItemInFolder(path);
  }

  async getPath(name: PathName): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.system.getPath(name);
  }

  // Convenience methods
  async getHomePath(): Promise<string> {
    return this.getPath('home');
  }

  async getAppDataPath(): Promise<string> {
    return this.getPath('appData');
  }

  async getUserDataPath(): Promise<string> {
    return this.getPath('userData');
  }

  async getTempPath(): Promise<string> {
    return this.getPath('temp');
  }

  async getDesktopPath(): Promise<string> {
    return this.getPath('desktop');
  }

  async getDocumentsPath(): Promise<string> {
    return this.getPath('documents');
  }

  async getDownloadsPath(): Promise<string> {
    return this.getPath('downloads');
  }

  async getPicturesPath(): Promise<string> {
    return this.getPath('pictures');
  }

  async getVideosPath(): Promise<string> {
    return this.getPath('videos');
  }

  // Platform detection
  getPlatform(): string {
    // In Electron, we can use navigator.platform
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'darwin';
    return 'linux';
  }

  isWindows(): boolean {
    return this.getPlatform() === 'windows';
  }

  isMacOS(): boolean {
    return this.getPlatform() === 'darwin';
  }

  isLinux(): boolean {
    return this.getPlatform() === 'linux';
  }
}

// Singleton instance
let systemService: SystemService | null = null;

export function getSystemService(): SystemService {
  if (!systemService) {
    systemService = new SystemService();
  }
  return systemService;
}