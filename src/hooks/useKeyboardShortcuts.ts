import { useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: () => void;
}

export function useKeyboardShortcuts() {
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    setActiveTab,
    toggleSidebar,
    toggleBottomPanel,
  } = useLayoutStore();

  // Helper to check if modifier keys match
  const check_modifiers = useCallback((e: KeyboardEvent, shortcut: KeyboardShortcut) => {
    const is_mac = navigator.platform.toLowerCase().includes('mac');
    const cmd_or_ctrl = is_mac ? e.metaKey : e.ctrlKey;
    
    if (shortcut.cmd || shortcut.ctrl) {
      if (!cmd_or_ctrl) return false;
    }
    if (shortcut.shift && !e.shiftKey) return false;
    if (shortcut.alt && !e.altKey) return false;
    
    return true;
  }, []);

  // Handler for switching tabs by number
  const switch_to_tab_by_number = useCallback((number: number) => {
    const tab_index = number - 1;
    if (tabs[tab_index]) {
      setActiveTab(tabs[tab_index].id);
    }
  }, [tabs, setActiveTab]);

  // Handler for cycling through tabs
  const cycle_tabs = useCallback((direction: 'next' | 'prev') => {
    if (tabs.length === 0) return;
    
    const current_index = tabs.findIndex(t => t.id === activeTabId);
    let new_index: number;
    
    if (direction === 'next') {
      new_index = (current_index + 1) % tabs.length;
    } else {
      new_index = current_index - 1 < 0 ? tabs.length - 1 : current_index - 1;
    }
    
    setActiveTab(tabs[new_index].id);
  }, [tabs, activeTabId, setActiveTab]);

  // Define all shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Tab management
    {
      key: 't',
      cmd: true,
      ctrl: true,
      description: 'New terminal tab',
      handler: () => addTab({ title: 'Terminal', type: 'terminal' }),
    },
    {
      key: 'w',
      cmd: true,
      ctrl: true,
      description: 'Close current tab',
      handler: () => {
        if (activeTabId) {
          removeTab(activeTabId);
        }
      },
    },
    {
      key: 'Tab',
      cmd: true,
      ctrl: true,
      description: 'Next tab',
      handler: () => cycle_tabs('next'),
    },
    {
      key: 'Tab',
      cmd: true,
      ctrl: true,
      shift: true,
      description: 'Previous tab',
      handler: () => cycle_tabs('prev'),
    },
    // Panel toggles
    {
      key: 'b',
      cmd: true,
      ctrl: true,
      description: 'Toggle sidebar',
      handler: toggleSidebar,
    },
    {
      key: 'j',
      cmd: true,
      ctrl: true,
      description: 'Toggle bottom panel',
      handler: toggleBottomPanel,
    },
    // Quick open
    {
      key: 'n',
      cmd: true,
      ctrl: true,
      description: 'New code editor tab',
      handler: () => addTab({ title: 'Untitled', type: 'editor' }),
    },
    {
      key: 'p',
      cmd: true,
      ctrl: true,
      description: 'New browser preview tab',
      handler: () => addTab({ title: 'Browser Preview', type: 'browser' }),
    },
  ];

  // Add number key shortcuts for tab switching
  for (let i = 1; i <= 9; i++) {
    shortcuts.push({
      key: i.toString(),
      cmd: true,
      ctrl: true,
      description: `Switch to tab ${i}`,
      handler: () => switch_to_tab_by_number(i),
    });
  }

  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (e.key === shortcut.key && check_modifiers(e, shortcut)) {
          e.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handle_keydown);
    return () => window.removeEventListener('keydown', handle_keydown);
  }, [shortcuts, check_modifiers]);

  return { shortcuts };
}

// Export for documentation/help modal
export function getShortcutDescription(shortcut: KeyboardShortcut): string {
  const is_mac = navigator.platform.toLowerCase().includes('mac');
  const parts: string[] = [];
  
  if (shortcut.cmd || shortcut.ctrl) {
    parts.push(is_mac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push(is_mac ? '⌥' : 'Alt');
  parts.push(shortcut.key === 'Tab' ? '⇥' : shortcut.key.toUpperCase());
  
  return parts.join(is_mac ? '' : '+');
}