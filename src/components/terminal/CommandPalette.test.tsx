import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import { useTerminalPersistenceStore } from '@/stores/terminalPersistenceStore';
import { useTerminalStore } from '@/stores/terminalStore';

// Mock the stores
vi.mock('@/stores/terminalPersistenceStore');
vi.mock('@/stores/terminalStore');

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('CommandPalette', () => {
  const mockOnClose = vi.fn();
  
  const mockPersistenceStore = {
    snippets: [
      {
        id: 'git-status',
        name: 'Git Status',
        description: 'Check git repository status',
        command: 'git status',
        category: 'Git',
        tags: ['git', 'status'],
        is_custom: false,
        created_at: '2023-01-01T00:00:00Z',
        usage_count: 5,
      },
      {
        id: 'npm-install',
        name: 'NPM Install',
        description: 'Install npm dependencies',
        command: 'npm install',
        category: 'Node.js',
        tags: ['npm', 'install'],
        is_custom: false,
        created_at: '2023-01-01T00:00:00Z',
        usage_count: 3,
      },
    ],
    ssh_connections: [
      {
        id: 'prod-server',
        name: 'Production Server',
        host: 'prod.example.com',
        port: 22,
        username: 'deploy',
        is_favorite: true,
        connection_options: {},
      },
    ],
    saved_sessions: [
      {
        id: 'session-1',
        title: 'Development Session',
        cwd: '/home/user/project',
        shell: '/bin/bash',
        environment_variables: {},
        command_history: ['npm run dev'],
        scroll_position: 0,
        created_at: '2023-01-01T00:00:00Z',
        last_active: '2023-01-01T01:00:00Z',
        is_running: false,
      },
    ],
    set_palette_query: vi.fn(),
    add_snippet: vi.fn(),
    increment_snippet_usage: vi.fn(),
    search_snippets: vi.fn((query) => 
      mockPersistenceStore.snippets.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.command.toLowerCase().includes(query.toLowerCase())
      )
    ),
    update_ssh_connection: vi.fn(),
    restore_session: vi.fn(),
  };

  const mockTerminalStore = {
    sessions: [
      {
        id: 'active-terminal',
        title: 'Terminal 1',
        created_at: new Date(),
        is_active: true,
        current_directory: '/home/user',
        command_history: ['ls', 'pwd'],
        output_buffer: [],
      },
    ],
    active_session_id: 'active-terminal',
    create_session: vi.fn(() => 'new-session-id'),
    remove_session: vi.fn(),
    clear_all_sessions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTerminalPersistenceStore as any).mockReturnValue(mockPersistenceStore);
    (useTerminalStore as any).mockReturnValue(mockTerminalStore);
  });

  it('renders when open', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Snippets')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CommandPalette is_open={false} on_close={mockOnClose} />);
    
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('displays terminal actions', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    expect(screen.getByText('New Terminal')).toBeInTheDocument();
    expect(screen.getByText('Close Current Terminal')).toBeInTheDocument();
  });

  it('displays snippets', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    expect(screen.getByText('Git Status')).toBeInTheDocument();
    expect(screen.getByText('NPM Install')).toBeInTheDocument();
  });

  it('filters actions based on search query', async () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(searchInput, { target: { value: 'git' } });
    
    await waitFor(() => {
      expect(screen.getByText('Git Status')).toBeInTheDocument();
      expect(screen.queryByText('NPM Install')).not.toBeInTheDocument();
    });
  });

  it('executes terminal action when clicked', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    const newTerminalAction = screen.getByText('New Terminal');
    fireEvent.click(newTerminalAction);
    
    expect(mockTerminalStore.create_session).toHaveBeenCalledOnce();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('closes when escape key is pressed', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('navigates with arrow keys', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    // Arrow down should select first item
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    
    // Arrow up should go back to first item (boundary check)
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    
    // Should not throw any errors
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('executes action with enter key', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    // First action should be "New Terminal"
    fireEvent.keyDown(document, { key: 'Enter' });
    
    expect(mockTerminalStore.create_session).toHaveBeenCalledOnce();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('displays SSH connections', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    expect(screen.getByText('Connect to Production Server')).toBeInTheDocument();
  });

  it('displays saved sessions', () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    expect(screen.getByText('Restore: Development Session')).toBeInTheDocument();
  });

  it('shows empty state when no matches found', async () => {
    render(<CommandPalette is_open={true} on_close={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No matching commands found')).toBeInTheDocument();
    });
  });
});