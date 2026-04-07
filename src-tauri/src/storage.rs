use serde_json::Value;
use std::fs;
use std::path::PathBuf;

/// Get the app data directory, creating it if needed.
fn data_dir() -> Result<PathBuf, String> {
    let base = dirs::data_dir()
        .ok_or_else(|| "Could not determine app data directory".to_string())?;
    let dir = base.join("folio");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create data dir: {e}"))?;
    Ok(dir)
}

fn file_path(name: &str) -> Result<PathBuf, String> {
    Ok(data_dir()?.join(name))
}

fn read_json_file(name: &str) -> Result<Value, String> {
    let path = file_path(name)?;
    if !path.exists() {
        return Ok(Value::Null);
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read {name}: {e}"))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse {name}: {e}"))
}

fn write_json_file(name: &str, data: &Value) -> Result<(), String> {
    let path = file_path(name)?;
    let content = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize {name}: {e}"))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write {name}: {e}"))
}

// ============================================================
// Tauri commands — Journal Entries
// ============================================================

#[tauri::command]
pub fn load_entries() -> Result<Value, String> {
    read_json_file("entries.json").map(|v| {
        if v.is_null() { Value::Array(vec![]) } else { v }
    })
}

#[tauri::command]
pub fn save_entries(entries: Value) -> Result<(), String> {
    write_json_file("entries.json", &entries)
}

// ============================================================
// Tauri commands — Goals
// ============================================================

#[tauri::command]
pub fn load_goals() -> Result<Value, String> {
    read_json_file("goals.json").map(|v| {
        if v.is_null() { Value::Array(vec![]) } else { v }
    })
}

#[tauri::command]
pub fn save_goals(goals: Value) -> Result<(), String> {
    write_json_file("goals.json", &goals)
}

// ============================================================
// Tauri commands — Notes
// ============================================================

#[tauri::command]
pub fn load_notes() -> Result<Value, String> {
    read_json_file("notes.json").map(|v| {
        if v.is_null() { Value::Array(vec![]) } else { v }
    })
}

#[tauri::command]
pub fn save_notes(notes: Value) -> Result<(), String> {
    write_json_file("notes.json", &notes)
}

// ============================================================
// Tauri commands — Settings
// ============================================================

#[tauri::command]
pub fn load_settings() -> Result<Value, String> {
    read_json_file("settings.json").map(|v| {
        if v.is_null() {
            serde_json::json!({
                "theme": "default",
                "mode": "light",
                "orientation": "auto"
            })
        } else {
            v
        }
    })
}

#[tauri::command]
pub fn save_settings(settings: Value) -> Result<(), String> {
    write_json_file("settings.json", &settings)
}

// ============================================================
// Tauri commands — Backup Export / Import
// ============================================================

#[tauri::command]
pub fn export_backup() -> Result<Value, String> {
    let entries = read_json_file("entries.json").unwrap_or(Value::Array(vec![]));
    let goals = read_json_file("goals.json").unwrap_or(Value::Array(vec![]));
    let notes = read_json_file("notes.json").unwrap_or(Value::Array(vec![]));
    let settings = read_json_file("settings.json").unwrap_or(Value::Null);
    let crypto_state = read_json_file("crypto.json").unwrap_or(Value::Null);

    Ok(serde_json::json!({
        "_folio_backup": true,
        "version": 2,
        "exportedAt": chrono_now(),
        "journalEntries": entries,
        "folioGoals": goals,
        "folioNotes": notes,
        "settings": settings,
        "crypto": crypto_state,
    }))
}

#[tauri::command]
pub fn import_backup(data: Value) -> Result<(), String> {
    if !data.get("_folio_backup").and_then(|v| v.as_bool()).unwrap_or(false) {
        return Err("Not a valid Folio backup".to_string());
    }

    if let Some(entries) = data.get("journalEntries") {
        write_json_file("entries.json", entries)?;
    }
    if let Some(goals) = data.get("folioGoals") {
        write_json_file("goals.json", goals)?;
    }
    if let Some(notes) = data.get("folioNotes") {
        write_json_file("notes.json", notes)?;
    }
    if let Some(settings) = data.get("settings") {
        write_json_file("settings.json", settings)?;
    }
    if let Some(crypto) = data.get("crypto") {
        write_json_file("crypto.json", crypto)?;
    }

    Ok(())
}

/// Simple ISO-ish timestamp without pulling in chrono crate
fn chrono_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{now}")
}
