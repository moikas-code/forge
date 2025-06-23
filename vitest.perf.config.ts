/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['performance/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src-tauri',
      'e2e',
      'src'
    ],
    // Performance test specific settings
    timeout: 60000, // 1 minute for performance tests
    testTimeout: 60000,
    hookTimeout: 10000,
    // Run performance tests sequentially to avoid interference
    maxConcurrency: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1
      }
    },
    // Custom reporter for performance metrics
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './performance/results/performance-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});