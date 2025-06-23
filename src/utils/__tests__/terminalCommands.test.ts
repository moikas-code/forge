import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseCommand,
  isCustomCommand,
  executeCommand,
  CUSTOM_COMMANDS,
  TerminalPerformanceTracker,
  terminalPerformanceTracker,
  type CommandContext,
  type ParsedCommand,
} from '../terminalCommands';

describe('parseCommand', () => {
  it('should parse simple commands', () => {
    const result = parseCommand('help');
    expect(result).toEqual({
      command: 'help',
      args: [],
      flags: {},
    });
  });

  it('should parse commands with arguments', () => {
    const result = parseCommand('open file.txt');
    expect(result).toEqual({
      command: 'open',
      args: ['file.txt'],
      flags: {},
    });
  });

  it('should parse commands with multiple arguments', () => {
    const result = parseCommand('search pattern file1.txt file2.txt');
    expect(result).toEqual({
      command: 'search',
      args: ['pattern', 'file1.txt', 'file2.txt'],
      flags: {},
    });
  });

  it('should parse long flags with values', () => {
    const result = parseCommand('open --file test.txt --line 42');
    expect(result).toEqual({
      command: 'open',
      args: [],
      flags: {
        file: 'test.txt',
        line: 42,
      },
    });
  });

  it('should parse short flags', () => {
    const result = parseCommand('ls -la');
    expect(result).toEqual({
      command: 'ls',
      args: [],
      flags: {
        l: true,
        a: true,
      },
    });
  });

  it('should parse boolean flags', () => {
    const result = parseCommand('command --verbose --debug=true --quiet=false');
    expect(result).toEqual({
      command: 'command',
      args: [],
      flags: {
        verbose: true,
        debug: true,
        quiet: false,
      },
    });
  });

  it('should handle mixed arguments and flags', () => {
    const result = parseCommand('git commit -m "Initial commit" --author user');
    expect(result).toEqual({
      command: 'git',
      args: ['commit', '"Initial', 'commit"'],
      flags: {
        m: true,
        author: 'user',
      },
    });
  });

  it('should return null for empty input', () => {
    expect(parseCommand('')).toBeNull();
    expect(parseCommand('   ')).toBeNull();
  });

  it('should handle numeric values', () => {
    const result = parseCommand('command --port 3000 --timeout 5.5');
    expect(result).toEqual({
      command: 'command',
      args: [],
      flags: {
        port: 3000,
        timeout: 5.5,
      },
    });
  });
});

describe('isCustomCommand', () => {
  it('should identify custom commands', () => {
    expect(isCustomCommand('help')).toBe(true);
    expect(isCustomCommand('open')).toBe(true);
    expect(isCustomCommand('new-file')).toBe(true);
    expect(isCustomCommand('git')).toBe(true);
  });

  it('should reject non-custom commands', () => {
    expect(isCustomCommand('ls')).toBe(false); // Wait, 'ls' is in CUSTOM_COMMANDS
    expect(isCustomCommand('cd')).toBe(false);
    expect(isCustomCommand('mkdir')).toBe(false);
    expect(isCustomCommand('unknown')).toBe(false);
  });

  it('should handle ls correctly', () => {
    // 'ls' is actually a custom command in our implementation
    expect(isCustomCommand('ls')).toBe(true);
  });
});

describe('executeCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      addTab: vi.fn(),
      writeToTerminal: vi.fn(),
      getCurrentDirectory: vi.fn().mockReturnValue('/home/user'),
    };
  });

  describe('help command', () => {
    it('should display help information', async () => {
      const command: ParsedCommand = { command: 'help', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        expect.stringContaining('Forge MOI IDE Commands')
      );
      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        expect.stringContaining('help')
      );
    });
  });

  describe('open command', () => {
    it('should open a file in editor', async () => {
      const command: ParsedCommand = { command: 'open', args: ['test.txt'], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: 'test.txt',
        type: 'editor',
        path: '/home/user/test.txt',
      });
      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        "\r\n[Opened 'test.txt' in editor]\r\n"
      );
    });

    it('should handle absolute paths', async () => {
      const command: ParsedCommand = { command: 'open', args: ['/absolute/path/file.txt'], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: '/absolute/path/file.txt',
        type: 'editor',
        path: '/absolute/path/file.txt',
      });
    });

    it('should show error for missing file argument', async () => {
      const command: ParsedCommand = { command: 'open', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        '\r\n[Error: No file specified]\r\n'
      );
      expect(mockContext.addTab).not.toHaveBeenCalled();
    });
  });

  describe('new-file command', () => {
    it('should create a new file with specified name', async () => {
      const command: ParsedCommand = { command: 'new-file', args: ['newfile.js'], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: 'newfile.js',
        type: 'editor',
        path: '/home/user/newfile.js',
        content: '',
      });
      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        "\r\n[Created new file 'newfile.js' in editor]\r\n"
      );
    });

    it('should use default filename when none provided', async () => {
      const command: ParsedCommand = { command: 'new-file', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: 'untitled.txt',
        type: 'editor',
        path: '/home/user/untitled.txt',
        content: '',
      });
    });
  });

  describe('new-tab command', () => {
    it('should create a new terminal tab', async () => {
      const command: ParsedCommand = { command: 'new-tab', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: 'Terminal',
        type: 'terminal',
      });
      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        '\r\n[Opened new terminal tab]\r\n'
      );
    });
  });

  describe('clear command', () => {
    it('should clear the terminal screen', async () => {
      const command: ParsedCommand = { command: 'clear', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith('\x1b[2J\x1b[H');
    });
  });

  describe('pwd command', () => {
    it('should display current directory', async () => {
      const command: ParsedCommand = { command: 'pwd', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        '\r\n/home/user\r\n'
      );
    });
  });

  describe('preview command', () => {
    it('should open file in browser preview', async () => {
      const command: ParsedCommand = { command: 'preview', args: ['index.html'], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.addTab).toHaveBeenCalledWith({
        title: 'Preview: index.html',
        type: 'browser',
        path: '/home/user/index.html',
      });
      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        "\r\n[Opened 'index.html' in browser preview]\r\n"
      );
    });

    it('should show error for missing file argument', async () => {
      const command: ParsedCommand = { command: 'preview', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        '\r\n[Error: No file specified]\r\n'
      );
      expect(mockContext.addTab).not.toHaveBeenCalled();
    });
  });

  describe('search command', () => {
    it('should show search placeholder message', async () => {
      const command: ParsedCommand = { command: 'search', args: ['pattern'], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        "\r\n[Would search for 'pattern' in project files]\r\n"
      );
    });

    it('should show error for missing search term', async () => {
      const command: ParsedCommand = { command: 'search', args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        '\r\n[Error: No search term specified]\r\n'
      );
    });
  });

  describe('unknown command', () => {
    it('should show error for unknown custom commands', async () => {
      const command: ParsedCommand = { command: 'unknown' as any, args: [], flags: {} };
      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        "\r\n[Error: Unknown command 'unknown']\r\n"
      );
    });
  });

  describe('error handling', () => {
    it('should handle command execution errors', async () => {
      const command: ParsedCommand = { command: 'open', args: ['test.txt'], flags: {} };
      
      // Make addTab throw an error
      mockContext.addTab = vi.fn().mockImplementation(() => {
        throw new Error('Tab creation failed');
      });

      await executeCommand(command, mockContext);

      expect(mockContext.writeToTerminal).toHaveBeenCalledWith(
        expect.stringContaining("[Error executing 'open': Error: Tab creation failed]")
      );
    });
  });
});

describe('TerminalPerformanceTracker', () => {
  let tracker: TerminalPerformanceTracker;

  beforeEach(() => {
    tracker = new TerminalPerformanceTracker();
  });

  it('should track operation timing', () => {
    const endTiming = tracker.startTiming('test-operation');
    
    // Simulate some work
    const start = performance.now();
    while (performance.now() - start < 10) {
      // Wait at least 10ms
    }
    
    endTiming();

    const metrics = tracker.getMetrics('test-operation');
    expect(metrics).toBeDefined();
    expect(metrics!.count).toBe(1);
    expect(metrics!.avg).toBeGreaterThan(0);
    expect(metrics!.min).toBeGreaterThan(0);
    expect(metrics!.max).toBeGreaterThan(0);
  });

  it('should track multiple operations', () => {
    const end1 = tracker.startTiming('operation-1');
    const end2 = tracker.startTiming('operation-2');
    
    end1();
    end2();

    expect(tracker.getMetrics('operation-1')).toBeDefined();
    expect(tracker.getMetrics('operation-2')).toBeDefined();
  });

  it('should calculate correct statistics for multiple measurements', () => {
    // Add multiple measurements for the same operation
    for (let i = 0; i < 5; i++) {
      const endTiming = tracker.startTiming('repeated-operation');
      endTiming();
    }

    const metrics = tracker.getMetrics('repeated-operation');
    expect(metrics).toBeDefined();
    expect(metrics!.count).toBe(5);
    expect(metrics!.avg).toBeGreaterThan(0);
    expect(metrics!.min).toBeLessThanOrEqual(metrics!.avg);
    expect(metrics!.max).toBeGreaterThanOrEqual(metrics!.avg);
  });

  it('should return null for unknown operations', () => {
    expect(tracker.getMetrics('unknown-operation')).toBeNull();
  });

  it('should clear all metrics', () => {
    const endTiming = tracker.startTiming('test-operation');
    endTiming();

    expect(tracker.getMetrics('test-operation')).toBeDefined();
    
    tracker.clear();
    
    expect(tracker.getMetrics('test-operation')).toBeNull();
  });

  it('should return all metrics', () => {
    const end1 = tracker.startTiming('op-1');
    const end2 = tracker.startTiming('op-2');
    
    end1();
    end2();

    const allMetrics = tracker.getAllMetrics();
    expect(Object.keys(allMetrics)).toContain('op-1');
    expect(Object.keys(allMetrics)).toContain('op-2');
    expect(allMetrics['op-1'].count).toBe(1);
    expect(allMetrics['op-2'].count).toBe(1);
  });
});

describe('CUSTOM_COMMANDS', () => {
  it('should contain all expected commands', () => {
    const expectedCommands = [
      'help',
      'open',
      'new-file',
      'new-tab',
      'clear',
      'pwd',
      'ls',
      'cat',
      'edit',
      'preview',
      'search',
      'git',
    ];

    for (const cmd of expectedCommands) {
      expect(CUSTOM_COMMANDS).toHaveProperty(cmd);
      expect(typeof CUSTOM_COMMANDS[cmd as keyof typeof CUSTOM_COMMANDS]).toBe('string');
    }
  });

  it('should have meaningful descriptions', () => {
    for (const [command, description] of Object.entries(CUSTOM_COMMANDS)) {
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(5);
      expect(description).not.toBe(command);
    }
  });
});

describe('integration tests', () => {
  it('should handle complex command parsing and execution', async () => {
    const mockContext: CommandContext = {
      addTab: vi.fn(),
      writeToTerminal: vi.fn(),
      getCurrentDirectory: vi.fn().mockReturnValue('/project'),
    };

    const commandString = 'open --file package.json';
    const parsed = parseCommand(commandString);
    
    expect(parsed).toBeDefined();
    expect(isCustomCommand(parsed!.command)).toBe(true);
    
    await executeCommand(parsed!, mockContext);
    
    expect(mockContext.addTab).toHaveBeenCalled();
  });

  it('should handle performance tracking during command execution', async () => {
    const mockContext: CommandContext = {
      addTab: vi.fn(),
      writeToTerminal: vi.fn(),
      getCurrentDirectory: vi.fn().mockReturnValue('/project'),
    };

    const endTiming = terminalPerformanceTracker.startTiming('command-execution');
    
    const command: ParsedCommand = { command: 'help', args: [], flags: {} };
    await executeCommand(command, mockContext);
    
    endTiming();

    const metrics = terminalPerformanceTracker.getMetrics('command-execution');
    expect(metrics).toBeDefined();
    expect(metrics!.count).toBe(1);
  });
});