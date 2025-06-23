use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::io::{Read, Write};
use tokio::sync::{mpsc, Mutex, RwLock};
use uuid::Uuid;

/// Represents a terminal instance with its associated PTY
pub struct Terminal {
    writer: Box<dyn Write + Send>,
    child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
    shutdown_tx: Option<mpsc::Sender<()>>,
    pty_master: Arc<Mutex<Box<dyn portable_pty::MasterPty + Send>>>,
}

/// Terminal manager to handle multiple terminal instances
pub struct TerminalManager {
    terminals: Arc<RwLock<HashMap<String, Arc<Mutex<Terminal>>>>>,
    event_sender: Arc<Mutex<mpsc::Sender<TerminalEvent>>>,
}

/// Terminal size configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSize {
    pub rows: u16,
    pub cols: u16,
}

/// Terminal creation options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTerminalOptions {
    pub shell: Option<String>,
    pub cwd: Option<String>,
    pub env: Option<HashMap<String, String>>,
    pub size: Option<TerminalSize>,
}

/// Terminal events for communication
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum TerminalEvent {
    Output { terminal_id: String, data: Vec<u8> },
    Exit { terminal_id: String, exit_code: Option<i32> },
    Error { terminal_id: String, message: String },
}

/// Response for terminal creation
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTerminalResponse {
    pub terminal_id: String,
}

impl TerminalManager {
    /// Creates a new terminal manager instance
    pub fn new(event_sender: mpsc::Sender<TerminalEvent>) -> Self {
        Self {
            terminals: Arc::new(RwLock::new(HashMap::new())),
            event_sender: Arc::new(Mutex::new(event_sender)),
        }
    }

    /// Creates a new terminal instance
    pub async fn create_terminal(
        &self,
        options: CreateTerminalOptions,
    ) -> Result<CreateTerminalResponse, String> {
        let terminal_id = Uuid::new_v4().to_string();
        
        // Create PTY system
        let pty_system = native_pty_system();
        
        // Get shell command first (before options is partially moved)
        let shell = self.get_shell_command(&options);
        println!("[Terminal] Using shell: {}", shell);
        
        // Set terminal size
        let size = options.size.unwrap_or(TerminalSize { rows: 24, cols: 80 });
        let pty_size = PtySize {
            rows: size.rows,
            cols: size.cols,
            pixel_width: 0,
            pixel_height: 0,
        };
        
        // Create PTY pair
        let pty_pair = pty_system
            .openpty(pty_size)
            .map_err(|e| format!("Failed to create PTY: {}", e))?;
        
        // Build command
        let mut cmd = if shell.contains("bash") {
            // For bash, use interactive login shell for proper PTY interaction
            let mut cmd = CommandBuilder::new(&shell);
            cmd.arg("-i"); // interactive shell (important for PTY)
            cmd.arg("-l"); // login shell (load profile)
            cmd
        } else {
            CommandBuilder::new(&shell)
        };
        
        // Set working directory if provided
        if let Some(cwd) = &options.cwd {
            cmd.cwd(cwd);
        }
        
        // Set environment variables if provided
        let mut has_path = false;
        if let Some(env) = &options.env {
            for (key, value) in env {
                cmd.env(key, value);
                if key == "PATH" {
                    has_path = true;
                }
            }
        }
        
        // Ensure TERM is set for proper terminal emulation
        cmd.env("TERM", "xterm-256color");
        
        // Ensure PATH is set if not already provided
        if !has_path {
            if let Ok(path) = std::env::var("PATH") {
                cmd.env("PATH", path);
            }
        }
        
        // Spawn the shell process
        println!("[Terminal] Spawning shell process...");
        let child = pty_pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;
        println!("[Terminal] Shell process spawned successfully");
        
        // Create shutdown channel
        let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>(1);
        
        let pty_master = Arc::new(Mutex::new(pty_pair.master));
        
        // Clone master for reading
        let reader = pty_master.lock().await
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))?;
        
        // Take writer from master
        let writer = pty_master.lock().await
            .take_writer()
            .map_err(|e| format!("Failed to take writer: {}", e))?;
        
        // Create terminal instance
        let terminal = Terminal {
            writer,
            child: Arc::new(Mutex::new(child)),
            shutdown_tx: Some(shutdown_tx),
            pty_master: pty_master.clone(),
        };
        
        // Store terminal
        let mut terminals = self.terminals.write().await;
        terminals.insert(terminal_id.clone(), Arc::new(Mutex::new(terminal)));
        
        // Start reading from terminal in background
        self.start_reader_task(terminal_id.clone(), reader, shutdown_rx).await;
        
        Ok(CreateTerminalResponse { terminal_id })
    }

    /// Writes data to a terminal
    pub async fn write_to_terminal(
        &self,
        terminal_id: String,
        data: Vec<u8>,
    ) -> Result<(), String> {
        // Debug logging
        println!("[TerminalManager] write_to_terminal called - terminal_id: {}, data_len: {}, data: {:?}", 
                 terminal_id, data.len(), String::from_utf8_lossy(&data));
        
        let terminals = self.terminals.read().await;
        
        if let Some(terminal_arc) = terminals.get(&terminal_id) {
            let mut terminal = terminal_arc.lock().await;
            terminal.writer
                .write_all(&data)
                .map_err(|e| format!("Failed to write to terminal: {}", e))?;
            terminal.writer
                .flush()
                .map_err(|e| format!("Failed to flush terminal: {}", e))?;
            println!("[TerminalManager] Successfully wrote {} bytes to terminal", data.len());
            Ok(())
        } else {
            Err(format!("Terminal {} not found", terminal_id))
        }
    }

    /// Reads data from a terminal
    pub async fn read_from_terminal(
        &self,
        _terminal_id: String,
    ) -> Result<Vec<u8>, String> {
        // Note: Reading is handled by the background task
        // This method is kept for API compatibility but returns empty
        Ok(vec![])
    }

    /// Resizes a terminal
    pub async fn resize_terminal(
        &self,
        terminal_id: String,
        size: TerminalSize,
    ) -> Result<(), String> {
        let terminals = self.terminals.read().await;
        
        if let Some(terminal_arc) = terminals.get(&terminal_id) {
            let terminal = terminal_arc.lock().await;
            let pty_size = PtySize {
                rows: size.rows,
                cols: size.cols,
                pixel_width: 0,
                pixel_height: 0,
            };
            
            let pty_master = terminal.pty_master.lock().await;
            pty_master
                .resize(pty_size)
                .map_err(|e| format!("Failed to resize terminal: {}", e))?;
            Ok(())
        } else {
            Err(format!("Terminal {} not found", terminal_id))
        }
    }

    /// Closes a terminal
    pub async fn close_terminal(&self, terminal_id: String) -> Result<(), String> {
        let mut terminals = self.terminals.write().await;
        
        if let Some(terminal_arc) = terminals.remove(&terminal_id) {
            let mut terminal = terminal_arc.lock().await;
            
            // Send shutdown signal
            if let Some(shutdown_tx) = terminal.shutdown_tx.take() {
                let _ = shutdown_tx.send(()).await;
            }
            
            // Kill the child process if it's still running
            let mut child = terminal.child.lock().await;
            let _ = child.kill();
            let _ = child.wait();
            
            Ok(())
        } else {
            Err(format!("Terminal {} not found", terminal_id))
        }
    }
    
    /// Gets the appropriate shell command based on platform and options
    fn get_shell_command(&self, options: &CreateTerminalOptions) -> String {
        if let Some(shell) = &options.shell {
            return shell.clone();
        }
        
        // Default shells by platform
        #[cfg(target_os = "windows")]
        {
            // Try PowerShell first, fall back to cmd
            if std::path::Path::new("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe").exists() {
                "powershell.exe".to_string()
            } else {
                "cmd.exe".to_string()
            }
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // Always prefer bash if available
            if std::path::Path::new("/bin/bash").exists() {
                "/bin/bash".to_string()
            } else if std::path::Path::new("/usr/bin/bash").exists() {
                "/usr/bin/bash".to_string()
            } else if std::path::Path::new("/usr/local/bin/bash").exists() {
                "/usr/local/bin/bash".to_string()
            } else {
                // Fall back to SHELL environment variable or sh
                std::env::var("SHELL").unwrap_or_else(|_| {
                    if std::path::Path::new("/bin/sh").exists() {
                        "/bin/sh".to_string()
                    } else {
                        "sh".to_string()
                    }
                })
            }
        }
    }
    
    /// Starts a background task to read terminal output
    async fn start_reader_task(
        &self,
        terminal_id: String,
        reader: Box<dyn Read + Send>,
        mut shutdown_rx: mpsc::Receiver<()>,
    ) {
        let event_sender = self.event_sender.clone();
        let terminals = self.terminals.clone();
        
        // Spawn blocking task for reading
        tokio::task::spawn_blocking(move || {
            let runtime = tokio::runtime::Handle::current();
            let mut buffer = vec![0u8; 4096];
            let mut reader = reader;
            
            loop {
                // Check for shutdown signal
                match shutdown_rx.try_recv() {
                    Ok(_) => break,
                    Err(mpsc::error::TryRecvError::Disconnected) => break,
                    Err(mpsc::error::TryRecvError::Empty) => {}
                }
                
                // Try to read from terminal
                // Use a small buffer and yield if no data is available
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        // EOF - terminal closed
                        runtime.block_on(async {
                            let sender = event_sender.lock().await;
                            let _ = sender.send(TerminalEvent::Exit {
                                terminal_id: terminal_id.clone(),
                                exit_code: None,
                            }).await;
                        });
                        break;
                    }
                    Ok(n) => {
                        // Send output event
                        let data = buffer[..n].to_vec();
                        let text = String::from_utf8_lossy(&data);
                        println!("[TerminalReader] Read {} bytes from PTY", n);
                        println!("[TerminalReader] Text content: {:?}", text);
                        println!("[TerminalReader] Raw bytes: {:?}", data);
                        runtime.block_on(async {
                            let sender = event_sender.lock().await;
                            let send_result = sender.send(TerminalEvent::Output {
                                terminal_id: terminal_id.clone(),
                                data,
                            }).await;
                            if let Err(e) = send_result {
                                println!("[TerminalReader] Failed to send output event: {:?}", e);
                            } else {
                                println!("[TerminalReader] Successfully sent output event");
                            }
                        });
                    }
                    Err(e) => {
                        // Check if it's a would-block error (non-blocking read)
                        if e.kind() != std::io::ErrorKind::WouldBlock {
                            runtime.block_on(async {
                                let sender = event_sender.lock().await;
                                let _ = sender.send(TerminalEvent::Error {
                                    terminal_id: terminal_id.clone(),
                                    message: format!("Read error: {}", e),
                                }).await;
                            });
                            break;
                        }
                        // Sleep briefly to avoid busy-waiting
                        std::thread::sleep(std::time::Duration::from_millis(10));
                    }
                }
            }
            
            // Clean up terminal on exit
            runtime.block_on(async {
                let mut terminals = terminals.write().await;
                terminals.remove(&terminal_id);
            });
        });
    }
}

// Tauri command handlers

#[tauri::command]
pub async fn create_terminal(
    state: tauri::State<'_, Arc<Mutex<TerminalManager>>>,
    options: CreateTerminalOptions,
) -> Result<CreateTerminalResponse, String> {
    let manager = state.lock().await;
    manager.create_terminal(options).await
}

#[tauri::command]
pub async fn write_to_terminal(
    state: tauri::State<'_, Arc<Mutex<TerminalManager>>>,
    terminal_id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.write_to_terminal(terminal_id, data).await
}

#[tauri::command]
pub async fn read_from_terminal(
    state: tauri::State<'_, Arc<Mutex<TerminalManager>>>,
    terminal_id: String,
) -> Result<Vec<u8>, String> {
    let manager = state.lock().await;
    manager.read_from_terminal(terminal_id).await
}

#[tauri::command]
pub async fn resize_terminal(
    state: tauri::State<'_, Arc<Mutex<TerminalManager>>>,
    terminal_id: String,
    size: TerminalSize,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.resize_terminal(terminal_id, size).await
}

#[tauri::command]
pub async fn close_terminal(
    state: tauri::State<'_, Arc<Mutex<TerminalManager>>>,
    terminal_id: String,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.close_terminal(terminal_id).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_terminal() {
        // Create event channel
        let (event_sender, mut event_receiver) = mpsc::channel::<TerminalEvent>(100);
        
        // Create terminal manager
        let manager = TerminalManager::new(event_sender);
        
        // Create terminal with default options
        let options = CreateTerminalOptions {
            shell: None,
            cwd: None,
            env: None,
            size: Some(TerminalSize { rows: 24, cols: 80 }),
        };
        
        let result = manager.create_terminal(options).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert!(!response.terminal_id.is_empty());
        
        // Write a simple command
        let terminal_id = response.terminal_id.clone();
        let write_result = manager.write_to_terminal(
            terminal_id.clone(),
            b"echo 'Hello from Rust terminal!'\n".to_vec()
        ).await;
        assert!(write_result.is_ok());
        
        // Wait for output
        tokio::time::timeout(std::time::Duration::from_secs(2), async {
            while let Some(event) = event_receiver.recv().await {
                match event {
                    TerminalEvent::Output { terminal_id: tid, data } => {
                        if tid == terminal_id {
                            let output = String::from_utf8_lossy(&data);
                            println!("Terminal output: {}", output);
                            if output.contains("Hello from Rust terminal!") {
                                break;
                            }
                        }
                    }
                    _ => {}
                }
            }
        }).await.ok();
        
        // Close terminal
        let close_result = manager.close_terminal(terminal_id).await;
        assert!(close_result.is_ok());
    }
}