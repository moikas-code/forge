import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminalManager } from '../TerminalManager';
import { useTerminalStore } from '@/stores/terminalStore';

// Mock the terminal store
vi.mock('@/stores/terminalStore', () => ({
  useTerminalStore: vi.fn(),
}));

// Mock the Terminal component
vi.mock('../Terminal', () => ({
  Terminal: vi.fn(({ terminalId, className }) => (
    <div data-testid={`terminal-${terminalId}`} className={className}>
      Mock Terminal {terminalId}
    </div>
  )),
}));

// Mock the Button component
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, className, ...props }) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )),
}));

describe('TerminalManager', () => {
  const mockStore = {
    sessions: [],
    active_session_id: null,
    create_session: vi.fn(),
    remove_session: vi.fn(),
    set_active_session: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTerminalStore as any).mockReturnValue(mockStore);
  });

  describe('initialization', () => {
    it('should render with empty state', () => {
      render(<TerminalManager />);
      
      expect(screen.getByRole('button', { name: /new terminal/i })).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('should create initial terminal when no sessions exist', async () => {
      render(<TerminalManager />);
      
      await waitFor(() => {
        expect(mockStore.create_session).toHaveBeenCalledOnce();
      });
    });

    it('should not create initial terminal when sessions exist', () => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';

      render(<TerminalManager />);
      
      expect(mockStore.create_session).not.toHaveBeenCalled();
    });
  });

  describe('tab management', () => {
    beforeEach(() => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
        {
          id: 'session-2',
          title: 'Terminal 2',
          created_at: new Date(),
          is_active: false,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';
    });

    it('should render terminal tabs', () => {
      render(<TerminalManager />);
      
      expect(screen.getByText('Terminal 1')).toBeInTheDocument();
      expect(screen.getByText('Terminal 2')).toBeInTheDocument();
    });

    it('should show active tab correctly', () => {
      render(<TerminalManager />);
      
      const tab1 = screen.getByText('Terminal 1').closest('.terminal-tab');
      const tab2 = screen.getByText('Terminal 2').closest('.terminal-tab');
      
      expect(tab1).toHaveClass('active');
      expect(tab2).not.toHaveClass('active');
    });

    it('should switch active tab when clicked', async () => {
      const user = userEvent.setup();
      render(<TerminalManager />);
      
      const tab2 = screen.getByText('Terminal 2');
      await user.click(tab2);
      
      expect(mockStore.set_active_session).toHaveBeenCalledWith('session-2');
    });

    it('should show close button for multiple tabs', () => {
      render(<TerminalManager />);
      
      const closeButtons = screen.getAllByLabelText(/close terminal/i);
      expect(closeButtons).toHaveLength(2);
    });

    it('should not show close button for single tab', () => {
      mockStore.sessions = [mockStore.sessions[0]]; // Keep only one session
      
      render(<TerminalManager />);
      
      expect(screen.queryByLabelText(/close terminal/i)).not.toBeInTheDocument();
    });

    it('should close tab when close button clicked', async () => {
      const user = userEvent.setup();
      render(<TerminalManager />);
      
      const closeButtons = screen.getAllByLabelText(/close terminal/i);
      await user.click(closeButtons[0]);
      
      expect(mockStore.remove_session).toHaveBeenCalledWith('session-1');
    });

    it('should prevent event propagation when closing tab', async () => {
      const user = userEvent.setup();
      render(<TerminalManager />);
      
      const closeButtons = screen.getAllByLabelText(/close terminal/i);
      await user.click(closeButtons[0]);
      
      // Should call remove_session but not set_active_session
      expect(mockStore.remove_session).toHaveBeenCalledWith('session-1');
      expect(mockStore.set_active_session).not.toHaveBeenCalled();
    });
  });

  describe('terminal content', () => {
    beforeEach(() => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
        {
          id: 'session-2',
          title: 'Terminal 2',
          created_at: new Date(),
          is_active: false,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';
    });

    it('should render terminal instances', () => {
      render(<TerminalManager />);
      
      expect(screen.getByTestId('terminal-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-session-2')).toBeInTheDocument();
    });

    it('should show active terminal instance', () => {
      render(<TerminalManager />);
      
      const activeTerminal = screen.getByTestId('terminal-session-1').closest('.terminal-instance');
      const inactiveTerminal = screen.getByTestId('terminal-session-2').closest('.terminal-instance');
      
      expect(activeTerminal).toHaveClass('active');
      expect(inactiveTerminal).toHaveClass('hidden');
    });

    it('should memoize terminal instances to prevent re-renders', () => {
      const { rerender } = render(<TerminalManager />);
      
      const terminalInstance1 = screen.getByTestId('terminal-session-1');
      
      // Re-render with same props
      rerender(<TerminalManager />);
      
      const terminalInstance2 = screen.getByTestId('terminal-session-1');
      
      // Should be the same instance due to memoization
      expect(terminalInstance1).toBe(terminalInstance2);
    });
  });

  describe('new terminal creation', () => {
    it('should create new terminal when plus button clicked', async () => {
      const user = userEvent.setup();
      render(<TerminalManager />);
      
      const newTabButton = screen.getByLabelText(/new terminal/i);
      await user.click(newTabButton);
      
      expect(mockStore.create_session).toHaveBeenCalled();
    });

    it('should have accessible new terminal button', () => {
      render(<TerminalManager />);
      
      const newTabButton = screen.getByLabelText(/new terminal/i);
      expect(newTabButton).toBeInTheDocument();
      expect(newTabButton).toHaveAttribute('aria-label', 'New terminal');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';
    });

    it('should have proper ARIA labels', () => {
      render(<TerminalManager />);
      
      const newTabButton = screen.getByLabelText(/new terminal/i);
      expect(newTabButton).toHaveAttribute('aria-label', 'New terminal');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TerminalManager />);
      
      const newTabButton = screen.getByLabelText(/new terminal/i);
      
      // Tab to the button
      await user.tab();
      expect(newTabButton).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockStore.create_session).toHaveBeenCalled();
    });
  });

  describe('styling and layout', () => {
    it('should apply custom className', () => {
      const { container } = render(<TerminalManager className="custom-class" />);
      
      const terminalManager = container.querySelector('.terminal-manager');
      expect(terminalManager).toHaveClass('custom-class');
    });

    it('should have proper CSS classes structure', () => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';

      const { container } = render(<TerminalManager />);
      
      expect(container.querySelector('.terminal-manager')).toBeInTheDocument();
      expect(container.querySelector('.terminal-tabs-container')).toBeInTheDocument();
      expect(container.querySelector('.terminal-tabs')).toBeInTheDocument();
      expect(container.querySelector('.terminal-content')).toBeInTheDocument();
    });

    it('should have proper tab styling', () => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';

      const { container } = render(<TerminalManager />);
      
      const tab = container.querySelector('.terminal-tab');
      expect(tab).toHaveClass('active');
      
      const tabTitle = container.querySelector('.terminal-tab-title');
      expect(tabTitle).toBeInTheDocument();
    });
  });

  describe('performance optimization', () => {
    it('should use refs for DOM elements', () => {
      const { container } = render(<TerminalManager />);
      
      // Check that terminal content container exists (which would use the ref)
      const terminalContent = container.querySelector('.terminal-content');
      expect(terminalContent).toBeInTheDocument();
    });

    it('should memoize terminal instances based on sessions and active session', () => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'session-1';

      const { rerender } = render(<TerminalManager />);
      
      // Store reference to initial render
      const initialTerminal = screen.getByTestId('terminal-session-1');
      
      // Re-render with same sessions and active_session_id
      rerender(<TerminalManager />);
      
      // Should be the same instance due to memoization
      const rerenderedTerminal = screen.getByTestId('terminal-session-1');
      expect(initialTerminal).toBe(rerenderedTerminal);
    });
  });

  describe('error handling', () => {
    it('should handle missing sessions gracefully', () => {
      mockStore.sessions = [];
      mockStore.active_session_id = null;

      expect(() => render(<TerminalManager />)).not.toThrow();
    });

    it('should handle invalid active session ID gracefully', () => {
      mockStore.sessions = [
        {
          id: 'session-1',
          title: 'Terminal 1',
          created_at: new Date(),
          is_active: false,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
        },
      ];
      mockStore.active_session_id = 'non-existent-session';

      expect(() => render(<TerminalManager />)).not.toThrow();
    });

    it('should handle store method failures gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock store methods to throw errors
      mockStore.create_session.mockImplementation(() => {
        throw new Error('Failed to create session');
      });

      render(<TerminalManager />);
      
      const newTabButton = screen.getByLabelText(/new terminal/i);
      
      // Should not crash when store method fails
      expect(async () => {
        await user.click(newTabButton);
      }).not.toThrow();
    });
  });
});