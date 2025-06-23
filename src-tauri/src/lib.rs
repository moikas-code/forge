mod terminal;
mod editor;
mod browser;

use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tauri::{Emitter, Manager};
use std::fs;
use std::path::Path;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// File system commands with better error handling
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
async fn get_file_info(path: String) -> Result<serde_json::Value, String> {
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    Ok(serde_json::json!({
        "size": metadata.len(),
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
        "modified": metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
    }))
}

// Terminal session persistence commands
#[derive(Serialize, Deserialize)]
struct TerminalSessionInfo {
    cwd: String,
    shell: String,
    environment: HashMap<String, String>,
    is_running: bool,
    exit_code: Option<i32>,
}

#[tauri::command]
async fn get_terminal_session_info(_terminal_id: String) -> Result<TerminalSessionInfo, String> {
    // Mock implementation - in a real app, this would query the terminal manager
    Ok(TerminalSessionInfo {
        cwd: std::env::current_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        shell: std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string()),
        environment: std::env::vars().collect(),
        is_running: true,
        exit_code: None,
    })
}

#[tauri::command]
async fn get_terminal_history(_terminal_id: String) -> Result<Vec<String>, String> {
    // Mock implementation - in a real app, this would query the terminal manager
    Ok(vec![
        "echo 'Hello World'".to_string(),
        "ls -la".to_string(),
        "git status".to_string(),
    ])
}

#[tauri::command]
async fn get_terminal_cwd(_terminal_id: String) -> Result<String, String> {
    // Mock implementation - in a real app, this would query the terminal manager
    std::env::current_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| format!("Failed to get current directory: {}", e))
}

#[derive(Serialize, Deserialize)]
struct TerminalCreationOptions {
    shell: Option<String>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    history: Option<Vec<String>>,
}

#[tauri::command]
async fn create_terminal_with_state(_options: TerminalCreationOptions) -> Result<String, String> {
    // Mock implementation - in a real app, this would create a terminal with the provided state
    Ok(format!("terminal_{}", uuid::Uuid::new_v4()))
}

// SSH connection testing
#[tauri::command]
async fn test_ssh_connection(
    _host: String,
    _port: u16,
    _username: String,
    _key_path: Option<String>,
) -> Result<bool, String> {
    // Mock implementation - in a real app, this would test the SSH connection
    // For now, just simulate a successful connection
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    Ok(true)
}

// SSH key file selection
#[tauri::command]
async fn select_ssh_key_file() -> Result<String, String> {
    // Mock implementation - in a real app, this would open a file dialog
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/".to_string());
    Ok(format!("{}/.ssh/id_rsa", home_dir))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create a channel for terminal events
    let (event_sender, mut event_receiver) = mpsc::channel::<terminal::TerminalEvent>(100);
    
    // Create the terminal manager
    let terminal_manager = Arc::new(Mutex::new(terminal::TerminalManager::new(event_sender)));
    
    // Create the browser manager
    let browser_manager = browser::BrowserManager::new();
    
    // Create the embedded browser manager
    let embedded_browser_manager = browser::EmbeddedBrowserManager::new();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(terminal_manager)
        .manage(browser_manager)
        .manage(embedded_browser_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file,
            write_file,
            file_exists,
            get_file_info,
            terminal::create_terminal,
            terminal::write_to_terminal,
            terminal::read_from_terminal,
            terminal::resize_terminal,
            terminal::close_terminal,
            get_terminal_session_info,
            get_terminal_history,
            get_terminal_cwd,
            create_terminal_with_state,
            test_ssh_connection,
            select_ssh_key_file,
            editor::get_file_metadata,
            editor::create_file,
            editor::delete_file,
            editor::rename_file,
            editor::copy_file,
            editor::list_directory,
            editor::watch_file,
            editor::unwatch_file,
            editor::create_backup,
            editor::restore_backup,
            editor::save_editor_session,
            editor::load_editor_session,
            editor::list_editor_sessions,
            browser::create_webview_window,
            browser::navigate_browser,
            browser::browser_go_back,
            browser::browser_go_forward,
            browser::browser_refresh,
            browser::toggle_browser_devtools,
            browser::set_browser_viewport,
            browser::capture_browser_screenshot,
            browser::get_browser_console_logs,
            browser::clear_browser_console_logs,
            browser::get_browser_viewport_presets,
            browser::add_console_message,
            browser::save_screenshot,
            browser::create_embedded_browser,
            browser::navigate_embedded_browser,
            browser::resize_embedded_browser,
            browser::close_embedded_browser,
            browser::get_browser_navigation_state,
            browser::get_browser_url
        ])
        .setup(|app| {
            // Create the file watcher manager
            let file_watcher_manager = Arc::new(Mutex::new(editor::FileWatcherManager::new(
                app.handle().clone()
            )));
            app.manage(file_watcher_manager);
            
            // Setup terminal event handling
            let app_handle = app.handle().clone();
            
            // Spawn a task to handle terminal events
            tauri::async_runtime::spawn(async move {
                while let Some(event) = event_receiver.recv().await {
                    // Emit terminal events to the frontend
                    match event {
                        terminal::TerminalEvent::Output { terminal_id, data } => {
                            // Convert Vec<u8> to Vec<i32> for JavaScript compatibility
                            let data_as_numbers: Vec<i32> = data.into_iter().map(|b| b as i32).collect();
                            let _ = app_handle.emit("terminal-output", serde_json::json!({
                                "terminal_id": terminal_id,
                                "data": data_as_numbers
                            }));
                        }
                        terminal::TerminalEvent::Exit { terminal_id, exit_code } => {
                            let _ = app_handle.emit("terminal-exit", serde_json::json!({
                                "terminal_id": terminal_id,
                                "exit_code": exit_code
                            }));
                        }
                        terminal::TerminalEvent::Error { terminal_id, message } => {
                            let _ = app_handle.emit("terminal-error", serde_json::json!({
                                "terminal_id": terminal_id,
                                "message": message
                            }));
                        }
                    }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
