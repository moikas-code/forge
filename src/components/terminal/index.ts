// Main terminal component (Universal - works in both environments)
export { UniversalTerminal as Terminal } from './UniversalTerminal';
export { ElectronTerminal } from './ElectronTerminal';

// Terminal UI components (no backend dependencies)
export { TerminalToolbar, type TerminalToolbarProps } from './TerminalToolbar';
export { TerminalManager } from './TerminalManager';
export { TerminalTab } from './TerminalTab';
export { ProfileSelector } from './ProfileSelector';
export { ProfileManagement } from './ProfileManagement';
export { TerminalSearchOverlay } from './TerminalSearchOverlay';
export { SnippetManager } from './SnippetManager';

// Theme and UI enhancement components
export { ThemeSelector } from './ThemeSelector';
export { 
  TerminalStatusIndicator, 
  TabStatusIndicator, 
  DetailedStatusIndicator 
} from './TerminalStatusIndicator';
export { TerminalWindowChrome } from './TerminalWindowChrome';