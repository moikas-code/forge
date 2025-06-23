import { getElectronAPI } from './index';

// Window service wrapper for Electron API
export class WindowService {
  private api = getElectronAPI();

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }
  }

  async minimize(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.minimize();
  }

  async maximize(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.maximize();
  }

  async unmaximize(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.unmaximize();
  }

  async close(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.close();
  }

  async isMaximized(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.isMaximized();
  }

  async setAlwaysOnTop(flag: boolean): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.window.setAlwaysOnTop(flag);
  }

  // Convenience method to toggle maximize
  async toggleMaximize(): Promise<boolean> {
    const maximized = await this.isMaximized();
    if (maximized) {
      return this.unmaximize();
    } else {
      return this.maximize();
    }
  }
}

// Singleton instance
let windowService: WindowService | null = null;

export function getWindowService(): WindowService {
  if (!windowService) {
    windowService = new WindowService();
  }
  return windowService;
}