/**
 * API abstraction layer for Tauri IPC.
 * All data operations go through here so components don't
 * need to know whether they're talking to Tauri or localStorage.
 */
import { invoke } from "@tauri-apps/api/core";

// ============================================================
// Journal Entries
// ============================================================

export async function loadEntries() {
  return invoke("load_entries");
}

export async function saveEntries(entries) {
  return invoke("save_entries", { entries });
}

// ============================================================
// Goals
// ============================================================

export async function loadGoals() {
  return invoke("load_goals");
}

export async function saveGoals(goals) {
  return invoke("save_goals", { goals });
}

// ============================================================
// Notes
// ============================================================

export async function loadNotes() {
  return invoke("load_notes");
}

export async function saveNotes(notes) {
  return invoke("save_notes", { notes });
}

// ============================================================
// Settings
// ============================================================

export async function loadSettings() {
  return invoke("load_settings");
}

export async function saveSettings(settings) {
  return invoke("save_settings", { settings });
}

// ============================================================
// Backup
// ============================================================

export async function exportBackup() {
  return invoke("export_backup");
}

export async function importBackup(data) {
  return invoke("import_backup", { data });
}

// ============================================================
// Crypto
// ============================================================

export async function hasMasterPassword() {
  return invoke("has_master_password");
}

export async function setMasterPassword(password) {
  return invoke("set_master_password", { password });
}

export async function verifyPassword(password) {
  return invoke("verify_password", { password });
}

export async function encryptData(data, password) {
  return invoke("encrypt_data", { data: JSON.stringify(data), password });
}

export async function decryptData(iv, ct, password) {
  const json = await invoke("decrypt_data", { iv, ct, password });
  return JSON.parse(json);
}
