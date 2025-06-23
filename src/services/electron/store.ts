import { getElectronAPI } from './index';

// Store service wrapper for Electron API
export class StoreService {
  private api = getElectronAPI();

  constructor() {
    if (!this.api) {
      throw new Error('Electron API not available');
    }
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.store.get(key);
  }

  async set(key: string, value: any): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.store.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.store.delete(key);
  }

  async clear(): Promise<boolean> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.store.clear();
  }

  // Convenience methods
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async getMany<T = any>(keys: string[]): Promise<Record<string, T>> {
    const result: Record<string, T> = {};
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  async setMany(items: Record<string, any>): Promise<boolean> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value);
    }
    return true;
  }

  async deleteMany(keys: string[]): Promise<boolean> {
    for (const key of keys) {
      await this.delete(key);
    }
    return true;
  }
}

// Singleton instance
let storeService: StoreService | null = null;

export function getStoreService(): StoreService {
  if (!storeService) {
    storeService = new StoreService();
  }
  return storeService;
}