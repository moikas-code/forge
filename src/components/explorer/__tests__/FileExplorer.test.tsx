import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileExplorer } from '../FileExplorer';

// Mock the stores
jest.mock('@/stores/fileExplorerStore', () => ({
  use_file_explorer_store: () => ({
    current_directory: '/home',
    is_loading: false,
    error: null,
    initialize: jest.fn(),
    refresh_directory: jest.fn(),
    set_error: jest.fn(),
  }),
}));

jest.mock('@/stores/layoutStore', () => ({
  useLayoutStore: () => ({
    updateTab: jest.fn(),
  }),
}));

// Mock Tauri
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

describe('FileExplorer', () => {
  it('renders without crashing', () => {
    render(<FileExplorer tab_id="test-tab" />);
    
    // Should render the main file explorer interface
    expect(screen.getByText('Loading directory...')).toBeInTheDocument();
  });

  it('displays error dialog when there is an error', () => {
    const mockStore = {
      current_directory: '/home',
      is_loading: false,
      error: 'Test error message',
      initialize: jest.fn(),
      refresh_directory: jest.fn(),
      set_error: jest.fn(),
    };

    jest.doMock('@/stores/fileExplorerStore', () => ({
      use_file_explorer_store: () => mockStore,
    }));

    render(<FileExplorer tab_id="test-tab" />);
    
    // Should display error in alert dialog
    expect(screen.getByText('File Explorer Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
});

export {};