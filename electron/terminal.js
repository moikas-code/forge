const pty = require('node-pty');
const { v4: uuidv4 } = require('uuid');

// Store active terminal sessions
const terminals = new Map();

// Get default shell
function getDefaultShell() {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

// Get shell arguments for interactive mode
function getShellArgs(shell) {
  const shellName = shell.split('/').pop().split('\\').pop();
  
  // For bash, zsh, sh - use interactive login shell
  if (shellName === 'bash' || shellName === 'zsh' || shellName === 'sh') {
    return ['-il']; // interactive login shell
  }
  
  // For fish
  if (shellName === 'fish') {
    return ['-l']; // login shell
  }
  
  // For Windows shells
  if (shellName === 'cmd.exe' || shellName === 'powershell.exe' || shellName === 'pwsh.exe') {
    return [];
  }
  
  return [];
}

function setupTerminalHandlers(ipcMain, getMainWindow) {
  // Create a new terminal
  ipcMain.handle('terminal:create', async (event, options = {}) => {
    const id = `terminal_${uuidv4()}`;
    const shell = options.shell || getDefaultShell();
    const cwd = options.cwd || process.env.HOME || process.cwd();
    const cols = options.cols || 80;
    const rows = options.rows || 24;
    
    console.log(`[Terminal] Creating terminal ${id}`);
    console.log(`[Terminal] Shell: ${shell}`);
    console.log(`[Terminal] CWD: ${cwd}`);
    console.log(`[Terminal] Size: ${cols}x${rows}`);
    
    try {
      // Create PTY with proper options
      const shellArgs = getShellArgs(shell);
      const ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: cols,
        rows: rows,
        cwd: cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          FORCE_COLOR: '1'
        }
      });
      
      console.log(`[Terminal] PTY created with PID: ${ptyProcess.pid}`);
      
      // Store terminal session
      terminals.set(id, {
        id: id,
        pty: ptyProcess,
        shell: shell,
        cwd: cwd
      });
      
      // Get main window
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        throw new Error('No main window available');
      }
      
      // Set up data handler
      ptyProcess.onData((data) => {
        // Send data to renderer
        if (!mainWindow.isDestroyed()) {
          const payload = {
            terminalId: id,
            data: Array.from(Buffer.from(data))
          };
          console.log(`[Terminal] Sending data to renderer for terminal ${id}: ${data.length} bytes`);
          mainWindow.webContents.send('terminal:data', payload);
        }
      });
      
      // Set up exit handler
      ptyProcess.onExit((exitCode) => {
        console.log(`[Terminal] Terminal ${id} exited with code:`, exitCode);
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:exit', {
            terminalId: id,
            exitCode: exitCode.exitCode
          });
        }
        terminals.delete(id);
      });
      
      // Send initial commands to verify PTY is working
      setTimeout(() => {
        if (ptyProcess) {
          console.log(`[Terminal] Sending test echo to terminal ${id}`);
          ptyProcess.write('echo "Terminal Ready"\n');
        }
      }, 200);
      
      return {
        id: id,
        shell: shell,
        cwd: cwd
      };
    } catch (error) {
      console.error('[Terminal] Failed to create terminal:', error);
      throw error;
    }
  });

  // Write data to terminal
  ipcMain.handle('terminal:write', async (event, id, data) => {
    const session = terminals.get(id);
    if (!session) {
      console.error(`[Terminal] Terminal ${id} not found`);
      return false;
    }
    
    try {
      // Convert data to string
      const text = Buffer.from(data).toString('utf8');
      console.log(`[Terminal] Writing to terminal ${id}: "${text}"`);
      session.pty.write(text);
      return true;
    } catch (error) {
      console.error(`[Terminal] Failed to write to terminal ${id}:`, error);
      return false;
    }
  });

  // Resize terminal
  ipcMain.handle('terminal:resize', async (event, id, cols, rows) => {
    const session = terminals.get(id);
    if (!session) {
      console.error(`[Terminal] Terminal ${id} not found`);
      return false;
    }
    
    try {
      console.log(`[Terminal] Resizing terminal ${id} to ${cols}x${rows}`);
      session.pty.resize(cols, rows);
      return true;
    } catch (error) {
      console.error(`[Terminal] Failed to resize terminal ${id}:`, error);
      return false;
    }
  });

  // Close terminal
  ipcMain.handle('terminal:close', async (event, id) => {
    const session = terminals.get(id);
    if (!session) {
      return true; // Already closed
    }
    
    try {
      console.log(`[Terminal] Closing terminal ${id}`);
      session.pty.kill();
      terminals.delete(id);
      return true;
    } catch (error) {
      console.error(`[Terminal] Failed to close terminal ${id}:`, error);
      terminals.delete(id);
      return false;
    }
  });

  // Get terminal info
  ipcMain.handle('terminal:getSessionInfo', async (event, id) => {
    const session = terminals.get(id);
    if (!session) {
      throw new Error(`Terminal ${id} not found`);
    }
    
    return {
      id: session.id,
      shell: session.shell,
      cwd: session.cwd,
      isRunning: session.pty && !session.pty.killed,
      cols: session.pty.cols,
      rows: session.pty.rows
    };
  });

  // Clean up on exit
  process.on('exit', () => {
    terminals.forEach((session) => {
      try {
        if (session.pty && !session.pty.killed) {
          session.pty.kill();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
  });
}

module.exports = { setupTerminalHandlers };