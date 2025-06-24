import { getElectronAPI } from './index';
import type { 
  BrowserOptions, 
  BrowserInfo, 
  BrowserBounds, 
  BrowserNavigateEvent, 
  BrowserTitleEvent, 
  BrowserLoadEvent 
} from './index';

// Browser service wrapper for Electron API
export class BrowserService {
  private api = getElectronAPI();
  private navigateListeners = new Map<string, (url: string) => void>();
  private titleListeners = new Map<string, (title: string) => void>();
  private loadStartListeners = new Map<string, () => void>();
  private loadStopListeners = new Map<string, () => void>();
  private newTabRequestListener: ((data: { url: string; disposition: string }) => void) | null = null;

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }

    // Set up global event listeners
    this.api.browser.onNavigate((event: BrowserNavigateEvent) => {
      const listener = this.navigateListeners.get(event.id);
      if (listener) {
        listener(event.url);
      }
    });

    this.api.browser.onTitleUpdate((event: BrowserTitleEvent) => {
      const listener = this.titleListeners.get(event.id);
      if (listener) {
        listener(event.title);
      }
    });

    this.api.browser.onLoadStart((event: BrowserLoadEvent) => {
      const listener = this.loadStartListeners.get(event.id);
      if (listener) {
        listener();
      }
    });

    this.api.browser.onLoadStop((event: BrowserLoadEvent) => {
      const listener = this.loadStopListeners.get(event.id);
      if (listener) {
        listener();
      }
    });

    this.api.browser.onNewTabRequest((data: { url: string; disposition: string }) => {
      if (this.newTabRequestListener) {
        this.newTabRequestListener(data);
      }
    });
  }

  async create(options?: BrowserOptions): Promise<BrowserInfo> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.create(options);
  }

  async navigate(id: string, url: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.navigate(id, url);
  }

  async goBack(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.goBack(id);
  }

  async goForward(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.goForward(id);
  }

  async refresh(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.refresh(id);
  }

  async close(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    
    // Clean up listeners
    this.navigateListeners.delete(id);
    this.titleListeners.delete(id);
    this.loadStartListeners.delete(id);
    this.loadStopListeners.delete(id);
    
    return this.api.browser.close(id);
  }

  async setBounds(id: string, bounds: BrowserBounds): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.setBounds(id, bounds);
  }

  async show(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.show(id);
  }

  async hide(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.hide(id);
  }

  async openDevTools(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.openDevTools(id);
  }

  async closeDevTools(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.closeDevTools(id);
  }

  async captureScreenshot(id: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.captureScreenshot(id);
  }

  async captureRegion(id: string, rect: { x: number; y: number; width: number; height: number }): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.captureRegion(id, rect);
  }

  async startRecording(id: string): Promise<{ sourceId: string; bounds: BrowserBounds }> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.startRecording(id);
  }

  async stopRecording(id: string): Promise<{ duration: number }> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.stopRecording(id);
  }

  async getRecordingStatus(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.getRecordingStatus(id);
  }

  async getUrl(id: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.getUrl(id);
  }

  async getTitle(id: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.getTitle(id);
  }

  async canGoBack(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.canGoBack(id);
  }

  async canGoForward(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.browser.canGoForward(id);
  }

  // Event listeners
  onNavigate(id: string, callback: (url: string) => void): void {
    this.navigateListeners.set(id, callback);
  }

  onTitleUpdate(id: string, callback: (title: string) => void): void {
    this.titleListeners.set(id, callback);
  }

  onLoadStart(id: string, callback: () => void): void {
    this.loadStartListeners.set(id, callback);
  }

  onLoadStop(id: string, callback: () => void): void {
    this.loadStopListeners.set(id, callback);
  }

  onNewTabRequest(callback: (data: { url: string; disposition: string }) => void): void {
    this.newTabRequestListener = callback;
  }

  // Cleanup all listeners
  cleanup(): void {
    this.navigateListeners.clear();
    this.titleListeners.clear();
    this.loadStartListeners.clear();
    this.loadStopListeners.clear();
    this.newTabRequestListener = null;
    if (this.api) {
      this.api.removeAllListeners('browser:navigate');
      this.api.removeAllListeners('browser:titleUpdate');
      this.api.removeAllListeners('browser:loadStart');
      this.api.removeAllListeners('browser:loadStop');
      this.api.removeAllListeners('browser:newTabRequest');
    }
  }
}

// Singleton instance
let browserService: BrowserService | null = null;

export function getBrowserService(): BrowserService {
  if (!browserService) {
    browserService = new BrowserService();
  }
  return browserService;
}