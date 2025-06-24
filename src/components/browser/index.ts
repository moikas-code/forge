// Main browser component (automatically detects environment)
export { Browser } from './Browser';

// Electron-specific browser (native BrowserView)
export { ElectronBrowser } from './ElectronBrowser';

// Fallback browser for non-Electron environments
export { SmartBrowser } from './SmartBrowser';