use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::fs;
use std::path::PathBuf;

const ITERATIONS: u32 = 600_000;
const SALT_LEN: usize = 16;
const KEY_LEN: usize = 32; // AES-256
const NONCE_LEN: usize = 12; // AES-GCM standard

// ============================================================
// Data structures persisted to crypto.json
// ============================================================

#[derive(Serialize, Deserialize, Default)]
pub struct CryptoState {
    pub salt: Option<String>,     // base64-encoded salt
    pub pw_hash: Option<String>,  // base64-encoded PBKDF2 hash of password
}

fn crypto_path() -> Result<PathBuf, String> {
    let base = dirs::data_dir()
        .ok_or_else(|| "Could not determine app data directory".to_string())?;
    Ok(base.join("folio").join("crypto.json"))
}

fn load_crypto_state() -> Result<CryptoState, String> {
    let path = crypto_path()?;
    if !path.exists() {
        return Ok(CryptoState::default());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read crypto state: {e}"))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse crypto state: {e}"))
}

fn save_crypto_state(state: &CryptoState) -> Result<(), String> {
    let path = crypto_path()?;
    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize crypto state: {e}"))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write crypto state: {e}"))
}

// ============================================================
// Key derivation helpers
// ============================================================

fn derive_key(password: &str, salt: &[u8]) -> [u8; KEY_LEN] {
    let mut key = [0u8; KEY_LEN];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, ITERATIONS, &mut key);
    key
}

fn hash_password(password: &str, salt: &[u8]) -> String {
    let key = derive_key(password, salt);
    B64.encode(key)
}

// ============================================================
// Tauri commands
// ============================================================

#[tauri::command]
pub fn has_master_password() -> Result<bool, String> {
    let state = load_crypto_state()?;
    Ok(state.pw_hash.is_some())
}

#[tauri::command]
pub fn set_master_password(password: String) -> Result<(), String> {
    let mut salt = [0u8; SALT_LEN];
    rand::thread_rng().fill_bytes(&mut salt);

    let hash = hash_password(&password, &salt);

    let state = CryptoState {
        salt: Some(B64.encode(salt)),
        pw_hash: Some(hash),
    };
    save_crypto_state(&state)
}

#[tauri::command]
pub fn verify_password(password: String) -> Result<bool, String> {
    let state = load_crypto_state()?;
    match (state.salt, state.pw_hash) {
        (Some(salt_b64), Some(stored_hash)) => {
            let salt = B64.decode(&salt_b64)
                .map_err(|e| format!("Invalid salt: {e}"))?;
            let computed = hash_password(&password, &salt);
            Ok(computed == stored_hash)
        }
        _ => Ok(false),
    }
}

#[tauri::command]
pub fn encrypt_data(data: String, password: String) -> Result<serde_json::Value, String> {
    let state = load_crypto_state()?;
    let salt_b64 = state.salt.ok_or("No master password set")?;
    let salt = B64.decode(&salt_b64)
        .map_err(|e| format!("Invalid salt: {e}"))?;

    let key_bytes = derive_key(&password, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Cipher init failed: {e}"))?;

    let mut nonce_bytes = [0u8; NONCE_LEN];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| format!("Encryption failed: {e}"))?;

    Ok(serde_json::json!({
        "iv": B64.encode(nonce_bytes),
        "ct": B64.encode(ciphertext),
    }))
}

#[tauri::command]
pub fn decrypt_data(iv: String, ct: String, password: String) -> Result<String, String> {
    let state = load_crypto_state()?;
    let salt_b64 = state.salt.ok_or("No master password set")?;
    let salt = B64.decode(&salt_b64)
        .map_err(|e| format!("Invalid salt: {e}"))?;

    let key_bytes = derive_key(&password, &salt);
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Cipher init failed: {e}"))?;

    let nonce_bytes = B64.decode(&iv)
        .map_err(|e| format!("Invalid IV: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = B64.decode(&ct)
        .map_err(|e| format!("Invalid ciphertext: {e}"))?;

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Decryption failed — wrong password?".to_string())?;

    String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8 in decrypted data: {e}"))
}
