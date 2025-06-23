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
    
    // Create PTY instance
    this.pty = pty.spawn(this.shell, [], {
      name: 'xterm-256color',
      cols: this.cols,
      rows: this.rows,
      cwd: this.cwd,
      env: this.env,
      useConpty: process.platform === 'win32'
    });
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
    const session = new TerminalSession(id, options);
    
    // Store the session
    terminals.set(id, session);
    terminalHistory.set(id, []);
    
    // Set up data handler
    session.pty.onData((data) => {
      // Send data to renderer
      event.sender.send('terminal:data', {
        terminalId: id,
        data: Array.from(Buffer.from(data))
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
      throw new Error(`Terminal ${id} not found`);
    }
    
    // Convert array of numbers back to string
    const str = String.fromCharCode(...data);
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

  // Clean up on app quit
  process.on('exit', () => {
    terminals.forEach(session => session.destroy());
  });
}

module.exports = { setupTerminalHandlers };