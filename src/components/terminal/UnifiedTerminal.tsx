'use client';

import { useEffect, useState } from 'react';
import { Terminal as TauriTerminal } from './Terminal';
import { ElectronTerminal } from './ElectronTerminal';
import { isElectron } from '@/services/electron';

interface TerminalProps {
  className?: string;
  terminalId?: string;
  actions?: {
    onClear: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onNewTab?: () => void;
  };
  pane_id?: string;
  theme_id?: string;
  show_window_chrome?: boolean;
  title?: string;
  aria_label?: string;
  aria_describedby?: string;
}

export function UnifiedTerminal(props: TerminalProps) {
  const [environment, setEnvironment] = useState<'electron' | 'tauri' | 'web' | null>(null);

  useEffect(() => {
    // Detect environment
    if (isElectron()) {
      setEnvironment('electron');
    } else if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      setEnvironment('tauri');
    } else {
      setEnvironment('web');
    }
  }, []);

  if (!environment) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Initializing terminal...</div>
      </div>
    );
  }

  if (environment === 'electron') {
    return <ElectronTerminal {...props} />;
  }

  if (environment === 'tauri') {
    return <TauriTerminal {...props} />;
  }

  // Web fallback
  return (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center text-gray-400">
        <p>Terminal requires desktop environment</p>
        <p className="text-sm mt-2">Please use the Electron or Tauri app</p>
      </div>
    </div>
  );
}

// Export as default Terminal
export { UnifiedTerminal as Terminal };