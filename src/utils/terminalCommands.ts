import { z } from 'zod';

// Zod schemas for command validation
const CommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  flags: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
});

export type ParsedCommand = z.infer<typeof CommandSchema>;

// Context provided to command handlers
export interface CommandContext {
  addTab: (tab: any) => void;
  writeToTerminal: (message: string) => void;
  getCurrentDirectory: () => string;
}

// Available custom IDE commands
export const CUSTOM_COMMANDS = {
  help: 'Show available IDE commands',
  open: 'Open a file in the editor',
  'new-file': 'Create a new file',
  'new-tab': 'Open a new terminal tab',
  clear: 'Clear terminal output',
  pwd: 'Print working directory',
  ls: 'List directory contents (enhanced)',
  cat: 'Display file contents',
  edit: 'Open file in editor',
  preview: 'Preview file in browser',
  search: 'Search in files',
  git: 'Git operations with IDE integration',
} as const;

export type CustomCommand = keyof typeof CUSTOM_COMMANDS;

/**
 * Parses a command string into structured command data
 */
export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const remaining = parts.slice(1);
  
  const args: string[] = [];
  const flags: Record<string, string | boolean | number> = {};
  
  let i = 0;
  while (i < remaining.length) {
    const part = remaining[i];
    
    if (part.startsWith('--')) {
      // Long flag
      const flagName = part.slice(2);
      if (i + 1 < remaining.length && !remaining[i + 1].startsWith('-')) {
        // Flag with value
        const value = remaining[i + 1];
        flags[flagName] = parseValue(value);
        i += 2;
      } else {
        // Boolean flag
        flags[flagName] = true;
        i += 1;
      }
    } else if (part.startsWith('-') && part.length > 1) {
      // Short flag(s)
      const shortFlags = part.slice(1);
      for (const flag of shortFlags) {
        flags[flag] = true;
      }
      i += 1;
    } else {
      // Argument
      args.push(part);
      i += 1;
    }
  }
  
  try {
    return CommandSchema.parse({ command, args, flags });
  } catch (error) {
    console.error('Command parsing error:', error);
    return null;
  }
}

/**
 * Parses a string value to appropriate type
 */
function parseValue(value: string): string | number | boolean {
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }
  
  // Try to parse as boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Return as string
  return value;
}

/**
 * Checks if a command is a custom IDE command
 */
export function isCustomCommand(command: string): command is CustomCommand {
  return command in CUSTOM_COMMANDS;
}

/**
 * Executes a custom IDE command
 */
export async function executeCommand(
  parsed: ParsedCommand,
  context: CommandContext
): Promise<void> {
  const { command, args, flags } = parsed;
  
  if (!isCustomCommand(command)) {
    context.writeToTerminal(`\r\n[Error: Unknown command '${command}']\r\n`);
    return;
  }
  
  try {
    switch (command) {
      case 'help':
        await executeHelpCommand(context);
        break;
        
      case 'open':
      case 'edit':
        await executeOpenCommand(args, flags, context);
        break;
        
      case 'new-file':
        await executeNewFileCommand(args, flags, context);
        break;
        
      case 'new-tab':
        await executeNewTabCommand(context);
        break;
        
      case 'clear':
        await executeClearCommand(context);
        break;
        
      case 'pwd':
        await executePwdCommand(context);
        break;
        
      case 'ls':
        await executeLsCommand(args, flags, context);
        break;
        
      case 'cat':
        await executeCatCommand(args, context);
        break;
        
      case 'preview':
        await executePreviewCommand(args, context);
        break;
        
      case 'search':
        await executeSearchCommand(args, flags, context);
        break;
        
      case 'git':
        await executeGitCommand(args, flags, context);
        break;
        
      default:
        context.writeToTerminal(`\r\n[Error: Command '${command}' not implemented]\r\n`);
    }
  } catch (error) {
    context.writeToTerminal(`\r\n[Error executing '${command}': ${error}]\r\n`);
  }
}

// Command implementations

async function executeHelpCommand(context: CommandContext): Promise<void> {
  const { writeToTerminal } = context;
  
  writeToTerminal('\r\n\x1b[1;36mForge MOI IDE Commands:\x1b[0m\r\n');
  writeToTerminal('\r\n');
  
  for (const [cmd, description] of Object.entries(CUSTOM_COMMANDS)) {
    writeToTerminal(`  \x1b[1;33m${cmd.padEnd(12)}\x1b[0m ${description}\r\n`);
  }
  
  writeToTerminal('\r\n');
  writeToTerminal('Use standard shell commands for file operations.\r\n');
  writeToTerminal('IDE commands provide enhanced integration with the editor.\r\n');
  writeToTerminal('\r\n');
}

async function executeOpenCommand(
  args: string[],
  flags: Record<string, any>,
  context: CommandContext
): Promise<void> {
  const { addTab, writeToTerminal, getCurrentDirectory } = context;
  
  if (args.length === 0) {
    writeToTerminal('\r\n[Error: No file specified]\r\n');
    return;
  }
  
  const filename = args[0];
  const currentDir = getCurrentDirectory();
  const fullPath = filename.startsWith('/') ? filename : `${currentDir}/${filename}`;
  
  // Add editor tab
  addTab({
    title: filename,
    type: 'editor',
    path: fullPath,
  });
  
  writeToTerminal(`\r\n[Opened '${filename}' in editor]\r\n`);
}

async function executeNewFileCommand(
  args: string[],
  flags: Record<string, any>,
  context: CommandContext
): Promise<void> {
  const { addTab, writeToTerminal, getCurrentDirectory } = context;
  
  const filename = args[0] || 'untitled.txt';
  const currentDir = getCurrentDirectory();
  const fullPath = filename.startsWith('/') ? filename : `${currentDir}/${filename}`;
  
  // Add editor tab for new file
  addTab({
    title: filename,
    type: 'editor',
    path: fullPath,
    content: '',
  });
  
  writeToTerminal(`\r\n[Created new file '${filename}' in editor]\r\n`);
}

async function executeNewTabCommand(context: CommandContext): Promise<void> {
  const { addTab, writeToTerminal } = context;
  
  // Add terminal tab
  addTab({
    title: 'Terminal',
    type: 'terminal',
  });
  
  writeToTerminal('\r\n[Opened new terminal tab]\r\n');
}

async function executeClearCommand(context: CommandContext): Promise<void> {
  const { writeToTerminal } = context;
  
  // Clear screen
  writeToTerminal('\x1b[2J\x1b[H');
}

async function executePwdCommand(context: CommandContext): Promise<void> {
  const { writeToTerminal, getCurrentDirectory } = context;
  
  const currentDir = getCurrentDirectory();
  writeToTerminal(`\r\n${currentDir}\r\n`);
}

async function executeLsCommand(
  args: string[],
  flags: Record<string, any>,
  context: CommandContext
): Promise<void> {
  const { writeToTerminal } = context;
  
  // This would integrate with the file system in a real implementation
  writeToTerminal('\r\n[Enhanced ls command - would show file details with IDE integration]\r\n');
}

async function executeCatCommand(
  args: string[],
  context: CommandContext
): Promise<void> {
  const { writeToTerminal } = context;
  
  if (args.length === 0) {
    writeToTerminal('\r\n[Error: No file specified]\r\n');
    return;
  }
  
  const filename = args[0];
  writeToTerminal(`\r\n[Would display contents of '${filename}']\r\n`);
}

async function executePreviewCommand(
  args: string[],
  context: CommandContext
): Promise<void> {
  const { addTab, writeToTerminal, getCurrentDirectory } = context;
  
  if (args.length === 0) {
    writeToTerminal('\r\n[Error: No file specified]\r\n');
    return;
  }
  
  const filename = args[0];
  const currentDir = getCurrentDirectory();
  const fullPath = filename.startsWith('/') ? filename : `${currentDir}/${filename}`;
  
  // Add browser tab for preview
  addTab({
    title: `Preview: ${filename}`,
    type: 'browser',
    path: fullPath,
  });
  
  writeToTerminal(`\r\n[Opened '${filename}' in browser preview]\r\n`);
}

async function executeSearchCommand(
  args: string[],
  flags: Record<string, any>,
  context: CommandContext
): Promise<void> {
  const { writeToTerminal } = context;
  
  if (args.length === 0) {
    writeToTerminal('\r\n[Error: No search term specified]\r\n');
    return;
  }
  
  const searchTerm = args[0];
  writeToTerminal(`\r\n[Would search for '${searchTerm}' in project files]\r\n`);
}

async function executeGitCommand(
  args: string[],
  flags: Record<string, any>,
  context: CommandContext
): Promise<void> {
  const { writeToTerminal } = context;
  
  if (args.length === 0) {
    writeToTerminal('\r\n[Git integration - would show enhanced git status]\r\n');
    return;
  }
  
  const gitCommand = args[0];
  writeToTerminal(`\r\n[Would execute git ${gitCommand} with IDE integration]\r\n`);
}

/**
 * Performance utilities for terminal operations
 */
export class TerminalPerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  
  startTiming(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const existing = this.metrics.get(operation) || [];
      existing.push(duration);
      this.metrics.set(operation, existing);
    };
  }
  
  getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return null;
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { avg, min, max, count: times.length };
  }
  
  clear(): void {
    this.metrics.clear();
  }
  
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      if (times.length > 0) {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        result[operation] = { avg, min, max, count: times.length };
      }
    }
    
    return result;
  }
}

// Global performance tracker instance
export const terminalPerformanceTracker = new TerminalPerformanceTracker();