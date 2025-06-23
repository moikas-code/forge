import { getElectronAPI } from './index';
import type { TerminalOptions, TerminalInfo, TerminalData, TerminalExit, TerminalSessionInfo, SSHOptions } from './index';

// Terminal service wrapper for Electron API
export class TerminalService {
  private api = getElectronAPI();
  private dataListeners = new Map<string, (data: Uint8Array) => void>();
  private exitListeners = new Map<string, (exitCode: number) => void>();

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }

    // Set up global listeners
    this.api.terminal.onData((data: TerminalData) => {
      const listener = this.dataListeners.get(data.terminalId);
      if (listener) {
        // Convert number array back to Uint8Array
        listener(new Uint8Array(data.data));
      }
    });

    this.api.terminal.onExit((data: TerminalExit) => {
      const listener = this.exitListeners.get(data.terminalId);
      if (listener) {
        listener(data.exitCode);
        // Clean up listeners
        this.dataListeners.delete(data.terminalId);
        this.exitListeners.delete(data.terminalId);
      }
    });
  }

  async create(options?: TerminalOptions): Promise<TerminalInfo> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.create(options);
  }

  async write(id: string, data: string | Uint8Array): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    
    // Convert string to Uint8Array if needed
    const uint8Data = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;
    
    return this.api.terminal.write(id, uint8Data);
  }

  async resize(id: string, cols: number, rows: number): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.resize(id, cols, rows);
  }

  async close(id: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    
    // Clean up listeners
    this.dataListeners.delete(id);
    this.exitListeners.delete(id);
    
    return this.api.terminal.close(id);
  }

  onData(id: string, callback: (data: Uint8Array) => void): void {
    this.dataListeners.set(id, callback);
  }

  onExit(id: string, callback: (exitCode: number) => void): void {
    this.exitListeners.set(id, callback);
  }

  async getSessionInfo(id: string): Promise<TerminalSessionInfo> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.getSessionInfo(id);
  }

  async getHistory(id: string): Promise<string[]> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.getHistory(id);
  }

  async getCwd(id: string): Promise<string> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.getCwd(id);
  }

  async testSSH(options: SSHOptions): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.terminal.testSSH(options);
  }

  // Cleanup all listeners
  cleanup(): void {
    this.dataListeners.clear();
    this.exitListeners.clear();
    if (this.api) {
      this.api.removeAllListeners('terminal:data');
      this.api.removeAllListeners('terminal:exit');
    }
  }
}

// Singleton instance
let terminalService: TerminalService | null = null;

export function getTerminalService(): TerminalService {
  if (!terminalService) {
    terminalService = new TerminalService();
  }
  return terminalService;
}