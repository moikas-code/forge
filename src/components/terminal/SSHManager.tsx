'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2, Wifi, WifiOff, Star, Search, Key, Settings } from 'lucide-react';
import { useTerminalPersistenceStore, SSHConnection } from '@/stores/terminalPersistenceStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';

interface SSHManagerProps {
  className?: string;
}

interface SSHFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  key_path: string;
  is_favorite: boolean;
  connection_options: Record<string, string>;
}

export function SSHManager({ className }: SSHManagerProps) {
  const [search_query, set_search_query] = useState('');
  const [is_form_open, set_is_form_open] = useState(false);
  const [editing_connection, set_editing_connection] = useState<SSHConnection | null>(null);
  const [testing_connection, set_testing_connection] = useState<string | null>(null);
  const [form_data, set_form_data] = useState<SSHFormData>({
    name: '',
    host: '',
    port: 22,
    username: '',
    key_path: '',
    is_favorite: false,
    connection_options: {
      'StrictHostKeyChecking': 'ask',
      'ConnectTimeout': '10',
    },
  });

  const {
    ssh_connections,
    default_ssh_key_path,
    add_ssh_connection,
    update_ssh_connection,
    delete_ssh_connection,
    get_favorite_connections,
    test_ssh_connection,
    set_default_ssh_key_path,
  } = useTerminalPersistenceStore();

  const { create_session } = useTerminalStore();

  // Filter connections based on search
  const filtered_connections = useMemo(() => {
    if (!search_query.trim()) return ssh_connections;

    const lower_query = search_query.toLowerCase();
    return ssh_connections.filter(conn =>
      conn.name.toLowerCase().includes(lower_query) ||
      conn.host.toLowerCase().includes(lower_query) ||
      conn.username.toLowerCase().includes(lower_query)
    );
  }, [ssh_connections, search_query]);

  // Sort connections: favorites first, then by name
  const sorted_connections = useMemo(() => {
    return [...filtered_connections].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered_connections]);

  const handle_form_submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form_data.name.trim() || !form_data.host.trim() || !form_data.username.trim()) {
      return;
    }

    const connection_data = {
      name: form_data.name.trim(),
      host: form_data.host.trim(),
      port: form_data.port,
      username: form_data.username.trim(),
      key_path: form_data.key_path.trim() || undefined,
      is_favorite: form_data.is_favorite,
      connection_options: form_data.connection_options,
    };

    if (editing_connection) {
      update_ssh_connection(editing_connection.id, connection_data);
    } else {
      add_ssh_connection(connection_data);
    }

    // Reset form
    set_form_data({
      name: '',
      host: '',
      port: 22,
      username: '',
      key_path: '',
      is_favorite: false,
      connection_options: {
        'StrictHostKeyChecking': 'ask',
        'ConnectTimeout': '10',
      },
    });
    set_editing_connection(null);
    set_is_form_open(false);
  };

  const handle_edit_connection = (connection: SSHConnection) => {
    set_form_data({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      username: connection.username,
      key_path: connection.key_path || '',
      is_favorite: connection.is_favorite,
      connection_options: { ...connection.connection_options },
    });
    set_editing_connection(connection);
    set_is_form_open(true);
  };

  const handle_delete_connection = (id: string) => {
    if (confirm('Are you sure you want to delete this SSH connection?')) {
      delete_ssh_connection(id);
    }
  };

  const handle_test_connection = async (id: string) => {
    set_testing_connection(id);
    try {
      const success = await test_ssh_connection(id);
      if (success) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed. Please check your settings.');
      }
    } catch (error) {
      alert('Connection test failed: ' + (error as Error).message);
    } finally {
      set_testing_connection(null);
    }
  };

  const handle_connect = async (connection: SSHConnection) => {
    // Create new terminal session with SSH connection
    const session_id = create_session({
      title: `SSH: ${connection.name}`,
    });

    try {
      // Wait a moment for terminal to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Build SSH command
      let ssh_command = `ssh ${connection.username}@${connection.host}`;
      if (connection.port !== 22) {
        ssh_command += ` -p ${connection.port}`;
      }
      if (connection.key_path) {
        ssh_command += ` -i "${connection.key_path}"`;
      }

      // Add connection options
      Object.entries(connection.connection_options).forEach(([key, value]) => {
        ssh_command += ` -o ${key}=${value}`;
      });

      // Send SSH command to terminal
      const bytes = new TextEncoder().encode(ssh_command + '\r');
      await invoke('write_to_terminal', {
        terminalId: session_id,
        data: Array.from(bytes)
      });

      // Update connection last used
      update_ssh_connection(connection.id, {
        last_connected: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to start SSH connection:', error);
      alert('Failed to start SSH connection: ' + (error as Error).message);
    }
  };

  const handle_toggle_favorite = (id: string) => {
    const connection = ssh_connections.find(c => c.id === id);
    if (connection) {
      update_ssh_connection(id, { is_favorite: !connection.is_favorite });
    }
  };

  const handle_connection_option_change = (key: string, value: string) => {
    set_form_data(prev => ({
      ...prev,
      connection_options: {
        ...prev.connection_options,
        [key]: value,
      },
    }));
  };

  const handle_browse_key_file = async () => {
    try {
      // This would open a file dialog in a real implementation
      // For now, we'll use a default path
      const file_path = await invoke<string>('select_ssh_key_file');
      set_form_data(prev => ({ ...prev, key_path: file_path }));
    } catch (error) {
      console.error('Failed to select key file:', error);
    }
  };

  const cancel_form = () => {
    set_form_data({
      name: '',
      host: '',
      port: 22,
      username: '',
      key_path: '',
      is_favorite: false,
      connection_options: {
        'StrictHostKeyChecking': 'ask',
        'ConnectTimeout': '10',
      },
    });
    set_editing_connection(null);
    set_is_form_open(false);
  };

  return (
    <div className={`ssh-manager ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          SSH Connections
        </h2>
        <Button
          onClick={() => set_is_form_open(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Connection
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search connections..."
          value={search_query}
          onChange={(e) => set_search_query(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Connection Form */}
      {is_form_open && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editing_connection ? 'Edit Connection' : 'New SSH Connection'}
          </h3>

          <form onSubmit={handle_form_submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  required
                  value={form_data.name}
                  onChange={(e) => set_form_data(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  required
                  value={form_data.host}
                  onChange={(e) => set_form_data(prev => ({ ...prev, host: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="server.example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={form_data.username}
                  onChange={(e) => set_form_data(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={form_data.port}
                  onChange={(e) => set_form_data(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SSH Key Path (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form_data.key_path}
                  onChange={(e) => set_form_data(prev => ({ ...prev, key_path: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={default_ssh_key_path}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handle_browse_key_file}
                >
                  <Key className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_favorite"
                checked={form_data.is_favorite}
                onChange={(e) => set_form_data(prev => ({ ...prev, is_favorite: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="is_favorite" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Add to favorites
              </label>
            </div>

            {/* Advanced Options */}
            <details className="border border-gray-200 dark:border-gray-600 rounded-lg">
              <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Advanced Options
              </summary>
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      StrictHostKeyChecking
                    </label>
                    <select
                      value={form_data.connection_options.StrictHostKeyChecking || 'ask'}
                      onChange={(e) => handle_connection_option_change('StrictHostKeyChecking', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="ask">Ask</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Connect Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={form_data.connection_options.ConnectTimeout || '10'}
                      onChange={(e) => handle_connection_option_change('ConnectTimeout', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </details>

            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                {editing_connection ? 'Update' : 'Create'} Connection
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={cancel_form}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Connections List */}
      <div className="space-y-3">
        {sorted_connections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No SSH connections found</p>
            <p className="text-sm mt-1">
              {search_query ? 'Try a different search term' : 'Create your first connection to get started'}
            </p>
          </div>
        ) : (
          sorted_connections.map(connection => (
            <div
              key={connection.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {connection.name}
                    </h3>
                    {connection.is_favorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-mono">{connection.username}@{connection.host}</span>
                      {connection.port !== 22 && <span>:{connection.port}</span>}
                    </p>
                    {connection.key_path && (
                      <p className="flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        {connection.key_path}
                      </p>
                    )}
                    {connection.last_connected && (
                      <p className="text-xs">
                        Last connected: {new Date(connection.last_connected).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handle_toggle_favorite(connection.id)}
                    className={`${connection.is_favorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
                  >
                    <Star className={`w-4 h-4 ${connection.is_favorite ? 'fill-current' : ''}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handle_test_connection(connection.id)}
                    disabled={testing_connection === connection.id}
                    className="text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    {testing_connection === connection.id ? (
                      <WifiOff className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Wifi className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handle_edit_connection(connection)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handle_delete_connection(connection.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handle_connect(connection)}
                    className="bg-green-600 hover:bg-green-700 text-white ml-2"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}