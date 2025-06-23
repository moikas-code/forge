import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeveloperTools } from './DeveloperTools';
import { useTerminalPersistenceStore } from '@/stores/terminalPersistenceStore';
import { useTerminalStore } from '@/stores/terminalStore';

// Mock the stores
vi.mock('@/stores/terminalPersistenceStore');
vi.mock('@/stores/terminalStore');

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('DeveloperTools', () => {
  const mockPersistenceStore = {
    is_command_palette_open: false,
    toggle_command_palette: vi.fn(),
    close_command_palette: vi.fn(),
    saved_sessions: [],
    auto_save_enabled: true,
    restore_on_startup: false,
    max_saved_sessions: 10,
    default_ssh_key_path: '~/.ssh/id_rsa',
    set_auto_save: vi.fn(),
    set_restore_on_startup: vi.fn(),
    set_max_saved_sessions: vi.fn(),
    set_default_ssh_key_path: vi.fn(),
    delete_saved_session: vi.fn(),
    clear_all_saved_sessions: vi.fn(),
    restore_session: vi.fn(),
    snippets: [
      {
        id: 'test-snippet',
        name: 'Test Snippet',
        description: 'A test snippet',
        command: 'echo "test"',
        category: 'Test',
        tags: ['test'],
        is_custom: true,
        created_at: '2023-01-01T00:00:00Z',
        usage_count: 0,
      },
    ],
    snippet_categories: ['Test', 'Custom'],
    ssh_connections: [
      {
        id: 'test-ssh',
        name: 'Test Server',
        host: 'test.example.com',
        port: 22,
        username: 'testuser',
        is_favorite: false,
        connection_options: {},
      },
    ],
    add_snippet: vi.fn(),
    update_snippet: vi.fn(),
    delete_snippet: vi.fn(),
    increment_snippet_usage: vi.fn(),
    get_snippets_by_category: vi.fn(),
    search_snippets: vi.fn(),
    add_ssh_connection: vi.fn(),
    update_ssh_connection: vi.fn(),
    delete_ssh_connection: vi.fn(),
    get_favorite_connections: vi.fn(),
    test_ssh_connection: vi.fn(),
  };

  const mockTerminalStore = {
    sessions: [
      {
        id: 'test-session',
        title: 'Terminal 1',
        created_at: new Date(),
        is_active: true,
        current_directory: '/home/user',
        command_history: ['ls', 'pwd'],
        output_buffer: [],
      },
    ],
    active_session_id: 'test-session',
    create_session: vi.fn(),
    remove_session: vi.fn(),
    clear_all_sessions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTerminalPersistenceStore as any).mockReturnValue(mockPersistenceStore);
    (useTerminalStore as any).mockReturnValue(mockTerminalStore);
  });

  it('renders developer tools interface', () => {
    render(<DeveloperTools />);
    
    expect(screen.getByText('Developer Tools')).toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
    expect(screen.getByText('Snippets')).toBeInTheDocument();
    expect(screen.getByText('SSH')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('opens command palette when button is clicked', () => {
    render(<DeveloperTools />);
    
    const paletteButton = screen.getByText('Command Palette');
    fireEvent.click(paletteButton);
    
    expect(mockPersistenceStore.toggle_command_palette).toHaveBeenCalledOnce();
  });

  it('displays snippets in snippets tab', () => {
    render(<DeveloperTools />);
    
    // Should be on snippets tab by default
    expect(screen.getByText('Test Snippet')).toBeInTheDocument();
    expect(screen.getByText('A test snippet')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<DeveloperTools />);
    
    // Click SSH tab
    const sshTab = screen.getByText('SSH');
    fireEvent.click(sshTab);
    
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('testuser@test.example.com')).toBeInTheDocument();
  });

  it('shows saved sessions in sessions tab', () => {
    const mockPersistenceStoreWithSessions = {
      ...mockPersistenceStore,
      saved_sessions: [
        {
          id: 'saved-session',
          title: 'Saved Terminal',
          cwd: '/home/user',
          shell: '/bin/bash',
          environment_variables: {},
          command_history: ['echo hello'],
          scroll_position: 0,
          created_at: '2023-01-01T00:00:00Z',
          last_active: '2023-01-01T01:00:00Z',
          is_running: false,
        },
      ],
    };
    
    (useTerminalPersistenceStore as any).mockReturnValue(mockPersistenceStoreWithSessions);
    
    render(<DeveloperTools />);
    
    // Click sessions tab
    const sessionsTab = screen.getByText('Sessions');
    fireEvent.click(sessionsTab);
    
    expect(screen.getByText('Saved Terminal')).toBeInTheDocument();
    expect(screen.getByText('Directory:')).toBeInTheDocument();
    expect(screen.getByText('/home/user')).toBeInTheDocument();
  });

  it('displays settings in settings tab', () => {
    render(<DeveloperTools />);
    
    // Click settings tab
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    expect(screen.getByText('Session Persistence')).toBeInTheDocument();
    expect(screen.getByText('SSH Configuration')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', () => {
    render(<DeveloperTools />);
    
    // Simulate Cmd+Shift+P
    fireEvent.keyDown(document, {
      key: 'P',
      shiftKey: true,
      metaKey: true,
    });
    
    expect(mockPersistenceStore.toggle_command_palette).toHaveBeenCalledOnce();
  });

  it('updates settings when changed', async () => {
    render(<DeveloperTools />);
    
    // Click settings tab
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    // Toggle auto-save setting
    const autoSaveCheckbox = screen.getByLabelText('Auto-save terminal sessions');
    fireEvent.click(autoSaveCheckbox);
    
    expect(mockPersistenceStore.set_auto_save).toHaveBeenCalledWith(false);
  });
});