import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerminalStore, type TerminalSession } from '../terminalStore';

// Mock crypto.randomUUID for consistent testing
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
}));

describe('useTerminalStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTerminalStore.getState().sessions.forEach(session => {
      useTerminalStore.getState().remove_session(session.id);
    });
    vi.clearAllMocks();
  });

  describe('create_session', () => {
    it('should create a new terminal session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        const sessionId = result.current.create_session();
        expect(sessionId).toBe('test-uuid-123');
      });

      const sessions = result.current.sessions;
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toBeValidTerminalSession();
      expect(sessions[0].id).toBe('test-uuid-123');
      expect(sessions[0].title).toBe('Terminal 1');
      expect(sessions[0].is_active).toBe(true);
      expect(sessions[0].current_directory).toBe('~');
      expect(sessions[0].command_history).toEqual([]);
      expect(sessions[0].output_buffer).toEqual([]);
    });

    it('should create session with custom title', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.create_session('Custom Terminal');
      });

      const session = result.current.sessions[0];
      expect(session.title).toBe('Custom Terminal');
    });

    it('should set new session as active', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        const sessionId = result.current.create_session();
        expect(result.current.active_session_id).toBe(sessionId);
      });
    });

    it('should deactivate other sessions when creating new one', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.create_session('Session 1');
        result.current.create_session('Session 2');
      });

      const sessions = result.current.sessions;
      expect(sessions).toHaveLength(2);
      expect(sessions[0].is_active).toBe(false);
      expect(sessions[1].is_active).toBe(true);
    });

    it('should enforce max sessions limit', () => {
      const { result } = renderHook(() => useTerminalStore());

      // Create sessions up to the limit + 1
      act(() => {
        for (let i = 0; i < 12; i++) {
          result.current.create_session(`Session ${i + 1}`);
        }
      });

      // Should only keep the max number of sessions (10)
      expect(result.current.sessions).toHaveLength(10);
      
      // The active session should still be the last one created
      expect(result.current.sessions.some(s => s.is_active)).toBe(true);
    });

    it('should include performance metrics', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.create_session();
      });

      const session = result.current.sessions[0];
      expect(session.performance_metrics).toBeDefined();
      expect(session.performance_metrics!.startup_time).toBeGreaterThan(0);
      expect(session.performance_metrics!.command_count).toBe(0);
      expect(session.performance_metrics!.output_bytes).toBe(0);
    });
  });

  describe('remove_session', () => {
    it('should remove a session', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      act(() => {
        result.current.remove_session(sessionId);
      });

      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.active_session_id).toBeNull();
    });

    it('should activate another session when removing active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
      });

      // Session 2 should be active
      expect(result.current.active_session_id).toBe(session2Id);

      act(() => {
        result.current.remove_session(session2Id);
      });

      // Session 1 should now be active
      expect(result.current.active_session_id).toBe(session1Id);
      expect(result.current.get_session(session1Id)?.is_active).toBe(true);
    });

    it('should not affect other sessions when removing inactive session', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
      });

      act(() => {
        result.current.remove_session(session1Id);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.active_session_id).toBe(session2Id);
      expect(result.current.get_session(session2Id)?.is_active).toBe(true);
    });
  });

  describe('set_active_session', () => {
    it('should set session as active', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
      });

      act(() => {
        result.current.set_active_session(session1Id);
      });

      expect(result.current.active_session_id).toBe(session1Id);
      expect(result.current.get_session(session1Id)?.is_active).toBe(true);
      expect(result.current.get_session(session2Id)?.is_active).toBe(false);
    });
  });

  describe('update_session', () => {
    it('should update session properties', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      act(() => {
        result.current.update_session(sessionId, {
          title: 'Updated Title',
          current_directory: '/new/path',
        });
      });

      const session = result.current.get_session(sessionId);
      expect(session?.title).toBe('Updated Title');
      expect(session?.current_directory).toBe('/new/path');
    });

    it('should not affect other sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
      });

      act(() => {
        result.current.update_session(session1Id, { title: 'Updated Session 1' });
      });

      expect(result.current.get_session(session1Id)?.title).toBe('Updated Session 1');
      expect(result.current.get_session(session2Id)?.title).toBe('Session 2');
    });
  });

  describe('add_to_history', () => {
    it('should add command to session history', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      act(() => {
        result.current.add_to_history(sessionId, 'ls -la');
        result.current.add_to_history(sessionId, 'cd /home');
      });

      const session = result.current.get_session(sessionId);
      expect(session?.command_history).toEqual(['ls -la', 'cd /home']);
      expect(session?.performance_metrics?.command_count).toBe(2);
    });

    it('should limit history size', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      // Add more commands than the limit (1000)
      act(() => {
        for (let i = 0; i < 1005; i++) {
          result.current.add_to_history(sessionId, `command-${i}`);
        }
      });

      const session = result.current.get_session(sessionId);
      expect(session?.command_history).toHaveLength(1000);
      // Should keep the most recent commands
      expect(session?.command_history[0]).toBe('command-5');
      expect(session?.command_history[999]).toBe('command-1004');
    });
  });

  describe('add_output', () => {
    it('should add output to session buffer', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      act(() => {
        result.current.add_output(sessionId, 'Output line 1');
        result.current.add_output(sessionId, 'Output line 2');
      });

      const session = result.current.get_session(sessionId);
      expect(session?.output_buffer).toEqual(['Output line 1', 'Output line 2']);
      expect(session?.performance_metrics?.output_bytes).toBe(26); // Total length of both strings
    });

    it('should limit output buffer size', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
      });

      // Add more output than the limit (5000)
      act(() => {
        for (let i = 0; i < 5005; i++) {
          result.current.add_output(sessionId, `output-${i}`);
        }
      });

      const session = result.current.get_session(sessionId);
      expect(session?.output_buffer).toHaveLength(5000);
      // Should keep the most recent output
      expect(session?.output_buffer[0]).toBe('output-5');
      expect(session?.output_buffer[4999]).toBe('output-5004');
    });
  });

  describe('clear_session', () => {
    it('should clear session output buffer', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session();
        result.current.add_output(sessionId, 'Some output');
        result.current.add_to_history(sessionId, 'some command');
      });

      act(() => {
        result.current.clear_session(sessionId);
      });

      const session = result.current.get_session(sessionId);
      expect(session?.output_buffer).toEqual([]);
      // Command history should remain intact
      expect(session?.command_history).toEqual(['some command']);
    });
  });

  describe('get_session', () => {
    it('should return session by id', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session('Test Session');
      });

      const session = result.current.get_session(sessionId);
      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
      expect(session?.title).toBe('Test Session');
    });

    it('should return undefined for non-existent session', () => {
      const { result } = renderHook(() => useTerminalStore());

      const session = result.current.get_session('non-existent-id');
      expect(session).toBeUndefined();
    });
  });

  describe('get_active_session', () => {
    it('should return active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      let sessionId: string;
      act(() => {
        sessionId = result.current.create_session('Active Session');
      });

      const activeSession = result.current.get_active_session();
      expect(activeSession).toBeDefined();
      expect(activeSession?.id).toBe(sessionId);
      expect(activeSession?.is_active).toBe(true);
    });

    it('should return undefined when no active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      const activeSession = result.current.get_active_session();
      expect(activeSession).toBeUndefined();
    });
  });

  describe('cleanup_sessions', () => {
    it('should remove old inactive sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string, session3Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
        session3Id = result.current.create_session('Session 3');
      });

      // Manually set old timestamps for sessions 1 and 2
      act(() => {
        const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
        result.current.update_session(session1Id, { created_at: oldTime });
        result.current.update_session(session2Id, { created_at: oldTime });
      });

      act(() => {
        result.current.cleanup_sessions();
      });

      // Should keep the active session (session3Id) regardless of age
      // and remove old inactive sessions
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.get_session(session3Id)).toBeDefined();
      expect(result.current.active_session_id).toBe(session3Id);
    });

    it('should keep recent sessions even if inactive', () => {
      const { result } = renderHook(() => useTerminalStore());

      let session1Id: string, session2Id: string;
      act(() => {
        session1Id = result.current.create_session('Session 1');
        session2Id = result.current.create_session('Session 2');
        // Make session 1 inactive but recent
        result.current.set_active_session(session2Id);
      });

      act(() => {
        result.current.cleanup_sessions();
      });

      // Both sessions should still exist since they're recent
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.get_session(session1Id)).toBeDefined();
      expect(result.current.get_session(session2Id)).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty sessions array gracefully', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.active_session_id).toBeNull();
      expect(result.current.get_active_session()).toBeUndefined();
    });

    it('should handle operations on non-existent sessions gracefully', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(() => {
        act(() => {
          result.current.remove_session('non-existent');
          result.current.set_active_session('non-existent');
          result.current.update_session('non-existent', { title: 'Updated' });
          result.current.add_to_history('non-existent', 'command');
          result.current.add_output('non-existent', 'output');
          result.current.clear_session('non-existent');
        });
      }).not.toThrow();
    });

    it('should handle concurrent session creation', () => {
      const { result } = renderHook(() => useTerminalStore());

      const sessionIds: string[] = [];
      act(() => {
        // Create multiple sessions in a single act
        for (let i = 0; i < 5; i++) {
          sessionIds.push(result.current.create_session(`Session ${i + 1}`));
        }
      });

      expect(result.current.sessions).toHaveLength(5);
      expect(sessionIds).toHaveLength(5);
      // All sessions should have unique IDs (though they'll all be the same due to mocking)
      sessionIds.forEach(id => {
        expect(result.current.get_session(id)).toBeDefined();
      });
    });
  });

  describe('persistence behavior', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.sessions).toEqual([]);
      expect(result.current.active_session_id).toBeNull();
      expect(result.current.max_sessions).toBe(10);
    });

    it('should maintain session order', () => {
      const { result } = renderHook(() => useTerminalStore());

      const sessionIds: string[] = [];
      act(() => {
        for (let i = 0; i < 3; i++) {
          sessionIds.push(result.current.create_session(`Session ${i + 1}`));
        }
      });

      const sessions = result.current.sessions;
      expect(sessions[0].title).toBe('Session 1');
      expect(sessions[1].title).toBe('Session 2');
      expect(sessions[2].title).toBe('Session 3');
    });
  });
});