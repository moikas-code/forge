const pty = require('node-pty');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Store active terminal sessions
const terminals = new Map();
const terminalHistory = new Map();

// Detect the appropriate shell for the platform
function getDefaultShell() {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

// Terminal session class
class TerminalSession {
  constructor(id, options = {}) {
    this.id = id;
    this.shell = options.shell || getDefaultShell();
    this.cwd = options.cwd || process.env.HOME || process.cwd();
    this.env = { ...process.env, ...options.env };
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.history = [];
    
    // Determine shell arguments based on shell type
    const shellArgs = this.getShellArgs();
    console.log(`[Terminal Backend] Spawning shell: ${this.shell} with args:`, shellArgs);
    
    // Create PTY instance
    this.pty = pty.spawn(this.shell, shellArgs, {
      name: 'xterm-256color',
      cols: this.cols,
      rows: this.rows,
      cwd: this.cwd,
      env: this.env,
      useConpty: process.platform === 'win32'
    });
    
    console.log(`[Terminal Backend] PTY spawned successfully for terminal ${id}`);
    
    // Send initial newline after a short delay to trigger shell prompt
    setTimeout(() => {
      if (this.pty && !this.pty.killed) {
        console.log(`[Terminal Backend] Sending initial newline to trigger prompt for terminal ${id}`);
        this.pty.write('\n');
      }
    }, 100);
  }
  
  getShellArgs() {
    const shellName = this.shell.split('/').pop().split('\\').pop();
    
    // For bash, zsh, and sh, use interactive mode
    if (shellName === 'bash' || shellName === 'zsh' || shellName === 'sh') {
      return ['-i'];
    }
    
    // For fish, use interactive mode
    if (shellName === 'fish') {
      return ['-i'];
    }
    
    // For Windows cmd.exe or PowerShell, no special args needed
    if (shellName === 'cmd.exe' || shellName === 'powershell.exe' || shellName === 'pwsh.exe') {
      return [];
    }
    
    // Default: try interactive mode for unknown shells
    return ['-i'];
  }

  write(data) {
    if (this.pty) {
      this.pty.write(data);
      // Track commands in history
      if (data.includes('\r') || data.includes('\n')) {
        this.history.push(data.trim());
        if (this.history.length > 1000) {
          this.history.shift();
        }
      }
    }
  }

  resize(cols, rows) {
    if (this.pty) {
      this.cols = cols;
      this.rows = rows;
      this.pty.resize(cols, rows);
    }
  }

  destroy() {
    if (this.pty) {
      try {
        this.pty.kill();
      } catch (e) {
        // PTY might already be dead
      }
      this.pty = null;
    }
  }

  getInfo() {
    return {
      id: this.id,
      shell: this.shell,
      cwd: this.cwd,
      environment: this.env,
      isRunning: this.pty && !this.pty.killed,
      cols: this.cols,
      rows: this.rows
    };
  }
}

function setupTerminalHandlers(ipcMain) {
  // Create a new terminal
  ipcMain.handle('terminal:create', async (event, options = {}) => {
    const id = options.id || `terminal_${uuidv4()}`;
    console.log(`[Terminal Backend] Creating terminal session ${id}`);
    const session = new TerminalSession(id, options);
    
    // Store the session
    terminals.set(id, session);
    terminalHistory.set(id, []);
    
    // Set up data handler
    session.pty.onData((data) => {
      // Send data to renderer
      const dataArray = Array.from(Buffer.from(data));
      console.log(`[Terminal Backend] Sending data from terminal ${id}:`, dataArray.length, 'bytes');
      // Log first 100 chars of output for debugging
      const preview = data.substring(0, 100).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
      console.log(`[Terminal Backend] Data preview: "${preview}"`);
      event.sender.send('terminal:data', {
        terminalId: id,
        data: dataArray
      });
    });
    
    // Set up exit handler
    session.pty.onExit((exitCode) => {
      event.sender.send('terminal:exit', {
        terminalId: id,
        exitCode: exitCode.exitCode
      });
      // Clean up
      terminals.delete(id);
      terminalHistory.delete(id);
    });
    
    return {
      id,
      shell: session.shell,
      cwd: session.cwd
    };
  });

  // Write data to terminal
  ipcMain.handle('terminal:write', async (event, id, data) => {
    const session = terminals.get(id);
    if (!session) {
      console.error(`[Terminal Backend] Terminal ${id} not found`);
      throw new Error(`Terminal ${id} not found`);
    }
    
    // Convert array of numbers back to string
    // Use Buffer for better performance and to handle larger data
    const buffer = Buffer.from(data);
    const str = buffer.toString('utf8');
    console.log(`[Terminal Backend] Writing to terminal ${id}:`, str.length, 'chars');
    session.write(str);
    
    // Track in history
    const history = terminalHistory.get(id) || [];
    if (str.includes('\r') || str.includes('\n')) {
      history.push(str.trim());
      if (history.length > 100) {
        history.shift();
      }
      terminalHistory.set(id, history);
    }
    
    return true;
  });

  // Resize terminal
  ipcMain.handle('terminal:resize', async (event, id, cols, rows) => {
    const session = terminals.get(id);
    if (!session) {
      throw new Error(`Terminal ${id} not found`);
    }
    
    session.resize(cols, rows);
    return true;
  });

  // Close terminal
  ipcMain.handle('terminal:close', async (event, id) => {
    const session = terminals.get(id);
    if (!session) {
      return true; // Already closed
    }
    
    session.destroy();
    terminals.delete(id);
    terminalHistory.delete(id);
    return true;
  });

  // Get terminal session info
  ipcMain.handle('terminal:getSessionInfo', async (event, id) => {
    const session = terminals.get(id);
    if (!session) {
      throw new Error(`Terminal ${id} not found`);
    }
    
    return session.getInfo();
  });

  // Get terminal history
  ipcMain.handle('terminal:getHistory', async (event, id) => {
    return terminalHistory.get(id) || [];
  });

  // Get terminal current working directory
  ipcMain.handle('terminal:getCwd', async (event, id) => {
    const session = terminals.get(id);
    if (!session) {
      throw new Error(`Terminal ${id} not found`);
    }
    
    // This is a simplified version - in reality, you'd need to
    // track CWD changes through shell integration
    return session.cwd;
  });

  // Test SSH connection
  ipcMain.handle('terminal:testSSH', async (event, options) => {
    const { host, port = 22, username, keyPath } = options;
    
    // Create a temporary terminal to test SSH
    const testId = `ssh_test_${uuidv4()}`;
    const testSession = new TerminalSession(testId, {
      shell: getDefaultShell()
    });
    
    return new Promise((resolve) => {
      let output = '';
      let timeout;
      
      testSession.pty.onData((data) => {
        output += data;
        
        // Check for success patterns
        if (output.includes('Welcome') || output.includes('Last login') || output.includes('$') || output.includes('#')) {
          clearTimeout(timeout);
          testSession.destroy();
          resolve(true);
        }
        
        // Check for failure patterns
        if (output.includes('Permission denied') || output.includes('Connection refused') || output.includes('No route to host')) {
          clearTimeout(timeout);
          testSession.destroy();
          resolve(false);
        }
      });
      
      // Build SSH command
      let sshCommand = `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no`;
      if (keyPath) {
        sshCommand += ` -i "${keyPath}"`;
      }
      if (port !== 22) {
        sshCommand += ` -p ${port}`;
      }
      sshCommand += ` ${username}@${host} exit\r`;
      
      // Send SSH command
      testSession.write(sshCommand);
      
      // Timeout after 10 seconds
      timeout = setTimeout(() => {
        testSession.destroy();
        resolve(false);
      }, 10000);
    });
  });

  // Clean up terminals on process exit
  process.on('exit', () => {
    // Quick synchronous cleanup
    terminals.forEach((session) => {
      try {
        if (session.pty && !session.pty.killed) {
          session.pty.kill();
        }
      } catch (e) {
        // Ignore errors during final cleanup
      }
    });
  });
}

module.exports = { setupTerminalHandlers };