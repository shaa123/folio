mod crypto;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Storage commands
            storage::load_entries,
            storage::save_entries,
            storage::load_goals,
            storage::save_goals,
            storage::load_notes,
            storage::save_notes,
            storage::load_settings,
            storage::save_settings,
            storage::export_backup,
            storage::import_backup,
            // Crypto commands
            crypto::has_master_password,
            crypto::set_master_password,
            crypto::verify_password,
            crypto::encrypt_data,
            crypto::decrypt_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
