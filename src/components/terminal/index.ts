// Main terminal component (Electron-compatible)
export { ElectronTerminal } from './ElectronTerminal';
export { Terminal } from './ElectronTerminal'; // Use ElectronTerminal as the main Terminal export

// Terminal UI components (no backend dependencies)
export { TerminalToolbar, type TerminalToolbarProps } from './TerminalToolbar';
export { TerminalManager } from './TerminalManager';
export { TerminalTab } from './TerminalTab';
export { ProfileSelector } from './ProfileSelector';
export { ProfileManagement } from './ProfileManagement';
export { TerminalSearchOverlay } from './TerminalSearchOverlay';
export { SnippetManager } from './SnippetManager';

// Temporarily commented out components with Tauri dependencies
// These need to be migrated to Electron APIs before being re-enabled
// export { Terminal as TauriTerminal } from './Terminal';
// export { Terminal as UnifiedTerminal } from './UnifiedTerminal';
// export { EnhancedTerminal } from './EnhancedTerminal';
// export { AdvancedTerminal } from './AdvancedTerminal';
// export { CommandPalette } from './CommandPalette';
// export { SSHManager } from './SSHManager';
// export { DeveloperTools } from './DeveloperTools';

// New theme and UI enhancement components
export { ThemeSelector } from './ThemeSelector';
export { 
  TerminalStatusIndicator, 
  TabStatusIndicator, 
  DetailedStatusIndicator 
} from './TerminalStatusIndicator';
export { TerminalWindowChrome } from './TerminalWindowChrome';