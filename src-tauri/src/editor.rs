use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::{mpsc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    name: String,
    path: String,
    is_directory: bool,
    size: Option<u64>,
    modified_date: Option<u64>,
    created_date: Option<u64>,
    readonly: bool,
    permissions: String,
    parent_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    path: String,
    change_type: String, // "modified", "created", "deleted", "renamed"
    timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorSession {
    id: String,
    files: Vec<String>,
    active_file: Option<String>,
    created_at: u64,
    last_accessed: u64,
}

pub struct FileWatcherManager {
    watchers: Arc<Mutex<HashMap<String, RecommendedWatcher>>>,
    app_handle: AppHandle,
}

impl FileWatcherManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            watchers: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    pub async fn watch_file(&self, file_path: String) -> Result<(), String> {
        let path = Path::new(&file_path);
        if !path.exists() {
            return Err("File does not exist".to_string());
        }

        let (tx, mut rx) = mpsc::channel(100);
        let app_handle = self.app_handle.clone();
        let file_path_clone = file_path.clone();

        // Create watcher
        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                let _ = tx.blocking_send(event);
            }
        })
        .map_err(|e| format!("Failed to create watcher: {}", e))?;

        // Watch the file's parent directory to catch renames/deletions
        let parent_dir = path.parent().unwrap_or(path);
        watcher
            .watch(parent_dir, RecursiveMode::NonRecursive)
            .map_err(|e| format!("Failed to watch file: {}", e))?;

        // Store watcher
        {
            let mut watchers = self.watchers.lock().await;
            watchers.insert(file_path.clone(), watcher);
        }

        // Spawn event handler
        let file_path_for_handler = file_path_clone.clone();
        tokio::spawn(async move {
            while let Some(event) = rx.recv().await {
                if let Some(event_path) = event.paths.first() {
                    if event_path.to_string_lossy().contains(&file_path_for_handler) {
                        let change_type = match event.kind {
                            EventKind::Create(_) => "created",
                            EventKind::Modify(_) => "modified",
                            EventKind::Remove(_) => "deleted",
                            _ => "changed",
                        };

                        let file_event = FileChangeEvent {
                            path: file_path_for_handler.clone(),
                            change_type: change_type.to_string(),
                            timestamp: SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                        };

                        let _ = app_handle.emit("file-changed", &file_event);
                    }
                }
            }
        });

        Ok(())
    }

    pub async fn unwatch_file(&self, file_path: &str) -> Result<(), String> {
        let mut watchers = self.watchers.lock().await;
        watchers.remove(file_path);
        Ok(())
    }
}

// Tauri commands
#[tauri::command]
pub async fn get_file_metadata(file_path: String) -> Result<FileMetadata, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    let created = metadata
        .created()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_string();
    
    let parent_path = Path::new(&file_path)
        .parent()
        .map(|p| p.to_string_lossy().to_string());

    Ok(FileMetadata {
        name: file_name,
        path: file_path,
        is_directory: metadata.is_dir(),
        size: Some(metadata.len()),
        modified_date: modified,
        created_date: created,
        readonly: metadata.permissions().readonly(),
        permissions: {
            #[cfg(unix)]
            {
                format!("{:o}", metadata.permissions().mode())
            }
            #[cfg(not(unix))]
            {
                if metadata.permissions().readonly() {
                    "readonly".to_string()
                } else {
                    "readwrite".to_string()
                }
            }
        },
        parent_path,
    })
}

#[tauri::command]
pub async fn create_file(file_path: String, content: Option<String>) -> Result<(), String> {
    let path = Path::new(&file_path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    let content = content.unwrap_or_default();
    fs::write(&path, content)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    
    if path.is_file() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    } else if path.is_dir() {
        fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        return Err("Path does not exist".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    let old = Path::new(&old_path);
    let new = Path::new(&new_path);

    if !old.exists() {
        return Err("Source file does not exist".to_string());
    }

    if new.exists() {
        return Err("Destination file already exists".to_string());
    }

    // Create parent directories for new path if they don't exist
    if let Some(parent) = new.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    fs::rename(&old, &new)
        .map_err(|e| format!("Failed to rename file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn copy_file(source_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&source_path);
    let dest = Path::new(&dest_path);

    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }

    if dest.exists() {
        return Err("Destination file already exists".to_string());
    }

    // Create parent directories for destination if they don't exist
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    if source.is_file() {
        fs::copy(&source, &dest)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
    } else {
        return Err("Directory copying not implemented".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn list_directory(dir_path: String) -> Result<Vec<FileMetadata>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let path_str = path.to_string_lossy().to_string();

        if let Ok(metadata) = get_file_metadata(path_str).await {
            files.push(metadata);
        }
    }

    // Sort by name
    files.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(files)
}

#[tauri::command]
pub async fn watch_file(
    file_path: String,
    _app_handle: tauri::AppHandle,
    state: tauri::State<'_, Arc<Mutex<FileWatcherManager>>>,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.watch_file(file_path).await
}

#[tauri::command]
pub async fn unwatch_file(
    file_path: String,
    state: tauri::State<'_, Arc<Mutex<FileWatcherManager>>>,
) -> Result<(), String> {
    let manager = state.lock().await;
    manager.unwatch_file(&file_path).await
}

#[tauri::command]
pub async fn create_backup(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let backup_name = format!("{}.backup.{}", file_path, timestamp);
    
    fs::copy(&path, &backup_name)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    Ok(backup_name)
}

#[tauri::command]
pub async fn restore_backup(backup_path: String, original_path: String) -> Result<(), String> {
    let backup = Path::new(&backup_path);
    let original = Path::new(&original_path);

    if !backup.exists() {
        return Err("Backup file does not exist".to_string());
    }

    fs::copy(&backup, &original)
        .map_err(|e| format!("Failed to restore backup: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn save_editor_session(session: EditorSession) -> Result<(), String> {
    let sessions_dir = PathBuf::from(".forge-sessions");
    if !sessions_dir.exists() {
        fs::create_dir_all(&sessions_dir)
            .map_err(|e| format!("Failed to create sessions directory: {}", e))?;
    }

    let session_file = sessions_dir.join(format!("{}.json", session.id));
    let session_json = serde_json::to_string_pretty(&session)
        .map_err(|e| format!("Failed to serialize session: {}", e))?;

    fs::write(&session_file, session_json)
        .map_err(|e| format!("Failed to save session: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn load_editor_session(session_id: String) -> Result<EditorSession, String> {
    let session_file = PathBuf::from(".forge-sessions").join(format!("{}.json", session_id));
    
    if !session_file.exists() {
        return Err("Session file does not exist".to_string());
    }

    let session_data = fs::read_to_string(&session_file)
        .map_err(|e| format!("Failed to read session file: {}", e))?;

    let session: EditorSession = serde_json::from_str(&session_data)
        .map_err(|e| format!("Failed to parse session: {}", e))?;

    Ok(session)
}

#[tauri::command]
pub async fn list_editor_sessions() -> Result<Vec<EditorSession>, String> {
    let sessions_dir = PathBuf::from(".forge-sessions");
    if !sessions_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&sessions_dir)
        .map_err(|e| format!("Failed to read sessions directory: {}", e))?;

    let mut sessions = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(session_data) = fs::read_to_string(&path) {
                if let Ok(session) = serde_json::from_str::<EditorSession>(&session_data) {
                    sessions.push(session);
                }
            }
        }
    }

    // Sort by last accessed (most recent first)
    sessions.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));

    Ok(sessions)
}