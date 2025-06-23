// Main browser component (automatically detects environment)
export { Browser } from './Browser';

// Electron-specific browser (native BrowserView)
export { ElectronBrowser } from './ElectronBrowser';

// Fallback browser for non-Electron environments
export { SmartBrowser } from './SmartBrowser';

// Legacy browsers (kept for reference, but not exported to avoid Tauri import errors)
// export { BrowserPreview } from './BrowserPreview';
// export { BrowserAdvanced } from './BrowserAdvanced';
// export { SimpleBrowser } from './SimpleBrowser';
// export { EmbeddedBrowser } from './EmbeddedBrowser';
// export { IntegratedBrowser } from './IntegratedBrowser';
// export { TestBrowser } from './TestBrowser';
// export { TauriBrowser } from './TauriBrowser';
// export { TauriWebviewBrowser } from './TauriWebviewBrowser';
// export { ExternalBrowser } from './ExternalBrowser';
// export { SimpleTauriBrowser } from './SimpleTauriBrowser';
// export { InAppBrowser } from './InAppBrowser';
// export { OverlayBrowser } from './OverlayBrowser';
// export { HybridBrowser } from './HybridBrowser';