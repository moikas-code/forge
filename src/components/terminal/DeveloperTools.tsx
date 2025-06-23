'use client';

import React, { useState, useEffect } from 'react';
import { Command, Terminal, Code2, Wifi, History, Settings, Keyboard } from 'lucide-react';
import { useTerminalPersistenceStore } from '@/stores/terminalPersistenceStore';
import { CommandPalette } from './CommandPalette';
import { SnippetManager } from './SnippetManager';
import { SSHManager } from './SSHManager';
import { Button } from '@/components/ui/button';

interface DeveloperToolsProps {
  className?: string;
}

type ToolsTab = 'palette' | 'snippets' | 'ssh' | 'sessions' | 'settings';

export function DeveloperTools({ className }: DeveloperToolsProps) {
  const [active_tab, set_active_tab] = useState<ToolsTab>('snippets');
  const [is_palette_open, set_is_palette_open] = useState(false);

  const {
    is_command_palette_open,
    toggle_command_palette,
    close_command_palette,
    saved_sessions,
    auto_save_enabled,
    restore_on_startup,
    max_saved_sessions,
    default_ssh_key_path,
    set_auto_save,
    set_restore_on_startup,
    set_max_saved_sessions,
    set_default_ssh_key_path,
    delete_saved_session,
    clear_all_saved_sessions,
    restore_session,
  } = useTerminalPersistenceStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + Shift + P
      if (e.key === 'P' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle_command_palette();
      }
    };

    document.addEventListener('keydown', handle_keydown);
    return () => document.removeEventListener('keydown', handle_keydown);
  }, [toggle_command_palette]);

  const tabs = [
    {
      id: 'snippets' as ToolsTab,
      label: 'Snippets',
      icon: <Code2 className="w-4 h-4" />,
      description: 'Command snippets and templates',
    },
    {
      id: 'ssh' as ToolsTab,
      label: 'SSH',
      icon: <Wifi className="w-4 h-4" />,
      description: 'SSH connection manager',
    },
    {
      id: 'sessions' as ToolsTab,
      label: 'Sessions',
      icon: <History className="w-4 h-4" />,
      description: 'Saved terminal sessions',
    },
    {
      id: 'settings' as ToolsTab,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      description: 'Developer tools settings',
    },
  ];

  const handle_restore_session = async (session_id: string) => {
    try {
      const success = await restore_session(session_id);
      if (success) {
        console.log('Session restored successfully');
      } else {
        alert('Failed to restore session. Please check the logs.');
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      alert('Error restoring session: ' + (error as Error).message);
    }
  };

  const handle_delete_session = (session_id: string) => {
    if (confirm('Are you sure you want to delete this saved session?')) {
      delete_saved_session(session_id);
    }
  };

  const handle_clear_all_sessions = () => {
    if (confirm('Are you sure you want to delete all saved sessions? This action cannot be undone.')) {
      clear_all_saved_sessions();
    }
  };

  return (
    <>
      <div className={`developer-tools ${className || ''}`}>
        {/* Header with Command Palette Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Developer Tools
          </h1>
          <Button
            onClick={toggle_command_palette}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Command className="w-4 h-4 mr-2" />
            Command Palette
            <span className="ml-2 text-xs opacity-75">⌘⇧P</span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => set_active_tab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  active_tab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {active_tab === 'snippets' && (
            <SnippetManager className="h-full" />
          )}

          {active_tab === 'ssh' && (
            <SSHManager className="h-full" />
          )}

          {active_tab === 'sessions' && (
            <div className="saved-sessions">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Saved Sessions
                </h2>
                {saved_sessions.length > 0 && (
                  <Button
                    onClick={handle_clear_all_sessions}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {saved_sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No saved sessions</p>
                  <p className="text-sm mt-1">
                    Sessions will be saved automatically when enabled in settings
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {saved_sessions.map(session => (
                    <div
                      key={session.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {session.title}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p><strong>Directory:</strong> {session.cwd}</p>
                            <p><strong>Shell:</strong> {session.shell}</p>
                            <p><strong>Commands:</strong> {session.command_history.length}</p>
                            <p><strong>Created:</strong> {new Date(session.created_at).toLocaleString()}</p>
                            <p><strong>Last Active:</strong> {new Date(session.last_active).toLocaleString()}</p>
                            <p>
                              <strong>Status:</strong>{' '}
                              <span className={session.is_running ? 'text-green-600' : 'text-gray-500'}>
                                {session.is_running ? 'Running' : 'Stopped'}
                                {session.exit_code !== undefined && ` (exit ${session.exit_code})`}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => handle_restore_session(session.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Restore
                          </Button>
                          <Button
                            onClick={() => handle_delete_session(session.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active_tab === 'settings' && (
            <div className="settings">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Settings
              </h2>

              <div className="space-y-6">
                {/* Session Persistence Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Session Persistence
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auto_save"
                        checked={auto_save_enabled}
                        onChange={(e) => set_auto_save(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="auto_save" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-save terminal sessions
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="restore_on_startup"
                        checked={restore_on_startup}
                        onChange={(e) => set_restore_on_startup(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="restore_on_startup" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Restore sessions on startup
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum saved sessions
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={max_saved_sessions}
                        onChange={(e) => set_max_saved_sessions(parseInt(e.target.value) || 10)}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SSH Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    SSH Configuration
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default SSH key path
                    </label>
                    <input
                      type="text"
                      value={default_ssh_key_path}
                      onChange={(e) => set_default_ssh_key_path(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Keyboard Shortcuts
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Command Palette</span>
                      <div className="flex items-center gap-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Keyboard className="w-3 h-3" />
                        <span>⌘⇧P</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">New Terminal</span>
                      <div className="flex items-center gap-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Keyboard className="w-3 h-3" />
                        <span>⌘T</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Close Terminal</span>
                      <div className="flex items-center gap-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Keyboard className="w-3 h-3" />
                        <span>⌘W</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Copy Path</span>
                      <div className="flex items-center gap-1 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Keyboard className="w-3 h-3" />
                        <span>⌘⇧C</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette Overlay */}
      <CommandPalette
        is_open={is_command_palette_open}
        on_close={close_command_palette}
      />
    </>
  );
}