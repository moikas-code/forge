'use client';

import { isElectron } from '@/services/electron';
import { ElectronTerminal } from './ElectronTerminal';

interface TerminalProps {
  className?: string;
  terminalId?: string;
  actions?: any;
  pane_id?: string;
  theme_id?: string;
  show_window_chrome?: boolean;
  title?: string;
  aria_label?: string;
  aria_describedby?: string;
  autoFocus?: boolean;
}

export function UniversalTerminal(props: TerminalProps) {
  // For now, we only support Electron environment
  if (!isElectron()) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 text-gray-400 ${props.className || ''}`}>
        <div className="text-center">
          <p className="text-lg mb-2">Terminal requires Electron environment</p>
          <p className="text-sm">Please run the app in Electron mode</p>
        </div>
      </div>
    );
  }

  return <ElectronTerminal {...props} />;
}