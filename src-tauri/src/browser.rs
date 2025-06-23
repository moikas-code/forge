use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use std::sync::Mutex;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BrowserState {
    pub url: String,
    pub title: String,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub is_loading: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ViewportPreset {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub device_scale_factor: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConsoleMessage {
    pub level: String,
    pub message: String,
    pub source: String,
    pub line: u32,
    pub timestamp: u64,
}

pub struct BrowserManager {
    states: Mutex<HashMap<String, BrowserState>>,
    console_logs: Mutex<Vec<ConsoleMessage>>,
}

impl BrowserManager {
    pub fn new() -> Self {
        Self {
            states: Mutex::new(HashMap::new()),
            console_logs: Mutex::new(Vec::new()),
        }
    }

    pub fn create_browser_state(&self, window_id: String) -> BrowserState {
        let state = BrowserState {
            url: "http://localhost:3000".to_string(),
            title: "Browser".to_string(),
            can_go_back: false,
            can_go_forward: false,
            is_loading: false,
        };
        
        self.states.lock().unwrap().insert(window_id.clone(), state.clone());
        state
    }

    pub fn update_browser_state(&self, window_id: String, state: BrowserState) {
        self.states.lock().unwrap().insert(window_id, state);
    }

    pub fn get_browser_state(&self, window_id: &str) -> Option<BrowserState> {
        self.states.lock().unwrap().get(window_id).cloned()
    }

    pub fn add_console_log(&self, message: ConsoleMessage) {
        let mut logs = self.console_logs.lock().unwrap();
        logs.push(message);
        
        // Keep only last 1000 messages
        if logs.len() > 1000 {
            let start = logs.len() - 1000;
            logs.drain(0..start);
        }
    }

    pub fn get_console_logs(&self) -> Vec<ConsoleMessage> {
        self.console_logs.lock().unwrap().clone()
    }

    pub fn clear_console_logs(&self) {
        self.console_logs.lock().unwrap().clear();
    }
}

#[tauri::command]
pub async fn create_webview_window(
    app: AppHandle,
    url: String,
    title: String,
) -> Result<String, String> {
    let window_id = format!("browser-{}", uuid::Uuid::new_v4());
    
    let window = WebviewWindowBuilder::new(
        &app,
        &window_id,
        WebviewUrl::External(url.parse().map_err(|e: url::ParseError| e.to_string())?),
    )
    .title(&title)
    .inner_size(1024.0, 768.0)
    .decorations(true)
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Enable DevTools in debug mode
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }

    Ok(window_id)
}

#[tauri::command]
pub async fn navigate_browser(
    app: AppHandle,
    window_id: String,
    url: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.eval(&format!(r#"window.location.href = "{}""#, url))
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn browser_go_back(
    app: AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.eval("window.history.back()")
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn browser_go_forward(
    app: AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.eval("window.history.forward()")
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn browser_refresh(
    app: AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        window.eval("window.location.reload()")
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn toggle_browser_devtools(
    app: AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn set_browser_viewport(
    app: AppHandle,
    window_id: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_id) {
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width,
            height,
        }));
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn capture_browser_screenshot(
    app: AppHandle,
    window_id: String,
) -> Result<Vec<u8>, String> {
    if let Some(_window) = app.get_webview_window(&window_id) {
        // This is a placeholder - actual implementation would use platform-specific APIs
        // or a JavaScript-based solution
        Err("Screenshot capture not yet implemented".to_string())
    } else {
        Err("Window not found".to_string())
    }
}

#[tauri::command]
pub async fn get_browser_console_logs(
    app: AppHandle,
) -> Result<Vec<ConsoleMessage>, String> {
    if let Some(browser_manager) = app.try_state::<BrowserManager>() {
        Ok(browser_manager.get_console_logs())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn clear_browser_console_logs(
    app: AppHandle,
) -> Result<(), String> {
    if let Some(browser_manager) = app.try_state::<BrowserManager>() {
        browser_manager.clear_console_logs();
        Ok(())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn add_console_message(
    app: AppHandle,
    level: String,
    message: String,
    source: String,
    line: u32,
    timestamp: u64,
) -> Result<(), String> {
    if let Some(browser_manager) = app.try_state::<BrowserManager>() {
        browser_manager.add_console_log(ConsoleMessage {
            level,
            message,
            source,
            line,
            timestamp,
        });
        Ok(())
    } else {
        Err("Browser manager not initialized".to_string())
    }
}

#[tauri::command]
pub async fn save_screenshot(
    data: String,
    filename: String,
) -> Result<(), String> {
    use base64::Engine;
    use std::fs::File;
    use std::io::Write;
    
    // Decode base64
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Get downloads directory
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| "Could not find downloads directory".to_string())?;
    
    let file_path = downloads_dir.join(&filename);
    
    // Write file
    let mut file = File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}

pub fn get_viewport_presets() -> Vec<ViewportPreset> {
    vec![
        ViewportPreset {
            name: "iPhone SE".to_string(),
            width: 375,
            height: 667,
            device_scale_factor: 2.0,
        },
        ViewportPreset {
            name: "iPhone 14 Pro".to_string(),
            width: 393,
            height: 852,
            device_scale_factor: 3.0,
        },
        ViewportPreset {
            name: "iPad Mini".to_string(),
            width: 768,
            height: 1024,
            device_scale_factor: 2.0,
        },
        ViewportPreset {
            name: "iPad Pro 12.9\"".to_string(),
            width: 1024,
            height: 1366,
            device_scale_factor: 2.0,
        },
        ViewportPreset {
            name: "Desktop 1080p".to_string(),
            width: 1920,
            height: 1080,
            device_scale_factor: 1.0,
        },
        ViewportPreset {
            name: "Desktop 1440p".to_string(),
            width: 2560,
            height: 1440,
            device_scale_factor: 1.0,
        },
        ViewportPreset {
            name: "Desktop 4K".to_string(),
            width: 3840,
            height: 2160,
            device_scale_factor: 1.0,
        },
    ]
}

#[tauri::command]
pub async fn get_browser_viewport_presets() -> Result<Vec<ViewportPreset>, String> {
    Ok(get_viewport_presets())
}