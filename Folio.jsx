import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// CONSTANTS & UTILITIES
// ============================================================

const EMOJIS = [
  '😊','😄','🥰','😁','😃','🤗',
  '❤️','💕','💖','💗','💝','💘',
  '😢','😭','😞','😔','🥺','😿',
  '🎉','🥳','✨','🎊','🌟','⭐',
  '🤔','😕','😐','🙃','😮','😯',
  '😠','😡','🤬','😤','💢','👿',
  '😴','🥱','😪','💤','🌙','🛌',
  '😎','🆒','🧊','❄️','🏖️','😌',
  '😲','😱','🤯','😳','🫢','😧',
  '💃','🕺','🎵','🎶','🎤','🎸',
  '🍕','🍔','🍰','🍪','🍩','🍜',
  '🤗','🫂','💝','🧸','☁️','🌈',
  '✌️','😇','🕊️','🧘','☮️','🍃',
  '👋','🙋','👐','🤝','🫡','💁',
  '🌈','🎨','🦄','🪐','🌺','🌸',
  '🌸','🌻','🌷','🌹','🏵️',
  '🎁','🎀','🎈','🧁',
];

const MOOD_CATEGORIES = {
  happy: { label: 'Happy', emojis: ['😊','😄','😁','😃','🤗','😌','😇'], color: '#66bb6a', css: 'happy' },
  love: { label: 'Loving', emojis: ['🥰','❤️','💕','💖','💗','💝','💘','🫂','🧸'], color: '#f06292', css: 'love' },
  sad: { label: 'Sad', emojis: ['😢','😭','😞','😔','🥺','😿'], color: '#64b5f6', css: 'sad' },
  excited: { label: 'Excited', emojis: ['🎉','🥳','✨','🎊','🌟','⭐','💃','🕺','🎵','🎶','🎤','🎸','🌈','🎨','🦄','🪐','🌺','🌸','🌻','🌷','🌹','🏵️','🎁','🎀','🎈','🧁','🍰','💫','⚡'], color: '#fdd835', css: 'excited' },
  thinking: { label: 'Thoughtful', emojis: ['🤔','😕','😐','🙃','😮','😯'], color: '#ba68c8', css: 'thinking' },
  angry: { label: 'Angry', emojis: ['😠','😡','🤬','😤','💢','👿'], color: '#e57373', css: 'angry' },
  sleepy: { label: 'Tired', emojis: ['😴','🥱','😪','💤','🌙','🛌'], color: '#90a4ae', css: 'sleepy' },
  cool: { label: 'Chill', emojis: ['😎','🆒','🧊','❄️','🏖️','✌️','🕊️','🧘','☮️','🍃'], color: '#4dd0e1', css: 'cool' },
  shocked: { label: 'Surprised', emojis: ['😲','😱','🤯','😳','🫢','😧'], color: '#ffb74d', css: 'shocked' },
  food: { label: 'Foodie', emojis: ['🍕','🍔','🍰','🍪','🍩','🍜'], color: '#a1887f', css: 'other' },
  social: { label: 'Social', emojis: ['👋','🙋','👐','🤝','🫡','💁','🌈','☁️'], color: '#81c784', css: 'other' },
};

function getEmojiCategory(emoji) {
  if (!emoji) return null;
  for (const [key, cat] of Object.entries(MOOD_CATEGORIES)) {
    if (cat.emojis.includes(emoji)) return { key, ...cat };
  }
  return { key: 'other', label: 'Other', color: '#81c784', css: 'other' };
}

const CAUSE_TAGS = [
  { key: 'work', label: '💼 Work', emoji: '💼' },
  { key: 'school', label: '📚 School', emoji: '📚' },
  { key: 'relationships', label: '💕 Relationships', emoji: '💕' },
  { key: 'family', label: '👨‍👩‍👧 Family', emoji: '👨‍👩‍👧' },
  { key: 'friends', label: '👫 Friends', emoji: '👫' },
  { key: 'health', label: '🏥 Health', emoji: '🏥' },
  { key: 'sleep', label: '😴 Sleep', emoji: '😴' },
  { key: 'exercise', label: '🏃 Exercise', emoji: '🏃' },
  { key: 'food', label: '🍽️ Food', emoji: '🍽️' },
  { key: 'money', label: '💰 Money', emoji: '💰' },
  { key: 'selfcare', label: '🧘 Self-care', emoji: '🧘' },
  { key: 'weather', label: '🌤️ Weather', emoji: '🌤️' },
  { key: 'social', label: '📱 Social Media', emoji: '📱' },
  { key: 'hobbies', label: '🎮 Hobbies', emoji: '🎮' },
  { key: 'travel', label: '✈️ Travel', emoji: '✈️' },
  { key: 'other', label: '🏷️ Other', emoji: '🏷️' },
];

function getStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function setStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ============================================================
// CRYPTOGRAPHY — PBKDF2 key derivation + AES-256-GCM encryption
// No plaintext passwords stored. All diary data encrypted at rest.
// ============================================================
const CRYPTO = {
  SALT_KEY: 'folio_salt',
  HASH_KEY: 'folio_pw_hash',
  ENC_KEY: 'folio_entries_enc',
  ITERATIONS: 600000,

  async getRandomSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  },

  bufToBase64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  },

  base64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  },

  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: CRYPTO.ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async hashPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: CRYPTO.ITERATIONS, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return CRYPTO.bufToBase64(bits);
  },

  async encrypt(data, key) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    return { iv: CRYPTO.bufToBase64(iv), ct: CRYPTO.bufToBase64(ct) };
  },

  async decrypt(encData, key) {
    const iv = CRYPTO.base64ToBuf(encData.iv);
    const ct = CRYPTO.base64ToBuf(encData.ct);
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(dec));
  },

  hasMasterPassword() {
    return !!localStorage.getItem(CRYPTO.HASH_KEY);
  },

  async setMasterPassword(password) {
    const salt = await CRYPTO.getRandomSalt();
    const hash = await CRYPTO.hashPassword(password, salt);
    localStorage.setItem(CRYPTO.SALT_KEY, CRYPTO.bufToBase64(salt));
    localStorage.setItem(CRYPTO.HASH_KEY, hash);
    // Remove any legacy plaintext password
    localStorage.removeItem('journalMasterPassword');
  },

  async verifyPassword(password) {
    const saltB64 = localStorage.getItem(CRYPTO.SALT_KEY);
    const storedHash = localStorage.getItem(CRYPTO.HASH_KEY);
    if (!saltB64 || !storedHash) return false;
    const salt = CRYPTO.base64ToBuf(saltB64);
    const hash = await CRYPTO.hashPassword(password, salt);
    return hash === storedHash;
  },

  async encryptEntries(entries, password) {
    const saltB64 = localStorage.getItem(CRYPTO.SALT_KEY);
    if (!saltB64) return;
    const salt = CRYPTO.base64ToBuf(saltB64);
    const key = await CRYPTO.deriveKey(password, salt);
    const encData = await CRYPTO.encrypt(entries, key);
    localStorage.setItem(CRYPTO.ENC_KEY, JSON.stringify(encData));
  },

  async decryptEntries(password) {
    const encRaw = localStorage.getItem(CRYPTO.ENC_KEY);
    if (!encRaw) return null;
    const saltB64 = localStorage.getItem(CRYPTO.SALT_KEY);
    if (!saltB64) return null;
    const salt = CRYPTO.base64ToBuf(saltB64);
    const key = await CRYPTO.deriveKey(password, salt);
    try {
      return await CRYPTO.decrypt(JSON.parse(encRaw), key);
    } catch {
      return null;
    }
  },

  // Migrate from legacy plaintext password (one-time)
  async migrateLegacy() {
    const legacy = localStorage.getItem('journalMasterPassword');
    if (legacy && !CRYPTO.hasMasterPassword()) {
      await CRYPTO.setMasterPassword(legacy);
      const entries = getStorage('journalEntries', []);
      if (entries.length > 0) {
        await CRYPTO.encryptEntries(entries, legacy);
      }
      localStorage.removeItem('journalMasterPassword');
      return true;
    }
    return false;
  }
};

function getStartOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function safeDateParse(entry) {
  const d = new Date(entry.dateISO || entry.date);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getEntriesForRange(entries, startDate, endDate) {
  return entries.filter(e => {
    const d = safeDateParse(e);
    return d >= startDate && d <= endDate;
  });
}

// Time display helper
function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// CSS (injected once)
// ============================================================
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,500;1,300;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

:root {
  --bg1: #0E1A12; --bg2: #122018; --bg3: #0E1A12;
  --card-bg: rgba(22,38,28,0.94); --card-border: rgba(62,90,73,0.45);
  --border: #3E5A49; --text1: #E9F2EC; --text2: #B7CBBF;
  --btn1: #6FAF8F; --btn2: #A6C48A; --btn3: #6FAF8F;
  --vine: #6FAF8F;
  --glow: 111,175,143; --glow2: 166,196,138; --accent: #A6C48A;
}

body.forest-theme {
  --bg1: #1A0E08; --bg2: #201410; --bg3: #18100A;
  --card-bg: rgba(38,22,16,0.95); --card-border: rgba(120,62,35,0.4);
  --border: #7A3E23; --text1: #F5E8DA; --text2: #D4B89A;
  --btn1: #C8702A; --btn2: #E8A040; --btn3: #B8622A;
  --vine: #A05828;
  --glow: 200,112,42; --glow2: 232,160,64; --accent: #E8A040;
}

/* ============================================================
   EMBER GROVE — Complete Theme
   Warm auburn forest canopy at golden hour
   ============================================================ */

/* Ember Grove — layered background: warm noise + ember glow spots */
body.forest-theme #folio-root::before {
  background:
    radial-gradient(ellipse 70% 50% at 15% 20%, rgba(200,112,42,0.045) 0%, transparent 65%),
    radial-gradient(ellipse 50% 40% at 75% 15%, rgba(232,160,64,0.035) 0%, transparent 55%),
    radial-gradient(ellipse 80% 35% at 50% 85%, rgba(120,62,35,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 90% 70%, rgba(200,112,42,0.03) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.6' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");
}
body.forest-theme #folio-root::after {
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cpath d='M80 0 Q105 50 85 110 Q65 155 90 195 Q75 210 60 195 Q40 155 60 110 Q80 50 60 0Z' fill='%237A3E23' opacity='.035'/%3E%3Cpath d='M680 10 Q710 70 690 130 Q660 190 695 230 Q680 245 660 230 Q630 190 655 130 Q680 70 655 10Z' fill='%237A3E23' opacity='.03'/%3E%3Cellipse cx='150' cy='140' rx='6' ry='9' fill='%23C8702A' opacity='.045' transform='rotate(-35 150 140)'/%3E%3Cellipse cx='420' cy='80' rx='5' ry='8' fill='%23E8A040' opacity='.035' transform='rotate(25 420 80)'/%3E%3Cellipse cx='620' cy='260' rx='6' ry='9' fill='%23A05828' opacity='.04' transform='rotate(-20 620 260)'/%3E%3Cellipse cx='280' cy='380' rx='5' ry='7' fill='%23C8702A' opacity='.035' transform='rotate(40 280 380)'/%3E%3Cellipse cx='520' cy='480' rx='4' ry='6' fill='%23E8A040' opacity='.03' transform='rotate(-30 520 480)'/%3E%3Ccircle cx='200' cy='100' r='1.5' fill='%23E8A040' opacity='.06'/%3E%3Ccircle cx='550' cy='150' r='1' fill='%23C8702A' opacity='.05'/%3E%3Ccircle cx='350' cy='300' r='1.5' fill='%23E8A040' opacity='.04'/%3E%3Ccircle cx='700' cy='400' r='1' fill='%23C8702A' opacity='.05'/%3E%3C/svg%3E") no-repeat center/cover;
}

/* Ember Grove — vines: gnarled branches with auburn leaf clusters */
body.forest-theme .vine-left {
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M22,0 Q35,40 20,90 Q10,130 25,170 Q35,210 18,260 Q10,300 25,340 Q32,380 20,430 Q12,470 22,500" fill="none" stroke="%237A3E23" stroke-width="2.2" opacity="0.22"/><ellipse cx="30" cy="75" rx="5" ry="8" fill="%23C8702A" opacity="0.16" transform="rotate(-30 30 75)"/><ellipse cx="18" cy="170" rx="4" ry="7" fill="%23B06020" opacity="0.14" transform="rotate(20 18 170)"/><ellipse cx="32" cy="255" rx="5" ry="8" fill="%23D48830" opacity="0.12" transform="rotate(-25 32 255)"/><ellipse cx="14" cy="340" rx="4" ry="6" fill="%23C8702A" opacity="0.13" transform="rotate(15 14 340)"/><ellipse cx="28" cy="430" rx="3" ry="5" fill="%23A05828" opacity="0.11" transform="rotate(-20 28 430)"/><circle cx="38" cy="130" r="1.5" fill="%23E8A040" opacity="0.18"/><circle cx="12" cy="220" r="1" fill="%23E8A040" opacity="0.15"/></svg>') repeat-y;
}
body.forest-theme .vine-right {
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M78,0 Q65,45 80,95 Q90,135 75,180 Q65,220 82,265 Q90,305 75,350 Q68,390 80,440 Q88,475 78,500" fill="none" stroke="%237A3E23" stroke-width="2.2" opacity="0.22"/><ellipse cx="70" cy="130" rx="5" ry="8" fill="%23C8702A" opacity="0.16" transform="rotate(30 70 130)"/><ellipse cx="84" cy="210" rx="4" ry="7" fill="%23B06020" opacity="0.14" transform="rotate(-20 84 210)"/><ellipse cx="68" cy="295" rx="5" ry="8" fill="%23D48830" opacity="0.12" transform="rotate(25 68 295)"/><ellipse cx="86" cy="380" rx="4" ry="6" fill="%23C8702A" opacity="0.13" transform="rotate(-15 86 380)"/><circle cx="62" cy="165" r="1.5" fill="%23E8A040" opacity="0.18"/></svg>') repeat-y;
}

/* Ember Grove — sun: warm amber orb with ember halo */
body.forest-theme .sun {
  width: 85px; height: 85px;
  background: radial-gradient(circle, rgba(232,160,64,0.9) 0%, rgba(200,112,42,0.6) 40%, rgba(176,96,32,0.2) 70%, transparent 100%);
  box-shadow: 0 0 35px rgba(232,160,64,0.45), 0 0 70px rgba(200,112,42,0.2), 0 0 120px rgba(176,96,32,0.08);
}

/* Ember Grove — header with warm glow */
body.forest-theme .header { background: linear-gradient(135deg, rgba(38,22,16,0.95), rgba(50,30,18,0.9)); }
body.forest-theme .header h1 { animation: emberGlow 2.5s ease-in-out infinite alternate; }
@keyframes emberGlow {
  0% { text-shadow: 0 0 12px rgba(200,112,42,.3), 0 0 24px rgba(200,112,42,.15), 2px 2px 4px rgba(245,232,218,.5); transform:scale(1); }
  100% { text-shadow: 0 0 22px rgba(232,160,64,.45), 0 0 40px rgba(232,160,64,.2), 2px 2px 4px rgba(245,232,218,.5); transform:scale(1.02); }
}

/* Ember Grove — trees + scrollbar */
body.forest-theme .forest-trees { display: block; }
body.forest-theme .tree { filter: drop-shadow(2px 4px 8px rgba(176,96,32,0.2)); }
body.forest-theme ::-webkit-scrollbar-track { background: rgba(38,22,16,.6); }
body.forest-theme ::-webkit-scrollbar-thumb { background: linear-gradient(135deg,#C8702A,#A05828); }

/* Ember Grove — element overrides */
body.forest-theme .sparkle { color: #D48830; }
body.forest-theme .heart-divider { color: #C8702A; }
body.forest-theme .form-input,
body.forest-theme .form-textarea,
body.forest-theme .emoji-picker-container { background: #2E1A10; }
body.forest-theme .form-input::placeholder,
body.forest-theme .form-textarea::placeholder { color: #8A6848; }
body.forest-theme .form-input:focus,
body.forest-theme .form-textarea:focus { box-shadow: 0 0 0 3px rgba(200,112,42,.4); }
body.forest-theme .search-input:focus { box-shadow: 0 0 0 3px rgba(200,112,42,.4); }
body.forest-theme .emoji-dropdown { background: #241610; }
body.forest-theme .emoji-opt:hover { background: linear-gradient(135deg,rgba(200,112,42,.18),rgba(232,160,64,.1)); }

body.forest-theme .settings-dropdown { background: #241610; }
body.forest-theme .settings-section { background: #2E1A10; }
body.forest-theme .settings-label { background: #241610; }
body.forest-theme .settings-label:hover { background: #2E1A10; }
body.forest-theme .settings-opt { background: #2E1A10; }
body.forest-theme .settings-opt:hover { background: rgba(200,112,42,.12); }
body.forest-theme .settings-opt.active { background: linear-gradient(135deg,rgba(200,112,42,.2),rgba(232,160,64,.1)); }

body.forest-theme .book-container { background: linear-gradient(135deg,#2E1A10,#241610); border-color: #7A3E23; border-left-color: #5A2E18; box-shadow: 0 8px 28px rgba(24,16,10,.55),inset -3px 0 8px rgba(24,16,10,.4),inset 3px 0 5px rgba(120,62,35,.25); }
body.forest-theme .book-container:hover { box-shadow: 0 12px 38px rgba(24,16,10,.65),inset -3px 0 8px rgba(24,16,10,.4); }
body.forest-theme .book-cover { background: linear-gradient(135deg,#241610,#2E1A10 50%,#241610); }
body.forest-theme .book-cover::before,
body.forest-theme .book-cover::after { color: #E8A040; text-shadow: 0 0 15px rgba(232,160,64,.45); }
body.forest-theme .book-spine { background: linear-gradient(180deg,#1A0E08,#140A06 20%,#1A0E08 40%,#140A06 60%,#1A0E08 80%,#140A06); }
body.forest-theme .book-date-badge { background: linear-gradient(135deg,#C8702A,#E8A040); color: #1A0E08; border-color: #E8A040; box-shadow: 0 4px 18px rgba(200,112,42,.4),inset 0 0 25px rgba(232,160,64,.2); }
body.forest-theme .book-pages { background: #241610; }
body.forest-theme .saved-entry { background: #2E1A10; border-left-color: #C8702A; }
body.forest-theme .entry-text { background: rgba(200,112,42,.08); }
body.forest-theme .locked-content { background: rgba(200,112,42,.08); }
body.forest-theme .bookmark-star { color: #8A6848; }
body.forest-theme .saved-entry.bookmarked .bookmark-star { color: #E8A040; filter: drop-shadow(0 0 4px rgba(232,160,64,.5)); }
body.forest-theme .delete-btn { background: linear-gradient(135deg,#8A5030,#6A3820); }
body.forest-theme .delete-btn:hover { background: linear-gradient(135deg,#A05828,#8A4520); }
body.forest-theme .page-divider { background: linear-gradient(to right,transparent,#7A3E23 20%,#7A3E23 80%,transparent); }
body.forest-theme .page-divider::before { background: #2E1A10; }

body.forest-theme .modal-box { background: #241610; }
body.forest-theme .modal-input { background: #2E1A10; }
body.forest-theme .modal-btn-cancel { background: #2E1A10; color: #D4B89A; }
body.forest-theme .modal-btn-cancel:hover { background: #3A2215; }
body.forest-theme .modal-btn-confirm { background: linear-gradient(135deg,#C8702A,#E8A040); color: #1A0E08; }
body.forest-theme .modal-btn-confirm:hover { background: linear-gradient(135deg,#D48830,#E8A040); }

/* Ember Grove — mood page */
body.forest-theme .mood-card { background: rgba(38,22,16,.93); box-shadow: 0 4px 22px rgba(24,16,10,.35); border-color: rgba(120,62,35,.35); }
body.forest-theme .mood-card-title { color: #E8A040; }
body.forest-theme .today-mood-entry { background: rgba(46,26,16,.5); border-left-color: #C8702A; }
body.forest-theme .today-mood-title { color: #E8A040; }
body.forest-theme .today-mood-time,
body.forest-theme .today-mood-snippet { color: #D4B89A; }
body.forest-theme .mood-empty-gentle { color: #C8702A; }
body.forest-theme .mood-view-toggle { background: rgba(38,22,16,.7); border-color: rgba(120,62,35,.35); }
body.forest-theme .mood-view-btn { color: #D4B89A; }
body.forest-theme .mood-view-btn.active { background: linear-gradient(135deg,#C8702A,#E8A040); color: white; box-shadow: 0 2px 10px rgba(200,112,42,.35); }
body.forest-theme .mood-chart-label { color: #C8702A; }
body.forest-theme .mood-chart-cell.no-mood { background: rgba(120,62,35,.12); border-color: rgba(120,62,35,.25); }
body.forest-theme .mood-chart-cell.today-cell { box-shadow: 0 0 0 2px #E8A040; }
body.forest-theme .mood-month-header { color: #D48830; }
body.forest-theme .mood-month-cell.no-mood { background: rgba(120,62,35,.12); border-color: rgba(120,62,35,.25); }
body.forest-theme .mood-month-cell.today-cell { box-shadow: 0 0 0 2px #E8A040; }
body.forest-theme .mood-month-day { color: #8A6848; }
body.forest-theme .mood-year-month-label { color: #D4B89A; }
body.forest-theme .mood-year-cell.no-mood { background: rgba(120,62,35,.18); }
body.forest-theme .mood-year-cell.happy{background:#C8702A} body.forest-theme .mood-year-cell.love{background:#E8A040}
body.forest-theme .mood-year-cell.sad{background:#6A3820} body.forest-theme .mood-year-cell.excited{background:#D48830}
body.forest-theme .mood-year-cell.thinking{background:#8A5030} body.forest-theme .mood-year-cell.angry{background:#A04E18}
body.forest-theme .mood-year-cell.sleepy{background:#5A2E18} body.forest-theme .mood-year-cell.cool{background:#B86020}
body.forest-theme .mood-year-cell.shocked{background:#E8B060} body.forest-theme .mood-year-cell.other{background:#8A6848}
body.forest-theme .mood-legend { border-top-color: rgba(120,62,35,.3); }
body.forest-theme .mood-legend-item { color: #C8702A; }
body.forest-theme .mood-dist-bar-bg { background: rgba(120,62,35,.18); }
body.forest-theme .mood-dist-bar.happy{background:linear-gradient(90deg,#C8702A,#E8A040)} body.forest-theme .mood-dist-bar.love{background:linear-gradient(90deg,#D48830,#E8A040)}
body.forest-theme .mood-dist-bar.sad{background:linear-gradient(90deg,#5A2E18,#6A3820)} body.forest-theme .mood-dist-bar.excited{background:linear-gradient(90deg,#E8A040,#E8B060)}
body.forest-theme .mood-dist-bar.thinking{background:linear-gradient(90deg,#8A5030,#A06840)} body.forest-theme .mood-dist-bar.angry{background:linear-gradient(90deg,#A04E18,#B86020)}
body.forest-theme .mood-dist-bar.sleepy{background:linear-gradient(90deg,#3A2215,#5A2E18)} body.forest-theme .mood-dist-bar.cool{background:linear-gradient(90deg,#B86020,#C8702A)}
body.forest-theme .mood-dist-bar.shocked{background:linear-gradient(90deg,#D48830,#E8B060)} body.forest-theme .mood-dist-bar.other{background:linear-gradient(90deg,#6A3820,#8A5030)}
body.forest-theme .mood-dist-count { color: #C8702A; }
body.forest-theme .summary-stat { background: rgba(46,26,16,.45); }
body.forest-theme .summary-stat-value { color: #E8A040; }
body.forest-theme .mood-suggestion { background: rgba(46,26,16,.5); border-left-color: #C8702A; }
body.forest-theme .suggestion-text { color: #D4B89A; }
body.forest-theme .suggestion-text strong { color: #E8A040; }

/* ============================================================
   BLOSSOM CANOPY — background texture
   ============================================================ */
body.blossom-theme {
  --bg1: #FFF5F7; --bg2: #FFF0F3; --bg3: #FFF5F7;
  --card-bg: rgba(255,230,235,0.94); --card-border: rgba(231,169,182,0.45);
  --border: #E7A9B6; --text1: #3A2A2F; --text2: #7A5A62;
  --btn1: #F29FB2; --btn2: #F7BFD0; --btn3: #F29FB2;
  --vine: #F29FB2;
  --glow: 242,159,178; --glow2: 247,191,208; --accent: #F7BFD0;
}
body.blossom-theme #folio-root::before {
  background:
    radial-gradient(ellipse 80% 40% at 20% 10%, rgba(242,159,178,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 30%, rgba(247,191,208,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 90% 30% at 50% 80%, rgba(231,169,182,0.04) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.018'/%3E%3C/svg%3E");
}
body.blossom-theme #folio-root::after {
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cpath d='M120 30 Q135 60 125 95 Q110 130 128 160' stroke='%23E7A9B6' stroke-width='1.2' fill='none' opacity='.08'/%3E%3Cpath d='M620 50 Q640 90 625 130 Q605 170 630 200' stroke='%23E7A9B6' stroke-width='1' fill='none' opacity='.06'/%3E%3Cellipse cx='140' cy='100' rx='3' ry='4' fill='%23F29FB2' opacity='.07' transform='rotate(-30 140 100)'/%3E%3Cellipse cx='155' cy='85' rx='2.5' ry='3.5' fill='%23F7BFD0' opacity='.06' transform='rotate(20 155 85)'/%3E%3Cellipse cx='480' cy='120' rx='3' ry='4' fill='%23F29FB2' opacity='.06' transform='rotate(-15 480 120)'/%3E%3Cellipse cx='650' cy='280' rx='2.5' ry='3.5' fill='%23F7BFD0' opacity='.05' transform='rotate(35 650 280)'/%3E%3Cellipse cx='300' cy='400' rx='2' ry='3' fill='%23F29FB2' opacity='.05' transform='rotate(-25 300 400)'/%3E%3Cellipse cx='200' cy='500' rx='3' ry='4' fill='%23F7BFD0' opacity='.04' transform='rotate(40 200 500)'/%3E%3Cellipse cx='550' cy='450' rx='2' ry='3' fill='%23F29FB2' opacity='.04' transform='rotate(-10 550 450)'/%3E%3C/svg%3E") no-repeat center/cover;
}

/* Blossom Canopy — vines → petal branches */
body.blossom-theme .vine-left {
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M25,0 Q32,50 22,100 T25,200 T22,300 T25,400 T22,500" fill="none" stroke="%23E7A9B6" stroke-width="1.2" opacity="0.18"/><ellipse cx="28" cy="80" rx="3.5" ry="5" fill="%23F29FB2" opacity="0.12" transform="rotate(-25 28 80)"/><ellipse cx="18" cy="130" rx="2.5" ry="4" fill="%23F7BFD0" opacity="0.1" transform="rotate(15 18 130)"/><ellipse cx="30" cy="220" rx="3" ry="4.5" fill="%23F29FB2" opacity="0.1" transform="rotate(-20 30 220)"/><ellipse cx="16" cy="310" rx="2.5" ry="4" fill="%23F7BFD0" opacity="0.09" transform="rotate(25 16 310)"/><ellipse cx="26" cy="410" rx="2" ry="3" fill="%23F29FB2" opacity="0.08" transform="rotate(-15 26 410)"/></svg>') repeat-y;
}
body.blossom-theme .vine-right {
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M75,0 Q68,50 78,100 T75,200 T78,300 T75,400 T78,500" fill="none" stroke="%23E7A9B6" stroke-width="1.2" opacity="0.18"/><ellipse cx="72" cy="110" rx="3.5" ry="5" fill="%23F29FB2" opacity="0.12" transform="rotate(25 72 110)"/><ellipse cx="82" cy="190" rx="2.5" ry="4" fill="%23F7BFD0" opacity="0.1" transform="rotate(-15 82 190)"/><ellipse cx="70" cy="280" rx="3" ry="4.5" fill="%23F29FB2" opacity="0.1" transform="rotate(20 70 280)"/><ellipse cx="84" cy="370" rx="2.5" ry="4" fill="%23F7BFD0" opacity="0.09" transform="rotate(-25 84 370)"/></svg>') repeat-y;
}

/* Blossom Canopy — sun/glow → soft pink orb */
body.blossom-theme .sun {
  width: 70px; height: 70px;
  background: radial-gradient(circle, rgba(247,191,208,0.35) 0%, rgba(242,159,178,0.1) 100%);
  box-shadow: 0 0 40px rgba(242,159,178,0.2), 0 0 80px rgba(247,191,208,0.1);
}

/* Blossom Canopy — trees → floating petals */
body.blossom-theme .forest-trees { display: block; }
body.blossom-theme .tree { filter: drop-shadow(1px 1px 3px rgba(242,159,178,0.15)); opacity: 0.45; }

/* Blossom Canopy — element color overrides */
body.blossom-theme .sparkle { color: #F29FB2; }
body.blossom-theme .heart-divider { color: #F29FB2; }
body.blossom-theme .form-input,
body.blossom-theme .form-textarea,
body.blossom-theme .emoji-picker-container { background: #FFD6DF; }
body.blossom-theme .form-input::placeholder,
body.blossom-theme .form-textarea::placeholder { color: #C48A95; }
body.blossom-theme .form-input:focus,
body.blossom-theme .form-textarea:focus { box-shadow: 0 0 0 3px rgba(242,159,178,.45); }
body.blossom-theme .search-input { background: rgba(255,230,235,.94); }
body.blossom-theme .search-input:focus { box-shadow: 0 0 0 3px rgba(242,159,178,.45); }
body.blossom-theme .emoji-dropdown { background: #FFE6EB; }
body.blossom-theme .emoji-opt:hover { background: linear-gradient(135deg,rgba(242,159,178,.2),rgba(247,191,208,.15)); }

body.blossom-theme .settings-dropdown { background: #FFE6EB; }
body.blossom-theme .settings-section { background: #FFD6DF; }
body.blossom-theme .settings-label { background: #FFE6EB; }
body.blossom-theme .settings-label:hover { background: #FFD6DF; }
body.blossom-theme .settings-opt { background: #FFD6DF; }
body.blossom-theme .settings-opt:hover { background: rgba(242,159,178,.2); }
body.blossom-theme .settings-opt.active { background: linear-gradient(135deg,rgba(242,159,178,.25),rgba(247,191,208,.18)); border-color: #F29FB2; }

body.blossom-theme .book-container { background: linear-gradient(135deg,#FFD6DF,#FFE6EB); border-color: #E7A9B6; border-left-color: #DDA0AD; box-shadow: 0 8px 25px rgba(58,42,47,.08),inset -3px 0 8px rgba(255,230,235,.4),inset 3px 0 5px rgba(231,169,182,.2); }
body.blossom-theme .book-container:hover { box-shadow: 0 12px 35px rgba(58,42,47,.12),inset -3px 0 8px rgba(255,230,235,.4); }
body.blossom-theme .book-cover { background: linear-gradient(135deg,#FFE6EB,#FFD6DF 50%,#FFE6EB); }
body.blossom-theme .book-cover::before,
body.blossom-theme .book-cover::after { color: #F29FB2; text-shadow: 0 0 15px rgba(242,159,178,.35); }
body.blossom-theme .book-spine { background: linear-gradient(180deg,#F8C8D2,#E7A9B6 20%,#F8C8D2 40%,#E7A9B6 60%,#F8C8D2 80%,#E7A9B6); }
body.blossom-theme .book-date-badge { background: linear-gradient(135deg,#F29FB2,#F7BFD0); color: #3A2A2F; border-color: #F7BFD0; box-shadow: 0 4px 15px rgba(242,159,178,.3),inset 0 0 25px rgba(247,191,208,.25); }
body.blossom-theme .book-pages { background: #FFE6EB; }
body.blossom-theme .saved-entry { background: #FFD6DF; border-left-color: #F29FB2; }
body.blossom-theme .entry-text { background: rgba(242,159,178,.1); color: #3A2A2F; }
body.blossom-theme .entry-title { color: #3A2A2F; }
body.blossom-theme .entry-cover-title { color: #3A2A2F; }
body.blossom-theme .locked-content { background: rgba(242,159,178,.1); color: #5A3A42; }
body.blossom-theme .bookmark-star { color: #7A5A62; }
body.blossom-theme .saved-entry.bookmarked .bookmark-star { color: #F29FB2; filter: drop-shadow(0 0 3px rgba(242,159,178,.4)); }
body.blossom-theme .delete-btn { background: linear-gradient(135deg,#E7A9B6,#DDA0AD); color: #3A2A2F; }
body.blossom-theme .delete-btn:hover { background: linear-gradient(135deg,#F29FB2,#E7A9B6); }
body.blossom-theme .page-divider { background: linear-gradient(to right,transparent,#E7A9B6 20%,#E7A9B6 80%,transparent); }
body.blossom-theme .page-divider::before { background: #FFD6DF; content: '🌸'; }
body.blossom-theme .entry-cover-datetime { color: #7A5A62; }
body.blossom-theme .locked-label { color: #7A5A62; }
body.blossom-theme .entry-time { color: #7A5A62; }
body.blossom-theme .entry-mood { color: #3A2A2F; }

body.blossom-theme .modal-box { background: #FFE6EB; }
body.blossom-theme .modal-input { background: #FFD6DF; border-color: #E7A9B6; color: #3A2A2F; }
body.blossom-theme .modal-input:focus { border-color: #F29FB2; }
body.blossom-theme .modal-btn-cancel { background: #FFD6DF; color: #7A5A62; }
body.blossom-theme .modal-btn-cancel:hover { background: #F8C8D2; }
body.blossom-theme .modal-btn-confirm { background: linear-gradient(135deg,#F29FB2,#F7BFD0); color: #3A2A2F; }
body.blossom-theme .modal-btn-confirm:hover { background: linear-gradient(135deg,#F7BFD0,#F29FB2); }

/* Blossom Canopy — mood page overrides */
body.blossom-theme .mood-card { background: rgba(248,218,225,.92); box-shadow: 0 4px 20px rgba(58,42,47,.1); border-color: rgba(200,138,149,.5); }
body.blossom-theme .mood-card-gradient-1 { background: linear-gradient(135deg,rgba(245,205,213,.88),rgba(240,195,205,.95)); }
body.blossom-theme .mood-card-gradient-2 { background: linear-gradient(135deg,rgba(245,205,213,.82),rgba(240,195,205,.9)); }
body.blossom-theme .mood-card-gradient-3 { background: linear-gradient(135deg,rgba(245,205,213,.78),rgba(240,195,205,.88)); }
body.blossom-theme .mood-card-title { color: #B8607A; }
body.blossom-theme .mood-week-month { color: #9A4A62; }
body.blossom-theme .mood-week-day { background: rgba(220,160,173,.25); }
body.blossom-theme .mood-week-day.today { background: rgba(200,120,140,.2); box-shadow: 0 0 0 2px #D4748E; }
body.blossom-theme .mood-week-day-name { color: #7A4A5A; }
body.blossom-theme .mood-week-day-emoji.empty { color: #8A5A68; opacity:.6; }
body.blossom-theme .mood-week-day-count { color: #8A5A68; }
body.blossom-theme .mood-top-emoji { background: rgba(220,160,173,.25); color: #5A3A42; }
body.blossom-theme .mood-top-emoji-count { color: #B8607A; }
body.blossom-theme .mood-summary-text { background: rgba(220,160,173,.25); border-left-color: #D4748E; color: #3A2A2F; }
body.blossom-theme .mood-cat-pill { background: rgba(220,160,173,.3); color: #3A2A2F; border-color: rgba(200,138,149,.4); }
body.blossom-theme .mood-cat-pill-count { color: #B8607A; }
body.blossom-theme .summary-stat { background: rgba(220,160,173,.3); }
body.blossom-theme .summary-stat-text { color: #5A3A42; }
body.blossom-theme .summary-stat-value { color: #B8607A; }
body.blossom-theme .mood-suggestion { background: rgba(220,160,173,.3); border-left-color: #D4748E; }
body.blossom-theme .suggestion-text { color: #5A3A42; }
body.blossom-theme .suggestion-text strong { color: #B8607A; }
body.blossom-theme .today-mood-entry { background: rgba(220,160,173,.35); border-left-color: #D4748E; }
body.blossom-theme .today-mood-title { color: #B8607A; }
body.blossom-theme .today-mood-time,
body.blossom-theme .today-mood-snippet { color: #5A3A42; }
body.blossom-theme .mood-empty-gentle { color: #B8607A; }
body.blossom-theme .mood-view-toggle { background: rgba(240,195,205,.6); border-color: rgba(200,138,149,.4); }
body.blossom-theme .mood-view-btn { color: #5A3A42; }
body.blossom-theme .mood-view-btn.active { background: linear-gradient(135deg,#D4748E,#E8A0B4); color: white; box-shadow: 0 2px 10px rgba(212,116,142,.3); }
body.blossom-theme .mood-chart-label { color: #B8607A; }
body.blossom-theme .mood-chart-cell.no-mood { background: rgba(200,138,149,.15); border-color: rgba(200,138,149,.3); }
body.blossom-theme .mood-chart-cell.today-cell { box-shadow: 0 0 0 2px #D4748E; }
body.blossom-theme .mood-month-header { color: #9A4A62; }
body.blossom-theme .mood-month-cell.no-mood { background: rgba(200,138,149,.15); border-color: rgba(200,138,149,.3); }
body.blossom-theme .mood-month-cell.today-cell { box-shadow: 0 0 0 2px #D4748E; }
body.blossom-theme .mood-month-day { color: #8A5A68; }
body.blossom-theme .mood-year-month-label { color: #7A5A62; }
body.blossom-theme .mood-year-cell.no-mood { background: rgba(231,169,182,.15); }
body.blossom-theme .mood-year-cell.happy{background:#F29FB2} body.blossom-theme .mood-year-cell.love{background:#F7BFD0}
body.blossom-theme .mood-year-cell.sad{background:#DDA0AD} body.blossom-theme .mood-year-cell.excited{background:#E7A9B6}
body.blossom-theme .mood-year-cell.thinking{background:#C48A95} body.blossom-theme .mood-year-cell.angry{background:#D4929F}
body.blossom-theme .mood-year-cell.sleepy{background:#B87D88} body.blossom-theme .mood-year-cell.cool{background:#E8B4BF}
body.blossom-theme .mood-year-cell.shocked{background:#F5C8D3} body.blossom-theme .mood-year-cell.other{background:#C9959F}
body.blossom-theme .mood-legend { border-top-color: rgba(200,138,149,.3); }
body.blossom-theme .mood-legend-item { color: #9A4A62; }
body.blossom-theme .mood-dist-bar-bg { background: rgba(200,138,149,.18); }
body.blossom-theme .mood-dist-bar.happy{background:linear-gradient(90deg,#D4748E,#E8A0B4)} body.blossom-theme .mood-dist-bar.love{background:linear-gradient(90deg,#E8A0B4,#F0C0D0)}
body.blossom-theme .mood-dist-bar.sad{background:linear-gradient(90deg,#A06878,#C48A95)} body.blossom-theme .mood-dist-bar.excited{background:linear-gradient(90deg,#C8889A,#D4748E)}
body.blossom-theme .mood-dist-bar.thinking{background:linear-gradient(90deg,#A06878,#B87D88)} body.blossom-theme .mood-dist-bar.angry{background:linear-gradient(90deg,#B87D88,#C8889A)}
body.blossom-theme .mood-dist-bar.sleepy{background:linear-gradient(90deg,#8A5A68,#A06878)} body.blossom-theme .mood-dist-bar.cool{background:linear-gradient(90deg,#C48A95,#D4A0AD)}
body.blossom-theme .mood-dist-bar.shocked{background:linear-gradient(90deg,#D4A0AD,#E0B8C4)} body.blossom-theme .mood-dist-bar.other{background:linear-gradient(90deg,#A06878,#B87D88)}
body.blossom-theme .mood-dist-count { color: #B8607A; }

/* Blossom Canopy — header gradient */
body.blossom-theme .header { background: linear-gradient(135deg,rgba(248,218,225,.9),rgba(240,195,205,.7)); }
body.blossom-theme .header h1 { color: #5A3040; animation: blossomGlow 2s ease-in-out infinite alternate; }
body.blossom-theme .header p { color: #7A5A62; }
@keyframes blossomGlow {
  0% { text-shadow: 0 0 10px rgba(242,159,178,.2),0 0 20px rgba(242,159,178,.1),2px 2px 4px rgba(58,42,47,.15); transform:scale(1); }
  100% { text-shadow: 0 0 20px rgba(247,191,208,.3),0 0 30px rgba(247,191,208,.2),2px 2px 4px rgba(58,42,47,.15); transform:scale(1.02); }
}

/* Blossom Canopy — scrollbar */
body.blossom-theme ::-webkit-scrollbar-track { background: rgba(255,230,235,.5); }
body.blossom-theme ::-webkit-scrollbar-thumb { background: linear-gradient(135deg,#F29FB2,#F7BFD0); }

body.dark-mode { --text1: #E9F2EC; --text2: #A8BFB0; --card-bg: rgba(14,26,18,0.92); --card-border: rgba(46,70,55,0.55); }
body.forest-theme.dark-mode { --text1: #F5E8DA; --text2: #D4B89A; --card-bg: rgba(28,16,10,0.95); --card-border: rgba(100,52,28,0.5); }
body.blossom-theme.dark-mode { --bg1: #2A1E22; --bg2: #30222A; --bg3: #2A1E22; --text1: #F5E6EB; --text2: #C9A0AD; --card-bg: rgba(50,35,42,0.94); --card-border: rgba(180,125,136,0.4); --border: #8A5A68; }

#folio-root {
  font-family: 'Lora', 'Georgia', serif;
  background: linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 50%, var(--bg3) 100%);
  min-height: 100vh; padding: 20px; overflow-x: hidden; position: relative;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  padding-top: max(20px, env(safe-area-inset-top));
}
#folio-root::before {
  content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background:
    radial-gradient(ellipse 80% 40% at 20% 10%, rgba(var(--glow),0.04) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 30%, rgba(var(--glow2),0.03) 0%, transparent 60%),
    radial-gradient(ellipse 90% 30% at 50% 80%, rgba(62,90,73,0.04) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0;
}
#folio-root::after {
  content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cpath d='M100 0 Q120 60 80 120 Q60 160 100 200 L95 205 Q55 165 75 120 Q115 55 95 0Z' fill='%233E5A49' opacity='.03'/%3E%3Cpath d='M650 20 Q680 80 640 140 Q600 200 650 250 L645 255 Q595 205 635 140 Q675 75 645 15Z' fill='%233E5A49' opacity='.025'/%3E%3Cpath d='M350 50 Q390 90 370 150 Q340 200 380 240' stroke='%233E5A49' stroke-width='1.5' fill='none' opacity='.04'/%3E%3Ccircle cx='120' cy='180' r='2' fill='%236FAF8F' opacity='.06'/%3E%3Ccircle cx='500' cy='100' r='1.5' fill='%23A6C48A' opacity='.05'/%3E%3Ccircle cx='700' cy='300' r='2' fill='%236FAF8F' opacity='.04'/%3E%3C/svg%3E") no-repeat center/cover;
  pointer-events: none; z-index: 0;
}

.vine-left {
  position: fixed; top: 0; left: 0; width: 150px; height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M20,0 Q30,50 20,100 T20,200 T20,300 T20,400 T20,500" fill="none" stroke="%233E5A49" stroke-width="1.5" opacity="0.2"/><ellipse cx="24" cy="80" rx="4" ry="6" fill="%236FAF8F" opacity="0.15" transform="rotate(-20 24 80)"/><circle cx="16" cy="160" r="2" fill="%23A6C48A" opacity="0.2"/><ellipse cx="24" cy="240" rx="4" ry="6" fill="%236FAF8F" opacity="0.12" transform="rotate(15 24 240)"/><circle cx="16" cy="320" r="2" fill="%23A6C48A" opacity="0.18"/><circle cx="22" cy="400" r="1.5" fill="%23A6C48A" opacity="0.15"/></svg>') repeat-y;
  pointer-events: none; opacity: 0.6; z-index: 0;
}
.vine-right {
  position: fixed; top: 0; right: 0; width: 150px; height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500"><path d="M80,0 Q70,50 80,100 T80,200 T80,300 T80,400 T80,500" fill="none" stroke="%233E5A49" stroke-width="1.5" opacity="0.2"/><ellipse cx="76" cy="120" rx="4" ry="6" fill="%236FAF8F" opacity="0.15" transform="rotate(20 76 120)"/><circle cx="84" cy="200" r="2" fill="%23A6C48A" opacity="0.2"/><ellipse cx="76" cy="280" rx="4" ry="6" fill="%236FAF8F" opacity="0.12" transform="rotate(-15 76 280)"/><circle cx="84" cy="360" r="2" fill="%23A6C48A" opacity="0.18"/></svg>') repeat-y;
  pointer-events: none; opacity: 0.6; z-index: 0;
}

.sun {
  position: fixed; top: 40px; right: 60px; width: 60px; height: 60px;
  background: radial-gradient(circle, rgba(var(--glow2),0.25) 0%, rgba(var(--glow),0.08) 100%); border-radius: 50%;
  box-shadow: 0 0 40px rgba(var(--glow2),0.15), 0 0 80px rgba(var(--glow),0.08);
  z-index: 1; animation: sunPulse 6s ease-in-out infinite; pointer-events: none;
}
@keyframes sunPulse { 0%,100% { transform:scale(1); opacity:.6; } 50% { transform:scale(1.15); opacity:.9; } }

.forest-trees { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
body.forest-theme .forest-trees { display: block; }
.tree { position: absolute; font-size: 4em; opacity: 0.5; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2)); }
body.forest-theme .tree { filter: drop-shadow(2px 2px 6px rgba(196,106,45,0.15)); }
.tree-1{left:2%;bottom:0;font-size:6.5em;opacity:.6}
.tree-2{left:18%;bottom:-10px;font-size:6.2em;opacity:.6}
.tree-3{left:35%;bottom:0;font-size:6.7em;opacity:.6}
.tree-4{left:52%;bottom:-8px;font-size:6.3em;opacity:.6}
.tree-5{left:68%;bottom:0;font-size:6.6em;opacity:.6}
.tree-6{left:85%;bottom:-6px;font-size:6.4em;opacity:.6}
.tree-8{left:10%;bottom:120px;font-size:5.2em;opacity:.5}
.tree-9{left:28%;bottom:140px;font-size:5em;opacity:.5}
.tree-10{left:45%;bottom:130px;font-size:5.4em;opacity:.5}

.container { max-width: 900px; margin: 0 auto; position: relative; z-index: 2; }

.header {
  text-align: center; margin-bottom: 40px; padding: 30px 20px;
  background: var(--card-bg); border-radius: 25px; backdrop-filter: blur(10px);
  position: relative; animation: fadeInDown 0.8s ease-out;
}
@keyframes fadeInDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes glow {
  0% { text-shadow: 0 0 10px rgba(var(--glow),.25),0 0 20px rgba(var(--glow),.15),2px 2px 4px rgba(233,242,236,.6); transform:scale(1); }
  100% { text-shadow: 0 0 20px rgba(var(--glow2),.4),0 0 30px rgba(var(--glow2),.25),2px 2px 4px rgba(233,242,236,.6); transform:scale(1.02); }
}
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

.header h1 {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 3.5em; color: var(--text1); font-style: italic; font-weight: 300;
  animation: glow 2s ease-in-out infinite alternate;
}
.header p { color: var(--text2); font-size: 1.1em; font-style: italic; }

.deco-flowers { position: absolute; top: 50%; transform: translateY(-50%); font-size: 3em; animation: float 3s ease-in-out infinite; }
.flowers-left { left: 5%; }
.flowers-right { right: 5%; animation-delay: 1.5s; }

.settings-icon { position: absolute; top: 20px; right: 20px; font-size: 2em; cursor: pointer; transition: transform 0.3s; z-index: 10; animation: float 3s ease-in-out infinite; }
.settings-icon:hover { transform: rotate(90deg) scale(1.1); }

.settings-dropdown {
  position: fixed; background: #16261C; border: 3px solid var(--border); border-radius: 20px;
  padding: 20px; z-index: 99999; box-shadow: 0 10px 40px rgba(0,0,0,.2); min-width: 280px;
  max-height: 80vh; overflow-y: auto; display: none;
}
.settings-dropdown.open { display: block; animation: fadeInDown 0.3s ease-out; }
body.dark-mode .settings-dropdown { background: #0E1A12; border-color: #2E5A42; }
body.forest-theme .settings-dropdown, body.forest-theme.dark-mode .settings-dropdown { background: #241610; border-color: #5A2E18; }
body.blossom-theme .settings-dropdown, body.blossom-theme.dark-mode .settings-dropdown { background: #FFE6EB; border-color: #E7A9B6; }
body.blossom-theme.dark-mode .settings-dropdown { background: #3A2A30; border-color: #8A5A68; }
body.blossom-theme.dark-mode .settings-section { background: #4A353C; }
body.blossom-theme.dark-mode .settings-label { background: #3A2A30; }
body.blossom-theme.dark-mode .settings-opt { background: #4A353C; }

.settings-section { margin-bottom: 15px; border-radius: 15px; overflow: hidden; background: #1F3327; }
.settings-label {
  font-size: 1.1em; color: var(--text1); padding: 15px 20px; font-weight: 500;
  display: flex; align-items: center; justify-content: space-between; cursor: pointer;
  transition: background 0.3s; background: #16261C;
}
.settings-label::after { content: '▼'; font-size: .8em; transition: transform .3s; }
.settings-section.collapsed .settings-label::after { transform: rotate(-90deg); }
.settings-label:hover { background: #1F3327; }
.settings-content { max-height: 500px; overflow: hidden; transition: max-height .3s, padding .3s; padding: 15px; }
.settings-section.collapsed .settings-content { max-height: 0; padding: 0 15px; }

.settings-opt {
  padding: 15px 20px; border-radius: 15px; cursor: pointer; display: flex; align-items: center;
  gap: 12px; font-size: 1.1em; border: 2px solid transparent; background: #1F3327;
  transition: all .2s; margin-bottom: 8px; color: var(--text1);
}
.settings-opt:hover { background: rgba(var(--glow),.15); transform: translateX(5px); border-color: var(--border); }
.settings-opt.active { background: linear-gradient(135deg,rgba(var(--glow),.2),rgba(var(--glow2),.12)); border-color: var(--btn2); }

.heart-divider { text-align: center; color: #6FAF8F; font-size: 2em; margin: 30px 0; animation: float 2s ease-in-out infinite; }

/* Support Button */
.support-btn {
  display: inline-block; margin-top: 10px; padding: 6px 18px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(242,159,178,.2), rgba(255,182,193,.15));
  border: 1.5px solid rgba(242,159,178,.35); color: var(--text2); font-size: .82em;
  font-family: 'Lora', serif; cursor: pointer; transition: all .25s;
}
.support-btn:hover { background: linear-gradient(135deg, rgba(242,159,178,.3), rgba(255,182,193,.25)); transform: translateY(-1px); color: var(--text1); }
body.forest-theme .support-btn { background: linear-gradient(135deg, rgba(232,160,64,.15), rgba(200,112,42,.1)); border-color: rgba(232,160,64,.3); }
body.blossom-theme .support-btn { background: linear-gradient(135deg, rgba(242,159,178,.15), rgba(247,191,208,.1)); border-color: rgba(242,159,178,.3); }

/* Ad Banner Placeholder */

.search-container { position: relative; margin-bottom: 20px; animation: fadeIn .8s ease-out .4s both; }
.search-input {
  width: 100%; padding: 18px 50px 18px 25px; border: 2px solid var(--border); border-radius: 25px;
  font-size: 1.05em; color: var(--text1); background: var(--card-bg); font-family: 'Lora', serif;
  transition: all .3s; backdrop-filter: blur(10px);
}
.search-input:focus { outline: none; border-color: var(--btn2); box-shadow: 0 0 0 3px rgba(var(--glow2),.45); transform: translateY(-2px); }
.clear-search {
  position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
  background: none; border: none; font-size: 1.5em; color: var(--text2); cursor: pointer; padding: 5px 10px; transition: all .3s;
}
.clear-search:hover { color: var(--text1); transform: translateY(-50%) scale(1.2); }

.page-nav { display: flex; justify-content: center; gap: 10px; margin-bottom: 40px; flex-wrap: wrap; animation: fadeIn .8s ease-out .5s both; }
.nav-page {
  padding: 10px 20px; border: 2px solid var(--border); border-radius: 15px; background: var(--card-bg);
  color: var(--text1); font-family: 'Lora', serif; font-size: 1em; cursor: pointer; transition: all .3s; backdrop-filter: blur(10px);
}
.nav-page:hover { transform: translateY(-2px); border-color: var(--btn2); box-shadow: 0 4px 12px rgba(var(--glow2),.25); }
.nav-page.active { background: linear-gradient(135deg,var(--btn1),var(--btn2),var(--btn3)); color: white; border-color: var(--btn2); box-shadow: 0 4px 15px rgba(var(--glow2),.3); }

.entry-card { background: var(--card-bg); border-radius: 30px; padding: 45px; backdrop-filter: blur(15px); box-shadow: 0 10px 40px rgba(14,26,18,.4); border: 2px solid var(--card-border); position: relative; transition: all .5s; }
.entry-header { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; color: var(--text1); font-size: 1.4em; font-weight: 500; }
.sparkle { color: #6FAF8F; font-size: 1.2em; animation: sparkle 1.5s ease-in-out infinite; }
@keyframes sparkle { 0%,100%{opacity:1;transform:scale(1) rotate(0deg)} 50%{opacity:.5;transform:scale(1.2) rotate(180deg)} }

.form-input {
  width: 100%; padding: 18px 25px; border: 2px solid var(--border); border-radius: 20px;
  font-size: 1.1em; color: var(--text1); background: #1F3327; margin-bottom: 25px;
  font-family: 'Lora', serif; transition: all .3s;
}
.form-input:focus { outline: none; border-color: var(--btn2); box-shadow: 0 0 0 3px rgba(var(--glow2),.45); transform: translateY(-2px); }
.form-input::placeholder { color: #5A8A6A; }

.form-textarea {
  width: 100%; min-height: 180px; padding: 25px; border: 2px solid var(--border); border-radius: 20px;
  font-size: 1.1em; color: var(--text1); background: #1F3327; resize: vertical;
  font-family: 'Lora', serif; line-height: 1.8; transition: all .3s;
}
.form-textarea:focus { outline: none; border-color: var(--btn2); box-shadow: 0 0 0 3px rgba(var(--glow2),.45); transform: translateY(-2px); }
.form-textarea::placeholder { color: #5A8A6A; font-style: italic; }

.emoji-picker-container { display: inline-flex; align-items: center; gap: 12px; padding: 14px 25px; border: 2px solid var(--border); border-radius: 20px; background: #1F3327; cursor: pointer; font-size: 1.1em; color: var(--text1); font-family: 'Lora', serif; position: relative; transition: all .3s; margin-bottom: 25px; }
.emoji-picker-container:hover { border-color: var(--btn2); transform: translateY(-2px); }
.emoji-display { font-size: 1.5em; min-width: 35px; text-align: center; }
.emoji-dropdown {
  position: absolute; top: 110%; left: 0; background: #16261C; border: 3px solid var(--border);
  border-radius: 20px; padding: 20px; z-index: 9999; box-shadow: 0 10px 40px rgba(0,0,0,.2);
  max-width: 350px; max-height: 450px; overflow-y: auto; display: none;
}
.emoji-dropdown.open { display: block; }
.emoji-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.emoji-opt { font-size: 1.8em; padding: 10px; cursor: pointer; border-radius: 10px; transition: all .3s; text-align: center; }
.emoji-opt:hover { background: linear-gradient(135deg,rgba(var(--glow),.2),rgba(var(--glow2),.12)); transform: scale(1.15); }

.save-btn {
  display: block; margin: 25px 0 0 auto; padding: 18px 50px;
  background: linear-gradient(135deg,var(--btn1),var(--btn2),var(--btn3)); color: white; border: none;
  border-radius: 30px; font-size: 1.2em; cursor: pointer; font-family: 'Lora', serif;
  box-shadow: 0 6px 20px rgba(var(--glow2),.25); transition: all .3s; overflow: hidden;
}
.save-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 25px rgba(var(--glow2),.35); }
.save-btn:active { transform: translateY(-1px) scale(1.02); }

/* Cause Tags */
.cause-tag-section { margin: 12px 0 0; }
.cause-tag-label { font-size: .95em; color: var(--text2); margin-bottom: 8px; font-family: 'Lora', serif; }
.cause-tag-hint { font-size: .85em; opacity: .65; }
.cause-tag-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.cause-tag {
  padding: 5px 12px; border-radius: 20px; font-size: .82em; cursor: pointer;
  background: var(--card-bg); border: 1.5px solid var(--card-border); color: var(--text2);
  font-family: 'Lora', serif; transition: all .2s; user-select: none;
}
.cause-tag:hover { border-color: var(--btn1); color: var(--text1); }
.cause-tag.active { background: linear-gradient(135deg,var(--btn1),var(--btn2)); color: white; border-color: var(--btn1); box-shadow: 0 2px 8px rgba(var(--glow),.25); }

/* Entry cause tags display */
.entry-cause-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.entry-cause-tag { font-size: .72em; padding: 2px 8px; border-radius: 12px; background: rgba(var(--glow),.12); color: var(--text2); border: 1px solid var(--card-border); }
body.forest-theme .entry-cause-tag { background: rgba(200,112,42,.12); }
body.blossom-theme .entry-cause-tag { background: rgba(242,159,178,.12); }

/* Cause insights on Mood page */
.cause-insight-row { margin-bottom: 12px; padding: 8px 0; }
.cause-insight-row:last-child { margin-bottom: 0; }
.cause-insight-mood { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: .92em; color: var(--text1); }
.cause-insight-emoji { font-size: 1.15em; }
.cause-insight-label { color: var(--text2); }
.cause-insight-label strong { color: var(--text1); }
.cause-insight-tags { display: flex; flex-wrap: wrap; gap: 5px; padding-left: 4px; }
.cause-insight-tag { font-size: .82em; padding: 3px 10px; border-radius: 14px; background: rgba(var(--glow),.1); color: var(--text2); border: 1px solid var(--card-border); }
.cause-insight-count { opacity: .7; font-size: .9em; }
body.forest-theme .cause-insight-tag { background: rgba(200,112,42,.1); }
body.blossom-theme .cause-insight-tag { background: rgba(242,159,178,.1); }

.past-entries-section { margin-top: 10px; animation: fadeIn 1s ease-out .6s both; }

.entries-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.book-container {
  background: linear-gradient(135deg,#1F3327,#16261C); border-radius: 8px 12px 12px 8px;
  box-shadow: 0 8px 25px rgba(14,26,18,.5),inset -3px 0 8px rgba(14,26,18,.4),inset 3px 0 5px rgba(62,90,73,.3);
  border: 2px solid #3E5A49; border-left: 6px solid #2E5A42; transition: all .3s; position: relative; cursor: pointer;
  animation: bookAppear .6s ease-out; overflow: hidden;
}
@keyframes bookAppear { from{transform:perspective(1000px) rotateY(-90deg);opacity:0} to{transform:perspective(1000px) rotateY(0deg);opacity:1} }
.book-container:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 12px 35px rgba(14,26,18,.6),inset -3px 0 8px rgba(14,26,18,.4); }

/* Open book overlay */
.book-overlay { position:fixed; top:0; left:0; width:100%; height:100%; z-index:9990; background:rgba(0,0,0,.55); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); animation:bookOverlayIn .3s ease-out; display:flex; align-items:flex-start; justify-content:center; overflow-y:auto; padding:40px 16px; }
@keyframes bookOverlayIn { from{opacity:0} to{opacity:1} }
.book-open-panel { width:100%; max-width:600px; background:var(--card-bg); border:2px solid var(--card-border); border-radius:20px; animation:bookZoomIn .4s cubic-bezier(.34,1.56,.64,1); overflow:hidden; position:relative; }
@keyframes bookZoomIn { from{transform:scale(.7);opacity:0} to{transform:scale(1);opacity:1} }
.book-open-header { display:flex; align-items:center; gap:14px; padding:20px 24px; border-bottom:1px solid var(--card-border); }
.book-open-badge { display:flex; flex-direction:column; align-items:center; background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:var(--bg1); padding:10px 16px; border-radius:12px; font-family:'Lora',serif; border:2px solid var(--accent); box-shadow:0 3px 12px rgba(var(--glow),.3); min-width:65px; }
.book-open-badge-month { font-size:.7em; font-weight:bold; text-transform:uppercase; letter-spacing:1px; }
.book-open-badge-day { font-size:1.8em; font-weight:bold; line-height:1; }
.book-open-badge-year { font-size:.65em; font-weight:500; }
.book-open-title { font-family:'Playfair Display',serif; font-size:1.4em; color:var(--text1); font-style:italic; }
.book-open-close { position:absolute; top:14px; right:14px; width:36px; height:36px; border-radius:50%; background:rgba(var(--glow),.1); border:1.5px solid var(--card-border); color:var(--text2); font-size:1.1em; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.book-open-close:hover { background:rgba(var(--glow),.2); color:var(--text1); transform:scale(1.1); }
.book-open-entries { padding:8px 0; }

.book-cover {
  padding: 20px; background: linear-gradient(135deg,#16261C,#1F3327 50%,#16261C); height: 280px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 0 10px 10px 0;
  position: relative; overflow: hidden;
}
.book-cover::before { content:'✧'; position:absolute; top:10px; left:50%; transform:translateX(-50%); font-size:1.6em; color:var(--accent); text-shadow:0 0 15px rgba(var(--glow2),.5); animation:glowPulse 2s ease-in-out infinite; }
.book-cover::after { content:'✧'; position:absolute; bottom:10px; left:50%; transform:translateX(-50%); font-size:1.6em; color:var(--accent); animation:glowPulse 2s ease-in-out infinite 1s; }
@keyframes glowPulse { 0%,100%{opacity:.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.1)} }

.book-spine { position:absolute; left:0; top:0; width:6px; height:100%; background:linear-gradient(180deg,#0E1A12,#0A140E 20%,#0E1A12 40%,#0A140E 60%,#0E1A12 80%,#0A140E); box-shadow:inset -2px 0 5px rgba(0,0,0,.6),inset 1px 0 2px rgba(62,90,73,.3); z-index:5; }

.book-date-badge { display:flex; flex-direction:column; align-items:center; background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:var(--bg1); padding:15px 20px; border-radius:12px; text-align:center; box-shadow:0 4px 15px rgba(var(--glow),.5),inset 0 0 25px rgba(var(--glow2),.4); font-family:'Lora',serif; border:2px solid var(--accent); }
.book-date-month { font-size:.85em; font-weight:bold; text-transform:uppercase; letter-spacing:1.5px; }
.book-date-day { font-size:2.5em; font-weight:bold; line-height:1; margin:6px 0; text-shadow:0 2px 4px rgba(14,26,18,.5); }
.book-date-year { font-size:.8em; font-weight:500; }

.saved-entry { background:#1F3327; border-radius:12px; margin:12px; border-left:3px solid #6FAF8F; position:relative; animation:entrySlideIn .4s ease-out; cursor:pointer; transition:all .3s; overflow:hidden; word-wrap:break-word; }
@keyframes entrySlideIn { from{opacity:0;transform:translateX(-15px)} to{opacity:1;transform:translateX(0)} }
.saved-entry:not(.open):hover { transform:translateY(-3px); box-shadow:0 5px 15px rgba(0,0,0,.15); }
.saved-entry.open { cursor:default; }

.entry-icons-col { position:absolute; top:8px; right:8px; display:flex; flex-direction:column; align-items:center; gap:4px; z-index:10; }
.bookmark-star { font-size:1.7em; cursor:pointer; transition:all .3s; line-height:1; }
.bookmark-star:hover { transform:scale(1.3) rotate(15deg); }
.saved-entry.bookmarked .bookmark-star { color:var(--accent); filter:drop-shadow(0 0 3px rgba(var(--glow2),.5)); }
.entry-emoji-icon { font-size:1.3em; line-height:1; }
.lock-icon { font-size:1.2em; cursor:pointer; transition:all .3s; line-height:1; }
.lock-icon:hover { transform:scale(1.2); }

.entry-page-cover { padding:20px; padding-right:50px; display:flex; flex-direction:column; gap:8px; }
.saved-entry.open .entry-page-cover { display:none; }
.entry-cover-title { font-size:1.2em; color:var(--text1); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.entry-cover-datetime { font-size:.85em; color:#B7CBBF; font-style:italic; }
.locked-label { color:#B7CBBF; font-size:.85em; font-style:italic; margin-top:5px; }

.entry-content-wrapper { padding:20px; padding-right:50px; display:none; }
.saved-entry.open .entry-content-wrapper { display:block; }

.entry-title-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.entry-title { font-size:1.2em; color:var(--text1); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
.entry-mood { font-size:1.4em; display:flex; gap:6px; }
.entry-time { color:#B7CBBF; font-size:.85em; margin-bottom:10px; font-style:italic; }
.entry-text { color:#E9F2EC; line-height:1.7; margin-top:10px; padding:12px; background:rgba(var(--glow),.1); border-radius:10px; font-size:.95em; word-wrap:break-word; }
.locked-content { padding:30px; text-align:center; color:#B7CBBF; font-style:italic; background:rgba(var(--glow),.1); border-radius:10px; margin:10px 0; }

.delete-btn { background:linear-gradient(135deg,#4A7A5E,#3E5A49); color:white; border:none; padding:7px 18px; border-radius:12px; cursor:pointer; font-family:'Lora',serif; margin-top:10px; transition:all .3s; font-size:.85em; }
.delete-btn:hover { background:linear-gradient(135deg,#4A8A66,#3A6A4E); transform:translateY(-2px); }

.page-divider { height:1px; background:linear-gradient(to right,transparent,#3E5A49 20%,#3E5A49 80%,transparent); margin:30px 20px; position:relative; opacity:.6; }
.page-divider::before { content:'🍃'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); background:#1F3327; padding:5px 15px; font-size:1.5em; }

.empty-state { text-align:center; color:var(--text2); font-style:italic; padding:60px; font-size:1.2em; }

/* ---- Modal ---- */
.modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.5); z-index:10000; justify-content:center; align-items:center; }
.modal-overlay.open { display:flex; }
.modal-box { background:#16261C; border-radius:25px; padding:40px; max-width:400px; width:90%; box-shadow:0 10px 50px rgba(0,0,0,.3); border:3px solid var(--border); text-align:center; }
body.dark-mode .modal-box { background:#0E1A12; border-color:#2E5A42; }
body.forest-theme .modal-box, body.forest-theme.dark-mode .modal-box { background:#241610; border-color:#5A2E18; }
body.blossom-theme .modal-box, body.blossom-theme.dark-mode .modal-box { background:#FFE6EB; border-color:#E7A9B6; }
body.blossom-theme.dark-mode .modal-box { background:#3A2A30; border-color:#8A5A68; }
.modal-title { font-family:'Playfair Display',serif; font-size:1.8em; color:var(--text1); margin-bottom:15px; }
.modal-msg { font-size:1.1em; color:var(--text2); margin-bottom:30px; line-height:1.6; }
.modal-btns { display:flex; gap:15px; justify-content:center; }
.modal-input { width:100%; padding:12px; border:2px solid var(--border); border-radius:15px; margin:10px 0; font-size:1em; font-family:'Lora',serif; background:#1F3327; color:var(--text1); }
.modal-input:focus { outline:none; border-color:var(--btn2); }
.modal-btn { padding:12px 30px; border:none; border-radius:20px; font-size:1.1em; cursor:pointer; font-family:'Lora',serif; transition:all .3s; }
.modal-btn-cancel { background:#1F3327; color:#B7CBBF; }
.modal-btn-cancel:hover { background:#274A36; transform:translateY(-2px); }
.modal-btn-confirm { background:linear-gradient(135deg,#4A7A5E,#3E5A49); color:white; }
.modal-btn-confirm:hover { background:linear-gradient(135deg,#4A8A66,#3A6A4E); transform:translateY(-2px); }

/* ---- Mood Page ---- */
.mood-page { animation:fadeIn .6s ease-out; }
.mood-card { background:rgba(22,38,28,.92); border-radius:20px; padding:22px; margin-bottom:18px; backdrop-filter:blur(12px); box-shadow:0 4px 20px rgba(14,26,18,.3); border:2px solid rgba(62,90,73,.4); transition:all .3s; }
.mood-card-gradient-1 { background:linear-gradient(135deg,rgba(31,51,39,.8),rgba(22,38,28,.95)); }
.mood-card-gradient-2 { background:linear-gradient(135deg,rgba(31,51,39,.7),rgba(22,38,28,.95)); }
.mood-card-gradient-3 { background:linear-gradient(135deg,rgba(31,51,39,.6),rgba(22,38,28,.95)); }
body.blossom-theme .mood-card-gradient-1 { background:linear-gradient(135deg,rgba(255,230,235,.85),rgba(255,214,223,.95)); }
body.blossom-theme .mood-card-gradient-2 { background:linear-gradient(135deg,rgba(255,230,235,.8),rgba(255,214,223,.9)); }
body.blossom-theme .mood-card-gradient-3 { background:linear-gradient(135deg,rgba(255,230,235,.75),rgba(255,214,223,.88)); }
.mood-card-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.mood-card-icon { font-size:1.4em; }
.mood-card-title { font-size:1.15em; font-weight:600; color:var(--accent); font-family:'Lora',serif; }
.today-mood-entry { display:flex; align-items:flex-start; gap:14px; padding:12px; background:rgba(31,51,39,.5); border-radius:14px; border-left:4px solid #6FAF8F; }
.today-mood-emoji { font-size:2.2em; flex-shrink:0; }
.today-mood-title { font-weight:600; color:var(--accent); font-size:1.05em; margin-bottom:3px; }
.today-mood-time { font-size:.82em; color:#B7CBBF; font-style:italic; margin-bottom:6px; }
.today-mood-snippet { font-size:.9em; color:#B7CBBF; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mood-empty-gentle { text-align:center; color:#6FAF8F; font-style:italic; padding:18px 10px; font-size:.95em; }

.mood-view-toggle { display:flex; gap:0; margin-bottom:18px; background:rgba(22,38,28,.7); border-radius:14px; padding:4px; border:2px solid rgba(62,90,73,.4); }
.mood-view-btn { flex:1; padding:10px 8px; border:none; border-radius:11px; background:transparent; color:#B7CBBF; font-family:'Lora',serif; font-size:.95em; font-weight:500; cursor:pointer; transition:all .25s; }
.mood-view-btn.active { background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; box-shadow:0 2px 10px rgba(var(--glow),.35); }

.mood-chart-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:.85em; }
.mood-chart-label { width:38px; text-align:right; color:#6FAF8F; font-size:.82em; font-weight:500; }
.mood-chart-cell { flex:1; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4em; }
.mood-chart-cell.no-mood { background:rgba(62,90,73,.15); border:1.5px dashed rgba(62,90,73,.3); }
.mood-chart-cell.today-cell { box-shadow:0 0 0 2px #A6C48A; }

.mood-month-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.mood-month-header { text-align:center; font-size:.72em; color:#8FBF9A; font-weight:600; padding:4px 0 6px; }
.mood-month-cell { aspect-ratio:1; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.1em; position:relative; max-height:46px; }
.mood-month-cell.no-mood { background:rgba(62,90,73,.15); border:1px dashed rgba(62,90,73,.3); }
.mood-month-cell.today-cell { box-shadow:0 0 0 2px #A6C48A; }
.mood-month-day { position:absolute; bottom:1px; right:3px; font-size:.55em; color:#5A8A6A; }

.mood-year-grid { display:flex; flex-direction:column; gap:10px; }
.mood-year-month-label { font-size:.82em; color:#B7CBBF; font-weight:600; margin-bottom:2px; }
.mood-year-row { display:flex; gap:3px; }
.mood-year-cell { width:10px; height:10px; border-radius:2px; flex-shrink:0; }
.mood-year-cell.no-mood { background:rgba(62,90,73,.2); }
.mood-year-cell.happy{background:#6FAF8F}.mood-year-cell.love{background:#A6C48A}.mood-year-cell.sad{background:#3E5A49}
.mood-year-cell.excited{background:#B8D4A0}.mood-year-cell.thinking{background:#5A9A72}.mood-year-cell.angry{background:#4A7A5E}
.mood-year-cell.sleepy{background:#2E5A42}.mood-year-cell.cool{background:#8FBF9A}.mood-year-cell.shocked{background:#A6C48A}
.mood-year-cell.other{background:#4A7A5E}

.mood-legend { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid rgba(62,90,73,.3); }
.mood-legend-item { display:flex; align-items:center; gap:4px; font-size:.75em; color:#6FAF8F; }
.mood-legend-dot { width:10px; height:10px; border-radius:2px; }

.mood-dist-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.mood-dist-emoji { font-size:1.3em; width:30px; text-align:center; }
.mood-dist-bar-bg { flex:1; height:22px; background:rgba(62,90,73,.2); border-radius:11px; overflow:hidden; }
.mood-dist-bar { height:100%; border-radius:11px; transition:width .6s; }
.mood-dist-bar.happy{background:linear-gradient(90deg,#6FAF8F,#A6C48A)}.mood-dist-bar.love{background:linear-gradient(90deg,#8FBF9A,#A6C48A)}
.mood-dist-bar.sad{background:linear-gradient(90deg,#2E5A42,#3E5A49)}.mood-dist-bar.excited{background:linear-gradient(90deg,#A6C48A,#B8D4A0)}
.mood-dist-bar.thinking{background:linear-gradient(90deg,#4A7A5E,#5A9A72)}.mood-dist-bar.angry{background:linear-gradient(90deg,#4A8A66,#5A9A72)}
.mood-dist-bar.sleepy{background:linear-gradient(90deg,#274A36,#2E5A42)}.mood-dist-bar.cool{background:linear-gradient(90deg,#5A9A72,#6FAF8F)}
.mood-dist-bar.shocked{background:linear-gradient(90deg,#8FBF9A,#B8D4A0)}.mood-dist-bar.other{background:linear-gradient(90deg,#3E5A49,#4A7A5E)}
.mood-dist-count { width:28px; text-align:right; font-size:.85em; color:#6FAF8F; font-weight:600; }

.summary-stat { display:flex; align-items:center; gap:5px; padding:8px 10px; background:rgba(31,51,39,.45); border-radius:10px; margin-bottom:8px; min-width:0; }
.summary-stat-icon { font-size:1.1em; flex-shrink:0; }
.summary-stat-text { font-size:.78em; color:var(--text2); white-space:nowrap; }
.summary-stat-value { font-weight:700; color:var(--accent); font-size:.88em; flex-shrink:0; white-space:nowrap; margin-left:auto; }

.mood-suggestion { display:flex; align-items:flex-start; gap:10px; padding:12px; background:rgba(31,51,39,.5); border-radius:12px; border-left:3px solid #6FAF8F; margin-bottom:10px; }
.suggestion-icon { font-size:1.3em; flex-shrink:0; }
.suggestion-text { font-size:.9em; line-height:1.55; color:#B7CBBF; }
.suggestion-text strong { color:var(--accent); }

/* ---- Emoji Slider ---- */
.emoji-slider-label { font-size:1.12em; color:var(--text2); margin-bottom:10px; font-style:italic; font-weight:500; }
.emoji-slider-wrap { margin-bottom:25px; overflow:hidden; border-radius:16px; border:2px solid var(--border); background:rgba(31,51,39,.3); max-width:360px; display:flex; align-items:center; position:relative; }
body.blossom-theme .emoji-slider-wrap { background:rgba(255,214,223,.4); }
.emoji-slider { display:flex; overflow-x:auto; gap:2px; padding:8px 6px; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; scrollbar-width:none; flex:1; min-width:0; }
.emoji-slider::-webkit-scrollbar { display:none; }
.emoji-slider-item { font-size:1.5em; min-width:38px; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:10px; cursor:pointer; transition:all .15s; flex-shrink:0; }
.emoji-slider-item:hover { background:rgba(var(--glow),.15); transform:scale(1.12); }
.emoji-slider-item.selected { background:linear-gradient(135deg,var(--btn1),var(--btn2)); transform:scale(1.18); box-shadow:0 2px 10px rgba(var(--glow),.35); }
body.blossom-theme .emoji-slider-item:hover { background:rgba(242,159,178,.15); }
body.blossom-theme .emoji-slider-item.selected { box-shadow:0 2px 10px rgba(242,159,178,.3); }
.emoji-slider-arrow { flex-shrink:0; width:30px; height:100%; border:none; background:linear-gradient(135deg,var(--card-bg),rgba(31,51,39,.8)); color:var(--text1); font-size:1.3em; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; opacity:.7; padding:0; font-family:sans-serif; }
.emoji-slider-arrow:hover { opacity:1; background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; }
.emoji-slider-arrow-left { border-right:1px solid var(--border); border-radius:14px 0 0 14px; }
.emoji-slider-arrow-right { border-left:1px solid var(--border); border-radius:0 14px 14px 0; }
body.blossom-theme .emoji-slider-arrow { background:rgba(255,214,223,.6); }
body.blossom-theme .emoji-slider-arrow:hover { background:linear-gradient(135deg,#F29FB2,#F7BFD0); }

/* ---- Close Book Button ---- */
.close-book-btn { position:absolute; top:8px; left:14px; font-size:1.1em; cursor:pointer; z-index:11; color:var(--text2); width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all .2s; line-height:1; background:rgba(0,0,0,.15); }
.close-book-btn:hover { background:rgba(0,0,0,.25); color:var(--text1); transform:scale(1.1); }
body.blossom-theme .close-book-btn { background:rgba(242,159,178,.2); }
body.blossom-theme .close-book-btn:hover { background:rgba(242,159,178,.35); }

/* ---- Wellness Page ---- */
.wellness-page { animation:fadeIn .6s ease-out; }
.wellness-sub-tabs { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:4px; }
.wellness-sub-tabs::-webkit-scrollbar { display:none; }
.wellness-sub-tab { padding:10px 18px; border-radius:14px; border:1.5px solid var(--card-border); background:var(--card-bg); color:var(--text2); font-family:'Lora',serif; font-size:.9em; cursor:pointer; transition:all .3s; white-space:nowrap; flex-shrink:0; }
.wellness-sub-tab.active { background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; border-color:var(--btn2); box-shadow:0 3px 12px rgba(var(--glow),.3); }

.spirit-container { display:flex; flex-direction:column; align-items:center; padding:20px 0; }
.spirit-wrap { position:relative; width:120px; height:140px; margin-bottom:16px; }
.spirit-body { position:absolute; bottom:0; left:50%; transform:translateX(-50%); animation:spiritFloat 3s ease-in-out infinite; }
@keyframes spiritFloat { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-12px)} }
.spirit-svg { filter:drop-shadow(0 8px 20px rgba(var(--glow),.3)); }

.spirit-thinking .spirit-body { animation:spiritThink 1.2s ease-in-out infinite; }
@keyframes spiritThink { 0%,100%{transform:translateX(-50%) translateY(0) rotate(0deg)} 25%{transform:translateX(-50%) translateY(-6px) rotate(-3deg)} 75%{transform:translateX(-50%) translateY(-6px) rotate(3deg)} }

.spirit-bubble { background:var(--card-bg); border:1.5px solid var(--card-border); border-radius:18px; padding:16px 20px; max-width:340px; width:100%; text-align:center; color:var(--text1); font-family:'Lora',serif; font-size:.95em; line-height:1.6; position:relative; box-shadow:0 4px 16px rgba(0,0,0,.1); animation:bubbleIn .4s ease-out; }
.spirit-bubble::before { content:''; position:absolute; top:-8px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-bottom:8px solid var(--card-border); }
.spirit-bubble::after { content:''; position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-bottom:7px solid var(--card-bg); }
@keyframes bubbleIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

.spirit-question-num { font-size:.75em; color:var(--text2); margin-bottom:6px; font-style:italic; }

.spirit-input-area { width:100%; max-width:400px; margin-top:16px; }
.spirit-textarea { width:100%; min-height:80px; padding:14px 16px; border-radius:14px; border:1.5px solid var(--card-border); background:var(--card-bg); color:var(--text1); font-family:'Lora',serif; font-size:.95em; resize:vertical; outline:none; transition:border-color .3s; box-sizing:border-box; }
.spirit-textarea:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(var(--glow),.15); }
.spirit-textarea::placeholder { color:var(--text2); opacity:.6; }

.spirit-btns { display:flex; gap:8px; margin-top:12px; justify-content:center; flex-wrap:wrap; }
.spirit-btn { padding:10px 20px; border-radius:12px; border:1.5px solid var(--card-border); background:var(--card-bg); color:var(--text1); font-family:'Lora',serif; font-size:.88em; cursor:pointer; transition:all .3s; }
.spirit-btn:hover { transform:translateY(-2px); box-shadow:0 3px 10px rgba(0,0,0,.1); }
.spirit-btn-primary { background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; border-color:var(--btn2); }
.spirit-btn-primary:hover { box-shadow:0 4px 14px rgba(var(--glow),.3); }
.spirit-btn-skip { opacity:.7; }
.spirit-btn-stop { border-color:rgba(180,80,80,.3); color:var(--text2); }

.spirit-progress { width:100%; max-width:400px; height:4px; background:rgba(var(--glow),.15); border-radius:4px; margin-top:12px; overflow:hidden; }
.spirit-progress-bar { height:100%; background:linear-gradient(90deg,var(--btn1),var(--btn2)); border-radius:4px; transition:width .4s ease; }

.spirit-summary { width:100%; max-width:440px; }
.spirit-summary-card { background:var(--card-bg); border:1.5px solid var(--card-border); border-radius:18px; padding:20px; margin-top:16px; color:var(--text1); font-family:'Lora',serif; font-size:.92em; line-height:1.7; box-shadow:0 4px 16px rgba(0,0,0,.1); animation:bubbleIn .5s ease-out; }
.spirit-summary-title { font-size:1.1em; font-weight:bold; color:var(--accent); margin-bottom:10px; text-align:center; }
.spirit-restart { margin-top:16px; text-align:center; }

.spirit-dots { display:flex; gap:6px; justify-content:center; margin-top:12px; }
.spirit-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); animation:spiritDotBounce 1.4s ease-in-out infinite; }
.spirit-dot:nth-child(2) { animation-delay:.2s; }
.spirit-dot:nth-child(3) { animation-delay:.4s; }
@keyframes spiritDotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }

/* ---- Small Search (between entry card and past entries) ---- */
.search-container-small { margin-top:30px; margin-bottom:20px; }
.search-container-small .search-input { padding:12px 38px 12px 16px; font-size:.9em; border-radius:16px; }

/* ---- Mood Week Strip ---- */
.mood-week-strip { display:flex; gap:6px; margin-bottom:16px; }
.mood-week-day { flex:1; text-align:center; padding:8px 4px; border-radius:12px; background:rgba(255,255,255,.05); transition:all .2s; }
.mood-week-day.today { background:rgba(var(--glow),.15); box-shadow:0 0 0 2px var(--btn1); }
.mood-week-day.future { opacity:.4; }
body.blossom-theme .mood-week-day { background:rgba(255,214,223,.3); }
body.blossom-theme .mood-week-day.today { background:rgba(242,159,178,.15); box-shadow:0 0 0 2px #F29FB2; }
.mood-week-day-name { font-size:.7em; color:var(--text2); font-weight:600; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.mood-week-day-emoji { font-size:1.5em; height:36px; display:flex; align-items:center; justify-content:center; }
.mood-week-day-emoji.empty { font-size:1em; color:var(--text2); opacity:.3; }
.mood-week-day-count { font-size:.65em; color:var(--text2); margin-top:2px; }
.mood-top-emoji { display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(255,255,255,.05); border-radius:12px; font-size:.9em; color:var(--text2); }
body.blossom-theme .mood-top-emoji { background:rgba(255,214,223,.3); }
.mood-top-emoji-big { font-size:1.6em; }
.mood-top-emoji-count { font-weight:700; color:var(--btn1); }
.mood-summary-text { font-size:.95em; color:var(--text1); line-height:1.7; margin-bottom:16px; padding:14px; background:rgba(255,255,255,.04); border-radius:12px; border-left:3px solid var(--btn1); }
body.blossom-theme .mood-summary-text { background:rgba(255,214,223,.3); }
.mood-cat-pills { display:flex; flex-wrap:wrap; gap:8px; }
.mood-cat-pill { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; background:rgba(255,255,255,.06); font-size:.85em; color:var(--text1); border:1px solid var(--card-border); }
body.blossom-theme .mood-cat-pill { background:rgba(255,214,223,.4); }
.mood-cat-pill-count { font-weight:700; color:var(--btn1); font-size:.85em; }
.mood-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }

/* ---- Notes Page ---- */
.notes-page { animation:fadeIn .6s ease-out; }
.notebook-container { position:relative; perspective:1200px; min-height:520px; }
.notebook-page-wrapper { position:relative; transform-style:preserve-3d; transition:transform .6s cubic-bezier(.4,.2,.2,1); transform-origin:left center; }
.notebook-page-wrapper.flip-forward { animation:flipForward .6s cubic-bezier(.4,.2,.2,1) forwards; }
.notebook-page-wrapper.flip-backward { animation:flipBackward .6s cubic-bezier(.4,.2,.2,1) forwards; }
@keyframes flipForward { 0%{transform:rotateY(0)} 100%{transform:rotateY(-12deg); opacity:.92;} }
@keyframes flipBackward { 0%{transform:rotateY(0)} 100%{transform:rotateY(12deg); opacity:.92;} }
.notebook-page { background:#FFFDF7; border-radius:4px 16px 16px 4px; border:2px solid var(--card-border); border-left:6px solid var(--btn1); box-shadow:4px 4px 20px rgba(0,0,0,.12),inset 0 0 30px rgba(0,0,0,.02); padding:0; position:relative; overflow:hidden; min-height:480px; }
body.blossom-theme .notebook-page { background:#FFF8F9; }
body.forest-theme .notebook-page { background:#FFF8F0; }
body.dark-mode .notebook-page, body.forest-theme.dark-mode .notebook-page, body.blossom-theme.dark-mode .notebook-page { background:#1E1E1E; }
.notebook-header { padding:16px 20px 10px 24px; border-bottom:2px solid rgba(var(--glow),.15); display:flex; justify-content:space-between; align-items:center; }
.notebook-date { font-family:'Playfair Display',serif; font-size:1.1em; color:var(--btn1); font-weight:500; }
.notebook-page-num { font-size:.82em; color:var(--text2); font-style:italic; }
.notebook-body { padding:0 20px 20px 24px; position:relative; }
.notebook-lines { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; background:repeating-linear-gradient(transparent,transparent 31px,rgba(var(--glow),.1) 31px,rgba(var(--glow),.1) 32px); background-position:0 0; }
body.dark-mode .notebook-lines { background:repeating-linear-gradient(transparent,transparent 31px,rgba(255,255,255,.06) 31px,rgba(255,255,255,.06) 32px); }
.notebook-margin { position:absolute; left:50px; top:0; bottom:0; width:1.5px; background:rgba(220,80,80,.18); pointer-events:none; }
body.dark-mode .notebook-margin { background:rgba(220,80,80,.1); }
.notebook-textarea { width:100%; min-height:380px; border:none; outline:none; background:transparent; font-family:'Lora',serif; font-size:1em; line-height:32px; color:#2A2A2A; resize:none; padding:8px 12px 8px 36px; position:relative; z-index:1; }
body.dark-mode .notebook-textarea { color:#E0E0E0; }
.notebook-textarea::placeholder { color:rgba(0,0,0,.2); font-style:italic; }
body.dark-mode .notebook-textarea::placeholder { color:rgba(255,255,255,.15); }
.notebook-nav { display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding:0 4px; }
.notebook-nav-btn { padding:10px 20px; border:2px solid var(--card-border); border-radius:14px; background:var(--card-bg); color:var(--text1); font-family:'Lora',serif; font-size:.9em; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
.notebook-nav-btn:hover { border-color:var(--btn2); transform:translateY(-2px); }
.notebook-nav-btn:disabled { opacity:.3; cursor:default; transform:none; }
.notebook-nav-btn.save { background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; border-color:var(--btn2); }
.notebook-nav-center { display:flex; gap:8px; align-items:center; }
.notebook-add-btn { width:36px; height:36px; border-radius:50%; border:2px solid var(--btn1); background:var(--card-bg); color:var(--btn1); font-size:1.3em; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.notebook-add-btn:hover { background:linear-gradient(135deg,var(--btn1),var(--btn2)); color:white; transform:scale(1.1); }
.notebook-delete-btn { width:36px; height:36px; border-radius:50%; border:2px solid rgba(180,80,80,.3); background:var(--card-bg); color:var(--text2); font-size:1em; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.notebook-delete-btn:hover { border-color:rgba(180,80,80,.6); color:#e57373; }
.notebook-empty { text-align:center; padding:60px 20px; color:var(--text2); font-style:italic; font-size:1.1em; }
.notebook-swipe-hint { text-align:center; font-size:.78em; color:var(--text2); margin-top:8px; font-style:italic; opacity:.6; }


/* ---- Search No Result ---- */
.search-no-result { text-align:center; padding:12px; color:var(--text2); font-style:italic; font-size:.9em; margin-top:8px; }

/* ---- Mood Week Month Label ---- */
.mood-week-month { text-align:center; font-size:1em; color:var(--btn1); font-weight:600; margin-bottom:12px; letter-spacing:.5px; font-family:'Playfair Display',serif; }

/* ---- Landscape / Portrait adaptive ---- */
#folio-root.landscape .container { max-width:1100px; }
#folio-root.landscape .entry-card { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
#folio-root.landscape .entry-header { grid-column:1/-1; }
#folio-root.landscape .emoji-slider-label { grid-column:1/-1; }
#folio-root.landscape .emoji-slider-wrap { grid-column:1/-1; }
#folio-root.landscape .save-btn { grid-column:1/-1; }
#folio-root.landscape .entries-list { grid-template-columns:repeat(4,1fr); }
#folio-root.landscape .page-nav { gap:14px; }
#folio-root.landscape .mood-stats-grid { grid-template-columns:repeat(4,1fr); }
#folio-root.landscape .notebook-textarea { min-height:420px; }
#folio-root.portrait .entries-list { grid-template-columns:repeat(3,1fr); }
#folio-root.portrait .mood-stats-grid { grid-template-columns:1fr 1fr; }

@media(prefers-reduced-motion:reduce){
  *{animation:none!important;transition-duration:0.01ms!important;}
}
@media(max-width:480px){
}

::-webkit-scrollbar { width:10px; }
::-webkit-scrollbar-track { background:rgba(22,38,28,.5); border-radius:10px; }
::-webkit-scrollbar-thumb { background:linear-gradient(135deg,var(--btn1),var(--btn3)); border-radius:10px; }

@media(max-width:768px){
  .header h1{font-size:2.5em}
  .entry-card{padding:30px}
  .deco-flowers{font-size:2em}
  .vine-left,.vine-right{width:80px}
  .settings-dropdown{left:10px!important;right:10px!important;width:auto;min-width:0;max-width:calc(100vw - 20px);}
}

@media(max-width:480px){
  #folio-root{padding:12px 8px;}
  .container{max-width:100%;}
  .header{padding:20px 14px;margin-bottom:24px;border-radius:18px;}
  .header h1{font-size:2em}
  .header p{font-size:.95em}
  .deco-flowers{font-size:1.4em}
  .flowers-left{left:3%;}
  .flowers-right{right:3%;}
  .vine-left,.vine-right{width:40px;opacity:.3;}
  .sun{width:40px;height:40px;top:20px;right:20px;}
  .heart-divider{font-size:1.5em;margin:20px 0;}
  .search-container{margin-bottom:24px;}
  .search-input{padding:14px 40px 14px 16px;font-size:.95em;border-radius:18px;}
  .page-nav{gap:6px;margin-bottom:24px;}
  .nav-page{padding:8px 14px;font-size:.88em;border-radius:12px;}
  .entry-card{padding:18px 14px;border-radius:20px;}
  .entry-header{font-size:1.15em;margin-bottom:18px;}
  .form-input{padding:14px 16px;font-size:1em;border-radius:16px;margin-bottom:18px;}
  .form-textarea{padding:16px;min-height:140px;font-size:1em;border-radius:16px;}
  .emoji-picker-container{padding:10px 16px;border-radius:16px;font-size:1em;margin-bottom:18px;}
  .emoji-dropdown{max-width:calc(100vw - 40px);left:-10px;padding:14px;}
  .emoji-grid{grid-template-columns:repeat(5,1fr);gap:6px;}
  .emoji-opt{font-size:1.5em;padding:8px;}
  .save-btn{padding:14px 36px;font-size:1.05em;border-radius:24px;width:100%;}
  .past-entries-section{margin-top:8px;}
  .entries-list{grid-template-columns:repeat(3,1fr);gap:8px;}
  .book-cover{height:160px;padding:12px;}
  .book-cover::before{font-size:1.2em;top:6px;}
  .book-cover::after{font-size:1.2em;bottom:6px;}
  .book-date-badge{padding:10px 12px;}
  .book-date-day{font-size:1.8em}
  .book-date-month{font-size:.75em;letter-spacing:1px;}
  .book-date-year{font-size:.7em;}
  .saved-entry{margin:8px;}
  .entry-page-cover{padding:14px;padding-right:45px;}
  .entry-content-wrapper{padding:14px;padding-right:45px;}
  .entry-text{padding:10px;font-size:.9em;}
  .entry-icons-col{top:6px;right:6px;gap:3px;}
  .bookmark-star{font-size:1.5em;}
  .entry-emoji-icon{font-size:1.1em;}
  .lock-icon{font-size:1em;}
  .settings-icon{font-size:1.6em;top:14px;right:14px;}
  .settings-dropdown{position:fixed!important;left:8px!important;right:8px!important;top:auto!important;bottom:0!important;max-height:70vh;width:auto!important;min-width:0;border-radius:20px 20px 0 0;padding:16px;}
  .settings-opt{padding:12px 16px;font-size:1em;}
  .modal-box{padding:28px 20px;width:94%;border-radius:20px;}
  .modal-title{font-size:1.5em}
  .modal-msg{font-size:1em}
  .modal-btn{padding:10px 22px;font-size:1em;}
  .modal-input{padding:10px;font-size:.95em;}
  .mood-card{padding:16px;border-radius:16px;margin-bottom:14px;}
  .mood-card-title{font-size:1.05em}
  .mood-stats-grid{grid-template-columns:1fr 1fr;gap:6px;}
  .summary-stat{padding:6px 8px;gap:4px;}
  .summary-stat-icon{font-size:1em;}
  .summary-stat-text{font-size:.75em;}
  .summary-stat-value{font-size:.82em;}
  .mood-view-btn{padding:8px 6px;font-size:.88em;}
  .mood-month-cell{font-size:.95em;}
  .mood-month-day{font-size:.5em}
  .page-divider::before{font-size:1.2em;padding:4px 10px;}
  .forest-trees .tree{font-size:3em!important;opacity:.3!important;}
  .tree-1,.tree-2,.tree-3,.tree-4,.tree-5,.tree-6{font-size:4em!important;opacity:.35!important;}
  .tree-8,.tree-9,.tree-10{display:none!important;}
}

@media(max-width:360px){
  #folio-root{padding:8px 6px;}
  .header h1{font-size:1.7em}
  .header{padding:16px 10px;}
  .vine-left,.vine-right{display:none;}
  .entry-card{padding:14px 12px;}
  .form-input{padding:12px 14px;}
  .form-textarea{padding:14px;min-height:120px;}
  .book-cover{height:130px;padding:8px;}
  .book-date-month{font-size:.65em;}
  .book-date-day{font-size:1.6em;}
  .book-date-year{font-size:.65em;}
  .emoji-grid{grid-template-columns:repeat(4,1fr);}
  .nav-page{padding:6px 8px;font-size:.78em;}
}
`;

// ============================================================
// COMPONENTS
// ============================================================

function Modal({ open, title, message, onConfirm, onCancel, children }) {
  if (!open) return null;
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target.classList.contains('modal-overlay')) onCancel?.(); }}>
      <div className="modal-box">
        <div className="modal-title">{title}</div>
        {message && <div className="modal-msg">{message}</div>}
        {children}
        <div className="modal-btns">
          {onCancel && <button className="modal-btn modal-btn-cancel" onClick={onCancel}>Cancel</button>}
          {onConfirm && <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>Confirm</button>}
        </div>
      </div>
    </div>
  );
}

// ---- Settings Dropdown ----
function SettingsDropdown({ open, pos, theme, mode, onTheme, onMode, onLock, lockStatus, onFeedback, onPrivacy, onExport, onImport, orientation, onOrientation }) {
  const [sections, setSections] = useState({ display: false, theme: false, security: false, feedback: false, privacy: false, backup: false });
  const toggle = k => setSections(s => ({ ...s, [k]: !s[k] }));
  // Collapse all when settings opens
  useEffect(() => { if (open) setSections({ display: false, theme: false, security: false, feedback: false, privacy: false, backup: false }); }, [open]);

  if (!open) return null;
  return (
    <div className="settings-dropdown open" style={{ top: pos.top, right: pos.right }}>
      {[
        {
          key: 'display', label: 'Display Mode',
          content: (
            <div>
              {[['light','☀️','Light Mode'],['dark','🌙','Dark Mode']].map(([val,ic,label]) => (
                <div key={val} className={`settings-opt ${mode===val?'active':''}`} onClick={() => onMode(val)}>
                  <span>{ic}</span><span>{label}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--card-border)', margin: '6px 0', opacity: .4 }} />
              {[['auto','🔄','Auto Rotate'],['portrait','📱','Portrait'],['landscape','🖥️','Landscape']].map(([val,ic,label]) => (
                <div key={val} className={`settings-opt ${orientation===val?'active':''}`} onClick={() => onOrientation(val)}>
                  <span>{ic}</span><span>{label}</span>
                </div>
              ))}
            </div>
          )
        },
        {
          key: 'theme', label: 'Theme',
          content: (
            <div>
              {[['default','🌲','Forest Haven'],['forest','🔥','Ember Grove'],['blossom','🌸','Blossom Canopy']].map(([val,ic,label]) => (
                <div key={val} className={`settings-opt ${theme===val?'active':''}`} onClick={() => onTheme(val)}>
                  <span>{ic}</span><span>{label}</span>
                </div>
              ))}
            </div>
          )
        },
        {
          key: 'security', label: 'Security',
          content: (
            <div>
              <div className="settings-opt" onClick={onLock}>
                <span>🔒</span><span>{lockStatus}</span>
              </div>
            </div>
          )
        },
        {
          key: 'feedback', label: 'Feedback',
          content: (
            <div>
              <div className="settings-opt" onClick={onFeedback}>
                <span>💬</span><span>Send Feedback</span>
              </div>
            </div>
          )
        },
        {
          key: 'backup', label: 'Backup & Restore',
          content: (
            <div>
              <div className="settings-opt" onClick={onExport}>
                <span>📦</span><span>Export Backup</span>
              </div>
              <div className="settings-opt" onClick={onImport}>
                <span>📥</span><span>Import Backup</span>
              </div>
            </div>
          )
        },
        {
          key: 'privacy', label: 'Privacy Policy',
          content: (
            <div>
              <div className="settings-opt" onClick={onPrivacy}>
                <span>📄</span><span>View Privacy Policy</span>
              </div>
            </div>
          )
        },
      ].map(({ key, label, content }) => (
        <div key={key} className={`settings-section ${sections[key] ? '' : 'collapsed'}`}>
          <div className="settings-label" onClick={() => toggle(key)}>{label}</div>
          <div className="settings-content">{content}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Emoji Slider ----
function EmojiSlider({ selected, onSelect }) {
  const scrollRef = useRef();
  const scrollBy = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 140, behavior: 'smooth' });
    }
  };
  useEffect(() => {
    if (selected && scrollRef.current) {
      const idx = EMOJIS.indexOf(selected);
      if (idx >= 0) {
        const child = scrollRef.current.children[idx];
        if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selected]);
  return (
    <div className="emoji-slider-wrap">
      <button className="emoji-slider-arrow emoji-slider-arrow-left" onClick={() => scrollBy(-1)} aria-label="Scroll left">‹</button>
      <div className="emoji-slider" ref={scrollRef}>
        {EMOJIS.map((em, i) => (
          <div key={i} className={`emoji-slider-item ${selected === em ? 'selected' : ''}`} onClick={() => onSelect(selected === em ? null : em)}>{em}</div>
        ))}
      </div>
      <button className="emoji-slider-arrow emoji-slider-arrow-right" onClick={() => scrollBy(1)} aria-label="Scroll right">›</button>
    </div>
  );
}

// ---- Book / Entry ----
function BookEntry({ entry, entryIndex, onDelete, onBookmark, onLock }) {
  const [open, setOpen] = useState(false);
  const date = safeDateParse(entry);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div
      className={`saved-entry ${entry.bookmarked ? 'bookmarked' : ''} ${entry.locked ? 'locked' : ''} ${open ? 'open' : ''}`}
      onClick={e => {
        if (e.target.closest('.delete-btn') || e.target.closest('.bookmark-star') || e.target.closest('.lock-icon') || e.target.closest('.entry-icons-col')) return;
        e.stopPropagation();
        setOpen(o => !o);
      }}
    >
      <div className="entry-icons-col">
        <span className="bookmark-star" onClick={e => { e.stopPropagation(); onBookmark(entryIndex); }}>
          {entry.bookmarked ? '⭐' : '☆'}
        </span>
        {entry.emoji && <span className="entry-emoji-icon">{entry.emoji}</span>}
        <span className="lock-icon" onClick={e => { e.stopPropagation(); e.preventDefault(); onLock(e, entryIndex); }}>
          {entry.locked ? '🔒' : '🔓'}
        </span>
      </div>
      <div className="entry-page-cover">
        <div className="entry-cover-title">{entry.title || 'Untitled Entry'}</div>
        <div className="entry-cover-datetime">{timeStr}</div>
        {entry.locked && <div className="locked-label">🔒 Locked Entry</div>}
      </div>
      <div className="entry-content-wrapper">
        {entry.locked ? (
          <div className="locked-content">This entry is locked. Click the 🔒 icon to unlock.</div>
        ) : (
          <>
            <div className="entry-title-row">
              <div className="entry-title">{entry.title || 'Untitled Entry'}</div>
            </div>
            <div className="entry-time">{timeStr}</div>
            <div className="entry-text">{entry.content}</div>
            {entry.causeTags && entry.causeTags.length > 0 && (
              <div className="entry-cause-tags">
                {entry.causeTags.map(key => {
                  const tag = CAUSE_TAGS.find(t => t.key === key);
                  return tag ? <span key={key} className="entry-cause-tag">{tag.label}</span> : null;
                })}
              </div>
            )}
            <button className="delete-btn" onClick={e => { e.stopPropagation(); onDelete(entryIndex); }}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

function Book({ dateKey, dayData, openBooks, onToggleBook, onCloseBook, onDelete, onBookmark, onLock, searchTerm }) {
  const isOpen = openBooks.has(dateKey);
  const { date, entries } = dayData;
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const year = date.getFullYear();
  const fullDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const reversed = [...entries].reverse();

  const visibleEntries = searchTerm
    ? reversed.filter(e => {
        const s = searchTerm.toLowerCase();
        return (e.title || '').toLowerCase().includes(s) || (e.content || '').toLowerCase().includes(s) || String(e.dateISO).toLowerCase().includes(s);
      })
    : reversed;

  if (searchTerm && visibleEntries.length === 0) return null;

  return (
    <>
      {/* Grid book cover (always shown) */}
      <div className="book-container" onClick={e => {
        if (e.target.closest('.delete-btn') || e.target.closest('.bookmark-star') || e.target.closest('.lock-icon')) return;
        onToggleBook(e, dateKey);
      }}>
        <div className="book-spine" />
        <div className="book-cover">
          <div className="book-date-badge">
            <div className="book-date-month">{month}</div>
            <div className="book-date-day">{day}</div>
            <div className="book-date-year">{year}</div>
          </div>
        </div>
      </div>

      {/* Full-screen overlay when open */}
      {isOpen && (
        <div className="book-overlay" onClick={e => { if (e.target.classList.contains('book-overlay')) onCloseBook(dateKey); }}>
          <div className="book-open-panel">
            <div className="book-open-header">
              <div className="book-open-badge">
                <div className="book-open-badge-month">{month}</div>
                <div className="book-open-badge-day">{day}</div>
                <div className="book-open-badge-year">{year}</div>
              </div>
              <div className="book-open-title">{fullDate}</div>
            </div>
            <button className="book-open-close" onClick={() => onCloseBook(dateKey)}>✕</button>
            <div className="book-open-entries">
              {visibleEntries.map((entry, i) => (
                <div key={entry.originalIndex}>
                  <BookEntry entry={entry} entryIndex={entry.originalIndex} onDelete={onDelete} onBookmark={onBookmark} onLock={onLock} />
                  {i < visibleEntries.length - 1 && <div className="page-divider" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---- Mood Page (Weekly Summary) ----
function MoodPage({ entries }) {
  const today = new Date();
  const weekStart = getStartOfWeek(today);
  const weekEntries = getEntriesForRange(entries, weekStart, getEndOfDay(today));
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Build per-day data
  const dayData = dayNames.map((name, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    const de = getEntriesForRange(entries, d, getEndOfDay(d));
    const isToday = d.toDateString() === today.toDateString();
    const isFuture = d > today;
    return { name, entries: de, isToday, isFuture, date: d };
  });

  // Top mood this week
  const moodCounts = {};
  weekEntries.forEach(e => {
    if (e.emoji) moodCounts[e.emoji] = (moodCounts[e.emoji] || 0) + 1;
  });
  const topEmoji = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0];

  // Category breakdown
  const catCounts = {};
  weekEntries.forEach(e => {
    const cat = getEmojiCategory(e.emoji);
    if (cat) catCounts[cat.key] = (catCounts[cat.key] || 0) + 1;
  });
  const sortedCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
  const totalMoods = sortedCats.reduce((s,[,c]) => s+c, 0);

  // Dominant mood category
  const domKey = sortedCats[0]?.[0];
  const domCat = domKey ? MOOD_CATEGORIES[domKey] : null;

  // Streak
  const journaledDays = new Set(weekEntries.map(e => safeDateParse(e).toDateString()));
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (journaledDays.has(d.toDateString())) streak++; else break;
  }

  // --- Cause analysis per mood category ---
  const causeByCat = {};
  weekEntries.forEach(e => {
    const cat = getEmojiCategory(e.emoji);
    if (cat && e.causeTags && e.causeTags.length > 0) {
      if (!causeByCat[cat.key]) causeByCat[cat.key] = {};
      e.causeTags.forEach(tag => {
        causeByCat[cat.key][tag] = (causeByCat[cat.key][tag] || 0) + 1;
      });
    }
  });

  // Build sorted cause insights for display
  const causeInsights = sortedCats.filter(([key]) => causeByCat[key] && Object.keys(causeByCat[key]).length > 0).map(([key]) => {
    const cat = MOOD_CATEGORIES[key] || { label: key, emojis: ['📝'] };
    const causes = Object.entries(causeByCat[key]).sort((a,b) => b[1]-a[1]);
    return { catKey: key, catLabel: cat.label, catEmoji: cat.emojis[0], causes };
  });

  // --- Previous week summary (auto-generated) ---
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setMilliseconds(-1);
  const prevWeekEntries = getEntriesForRange(entries, prevWeekStart, prevWeekEnd);

  function getPrevWeekSummary() {
    if (prevWeekEntries.length === 0) return null;
    const pwCatCounts = {};
    prevWeekEntries.forEach(e => {
      const cat = getEmojiCategory(e.emoji);
      if (cat) pwCatCounts[cat.key] = (pwCatCounts[cat.key] || 0) + 1;
    });
    const pwSorted = Object.entries(pwCatCounts).sort((a,b) => b[1]-a[1]);
    const pwTotal = pwSorted.reduce((s,[,c]) => s+c, 0);
    const pwDomKey = pwSorted[0]?.[0];
    const pwDomCat = pwDomKey ? MOOD_CATEGORIES[pwDomKey] : null;

    const pwDays = new Set(prevWeekEntries.map(e => safeDateParse(e).toDateString()));
    const positiveRatio = ((pwCatCounts.happy||0) + (pwCatCounts.love||0) + (pwCatCounts.excited||0)) / pwTotal;
    const negativeRatio = ((pwCatCounts.sad||0) + (pwCatCounts.angry||0)) / pwTotal;

    // Mood shifts — did the dominant mood change day to day?
    const dailyDoms = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(prevWeekStart); d.setDate(d.getDate() + i);
      const de = getEntriesForRange(entries, d, getEndOfDay(d));
      if (de.length > 0) {
        const dc = {};
        de.forEach(e => { const c = getEmojiCategory(e.emoji); if (c) dc[c.key] = (dc[c.key] || 0) + 1; });
        const top = Object.entries(dc).sort((a,b) => b[1]-a[1])[0];
        if (top) dailyDoms.push(top[0]);
      }
    }
    const uniqueMoods = [...new Set(dailyDoms)];
    const moodShifts = uniqueMoods.length;

    // Cause analysis for prev week
    const pwCauseByCat = {};
    prevWeekEntries.forEach(e => {
      const cat = getEmojiCategory(e.emoji);
      if (cat && e.causeTags && e.causeTags.length > 0) {
        if (!pwCauseByCat[cat.key]) pwCauseByCat[cat.key] = {};
        e.causeTags.forEach(tag => {
          pwCauseByCat[cat.key][tag] = (pwCauseByCat[cat.key][tag] || 0) + 1;
        });
      }
    });
    const pwTopCauses = {};
    Object.entries(pwCauseByCat).forEach(([catKey, causes]) => {
      pwTopCauses[catKey] = Object.entries(causes).sort((a,b) => b[1]-a[1]).slice(0,3);
    });

    let insight = '';
    if (positiveRatio > 0.6) {
      insight = `Last week was a bright one — ${pwDomCat?.label || 'positive'} feelings led the way.`;
    } else if (negativeRatio > 0.5) {
      insight = `Last week was tough. You showed strength by journaling through it.`;
    } else if (moodShifts >= 4) {
      insight = `Last week was emotionally varied — your mood shifted across ${moodShifts} different feelings.`;
    } else {
      insight = `Last week was balanced — you felt mostly ${pwDomCat?.label?.toLowerCase() || 'steady'}.`;
    }

    const weekLabel = prevWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + prevWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      weekLabel, entries: prevWeekEntries.length, days: pwDays.size,
      domCat: pwDomCat, sortedCats: pwSorted, insight, moodShifts, topCauses: pwTopCauses,
    };
  }
  const prevSummary = getPrevWeekSummary();

  // Generate summary text
  function getSummary() {
    if (!weekEntries.length) return { text: "You haven't journaled this week yet. Start writing — even a few words help you process how you feel.", tips: ["Try a quick 2-minute check-in right now", "Set a daily reminder to journal before bed", "Start with just an emoji and one sentence"] };
    const positiveRatio = ((catCounts.happy||0) + (catCounts.love||0) + (catCounts.excited||0)) / totalMoods;
    const negativeRatio = ((catCounts.sad||0) + (catCounts.angry||0)) / totalMoods;
    const tiredRatio = (catCounts.sleepy||0) / totalMoods;
    let text = '';
    const tips = [];
    if (positiveRatio > 0.6) {
      text = `You've been feeling really good this week! ${domCat?.label || 'Positive'} vibes have been dominant. Keep doing what you're doing — your energy is showing.`;
      tips.push("Channel this energy into something creative", "Share your good mood with someone who needs it", "Write down what's making you feel this way so you can revisit it");
    } else if (negativeRatio > 0.5) {
      text = `This week has been a bit heavy. You've had some ${(catCounts.sad||0) >= (catCounts.angry||0) ? 'sad' : 'frustrating'} moments. That's okay — acknowledging how you feel is the first step.`;
      tips.push("Be gentle with yourself — rest is productive too", "Try talking to someone you trust about how you're feeling", "Write more detail in your entries — getting it out helps", "Do one small thing that usually makes you smile");
    } else if (tiredRatio > 0.3) {
      text = "You've been feeling drained lately. Your entries show a pattern of tiredness. Your body might be telling you something.";
      tips.push("Try going to bed 30 minutes earlier tonight", "Take a break from screens before sleeping", "A short walk outside can reset your energy");
    } else {
      text = `Your week has been a mix of feelings — ${sortedCats.slice(0,3).map(([k]) => MOOD_CATEGORIES[k]?.label || k).join(', ')}. That's completely normal and healthy.`;
      tips.push("Keep journaling to notice patterns", "Pay attention to what triggers your mood shifts", "Try to do more of what brought you joy this week");
    }
    return { text, tips };
  }
  const summary = getSummary();

  return (
    <div className="mood-page">
      {/* Week at a glance */}
      <div className="mood-card mood-card-gradient-1">
        <div className="mood-card-header"><span className="mood-card-icon">🗓️</span><span className="mood-card-title">This Week's Mood</span></div>
        <div className="mood-week-month">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        <div className="mood-week-strip">
          {dayData.map((dd, i) => {
            const lastEntry = dd.entries.length ? dd.entries[dd.entries.length-1] : null;
            return (
              <div key={i} className={`mood-week-day ${dd.isToday ? 'today' : ''} ${dd.isFuture ? 'future' : ''}`}>
                <div className="mood-week-day-name">{dd.name}</div>
                <div className={`mood-week-day-emoji ${lastEntry ? '' : 'empty'}`}>{lastEntry?.emoji || dd.date.getDate()}</div>
                <div className="mood-week-day-count">{dd.entries.length > 0 ? `${dd.entries.length} entry` : ''}</div>
              </div>
            );
          })}
        </div>
        {topEmoji && (
          <div className="mood-top-emoji">
            <span>Most felt this week:</span>
            <span className="mood-top-emoji-big">{topEmoji[0]}</span>
            <span className="mood-top-emoji-count">×{topEmoji[1]}</span>
          </div>
        )}
      </div>

      {/* Summary card */}
      {weekEntries.length >= 3 ? (
        <div className="mood-card">
          <div className="mood-card-header"><span className="mood-card-icon">💭</span><span className="mood-card-title">How You've Been</span></div>
          <div className="mood-summary-text">{summary.text}</div>
          {sortedCats.length > 0 && (
            <div className="mood-cat-pills">
              {sortedCats.map(([key, count]) => {
                const cat = MOOD_CATEGORIES[key] || { label: key, emojis: ['📝'] };
                return (
                  <div key={key} className="mood-cat-pill">
                    <span>{cat.emojis[0]}</span>
                    <span>{cat.label}</span>
                    <span className="mood-cat-pill-count">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mood-card">
          <div className="mood-card-header"><span className="mood-card-icon">💭</span><span className="mood-card-title">How You've Been</span></div>
          <div className="mood-empty-gentle">{weekEntries.length === 0 ? "No entries this week yet. Start journaling to see your mood summary here 🌱" : `You have ${weekEntries.length} ${weekEntries.length === 1 ? 'entry' : 'entries'} so far. Keep going — your weekly summary will appear after 3 entries 📝`}</div>
        </div>
      )}

      {/* Cause insights card */}
      {causeInsights.length > 0 && (
        <div className="mood-card">
          <div className="mood-card-header"><span className="mood-card-icon">🔍</span><span className="mood-card-title">What's Behind Your Moods</span></div>
          {causeInsights.map(({ catKey, catLabel, catEmoji, causes }) => (
            <div key={catKey} className="cause-insight-row">
              <div className="cause-insight-mood">
                <span className="cause-insight-emoji">{catEmoji}</span>
                <span className="cause-insight-label">When you felt <strong>{catLabel.toLowerCase()}</strong>, common causes were:</span>
              </div>
              <div className="cause-insight-tags">
                {causes.map(([tagKey, count]) => {
                  const tag = CAUSE_TAGS.find(t => t.key === tagKey);
                  return (
                    <span key={tagKey} className="cause-insight-tag">
                      {tag?.emoji || '🏷️'} {tag?.label?.replace(/^[^\s]+ /, '') || tagKey} <span className="cause-insight-count">({count}×)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips card */}
      {weekEntries.length >= 3 ? (
        <div className="mood-card mood-card-gradient-2">
          <div className="mood-card-header"><span className="mood-card-icon">🌱</span><span className="mood-card-title">What You Can Do</span></div>
          {summary.tips.map((tip, i) => (
            <div key={i} className="mood-suggestion">
              <div className="suggestion-icon">{['💡','✨','🌟','🍃'][i] || '💡'}</div>
              <div className="suggestion-text">{tip}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mood-card mood-card-gradient-2">
          <div className="mood-card-header"><span className="mood-card-icon">🌱</span><span className="mood-card-title">What You Can Do</span></div>
          <div className="mood-suggestion">
            <div className="suggestion-icon">✍️</div>
            <div className="suggestion-text">Write a few more entries this week and personalized suggestions will appear here based on your mood patterns.</div>
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="mood-card mood-card-gradient-3">
        <div className="mood-card-header"><span className="mood-card-icon">📊</span><span className="mood-card-title">Week Stats</span></div>
        <div className="mood-stats-grid">
          <div className="summary-stat"><span className="summary-stat-icon">📝</span><span className="summary-stat-text">Entries</span><span className="summary-stat-value">{weekEntries.length}</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">📅</span><span className="summary-stat-text">Days</span><span className="summary-stat-value">{journaledDays.size}/7</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">{domCat?.emojis[0] || '📝'}</span><span className="summary-stat-text">Top</span><span className="summary-stat-value">{domCat?.label || '—'}</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">🔥</span><span className="summary-stat-text">Streak</span><span className="summary-stat-value">{streak}d</span></div>
        </div>
      </div>

      {/* Previous week summary */}
      {prevSummary && (
        <div className="mood-card mood-card-gradient-1">
          <div className="mood-card-header"><span className="mood-card-icon">📋</span><span className="mood-card-title">Your Week — {prevSummary.weekLabel}</span></div>
          <div className="mood-summary-text" style={{ marginBottom: 10 }}>{prevSummary.insight}</div>
          <div className="mood-stats-grid" style={{ marginBottom: 10 }}>
            <div className="summary-stat"><span className="summary-stat-icon">📝</span><span className="summary-stat-text">Entries</span><span className="summary-stat-value">{prevSummary.entries}</span></div>
            <div className="summary-stat"><span className="summary-stat-icon">📅</span><span className="summary-stat-text">Days</span><span className="summary-stat-value">{prevSummary.days}/7</span></div>
            <div className="summary-stat"><span className="summary-stat-icon">{prevSummary.domCat?.emojis[0] || '📝'}</span><span className="summary-stat-text">Top</span><span className="summary-stat-value">{prevSummary.domCat?.label || '—'}</span></div>
            <div className="summary-stat"><span className="summary-stat-icon">🔄</span><span className="summary-stat-text">Shifts</span><span className="summary-stat-value">{prevSummary.moodShifts}</span></div>
          </div>
          {prevSummary.sortedCats.length > 0 && (
            <div className="mood-cat-pills">
              {prevSummary.sortedCats.map(([key, count]) => {
                const cat = MOOD_CATEGORIES[key] || { label: key, emojis: ['📝'] };
                return <div key={key} className="mood-cat-pill"><span>{cat.emojis[0]}</span><span>{cat.label}</span><span className="mood-cat-pill-count">{count}</span></div>;
              })}
            </div>
          )}
          {Object.keys(prevSummary.topCauses).length > 0 && (
            <div style={{ marginTop: 10 }}>
              {Object.entries(prevSummary.topCauses).map(([catKey, causes]) => {
                const cat = MOOD_CATEGORIES[catKey] || { label: catKey, emojis: ['📝'] };
                return (
                  <div key={catKey} className="cause-insight-row" style={{ marginTop: 6 }}>
                    <div className="cause-insight-mood">
                      <span className="cause-insight-emoji">{cat.emojis[0]}</span>
                      <span className="cause-insight-label"><strong>{cat.label}</strong> was caused by:</span>
                    </div>
                    <div className="cause-insight-tags">
                      {causes.map(([tagKey, count]) => {
                        const tag = CAUSE_TAGS.find(t => t.key === tagKey);
                        return <span key={tagKey} className="cause-insight-tag">{tag?.emoji || '🏷️'} {tag?.label?.replace(/^[^\s]+ /, '') || tagKey} <span className="cause-insight-count">({count}×)</span></span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Notes Page ----
const NOTES_STORAGE = 'folioNotes';

function NotesPage() {
  const [notes, setNotes] = useState(() => getStorage(NOTES_STORAGE, []));
  const [pageIdx, setPageIdx] = useState(0);
  const [flipAnim, setFlipAnim] = useState('');
  const [editText, setEditText] = useState('');
  const touchStart = useRef(null);

  // Sync editText when page changes
  useEffect(() => {
    if (notes.length > 0 && pageIdx < notes.length) {
      setEditText(notes[pageIdx].text || '');
    } else {
      setEditText('');
    }
  }, [pageIdx, notes.length]);

  const saveNotes = useCallback((updated) => {
    setNotes(updated);
    setStorage(NOTES_STORAGE, updated);
  }, []);

  const saveCurrentPage = useCallback(() => {
    if (notes.length === 0) return;
    const updated = [...notes];
    updated[pageIdx] = { ...updated[pageIdx], text: editText, updatedAt: new Date().toISOString() };
    saveNotes(updated);
  }, [notes, pageIdx, editText, saveNotes]);

  // Auto-save on text change (debounced feel — saves on blur or nav)
  const handleTextChange = (val) => {
    setEditText(val);
  };

  const handleBlur = () => {
    saveCurrentPage();
  };

  const addPage = () => {
    const newNote = {
      id: Date.now(),
      text: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...notes, newNote];
    saveNotes(updated);
    animateFlip('forward', updated.length - 1);
  };

  const deletePage = () => {
    if (notes.length === 0) return;
    const updated = notes.filter((_, i) => i !== pageIdx);
    saveNotes(updated);
    if (pageIdx >= updated.length && updated.length > 0) {
      setPageIdx(updated.length - 1);
    } else if (updated.length === 0) {
      setPageIdx(0);
    }
  };

  const animateFlip = (dir, targetIdx) => {
    saveCurrentPage();
    setFlipAnim(dir === 'forward' ? 'flip-forward' : 'flip-backward');
    setTimeout(() => {
      setPageIdx(targetIdx);
      setFlipAnim('');
    }, 350);
  };

  const goNext = () => {
    if (pageIdx < notes.length - 1) animateFlip('forward', pageIdx + 1);
  };

  const goPrev = () => {
    if (pageIdx > 0) animateFlip('backward', pageIdx - 1);
  };

  // Swipe handling
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goNext();   // swipe left = next page
      else goPrev();           // swipe right = prev page
    }
    touchStart.current = null;
  };

  const currentNote = notes[pageIdx];
  const dateStr = currentNote
    ? new Date(currentNote.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // If no notes, show empty state with add button
  if (notes.length === 0) {
    return (
      <div className="notes-page">
        <div className="notebook-empty">
          <div style={{ fontSize: '2.5em', marginBottom: 16 }}>📝</div>
          <div>Your notebook is empty</div>
          <div style={{ marginTop: 8, fontSize: '.9em' }}>Tap the button below to create your first page</div>
          <button className="notebook-nav-btn save" style={{ marginTop: 20, display: 'inline-flex' }} onClick={addPage}>
            + New Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="notebook-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`notebook-page-wrapper ${flipAnim}`}>
          <div className="notebook-page">
            <div className="notebook-header">
              <div className="notebook-date">{dateStr}</div>
              <div className="notebook-page-num">Page {pageIdx + 1} of {notes.length}</div>
            </div>
            <div className="notebook-body">
              <div className="notebook-lines" />
              <div className="notebook-margin" />
              <textarea
                className="notebook-textarea"
                value={editText}
                onChange={e => handleTextChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Start writing..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="notebook-swipe-hint">← Swipe to turn pages →</div>

      <div className="notebook-nav">
        <button className="notebook-nav-btn" onClick={goPrev} disabled={pageIdx === 0}>
          ← Prev
        </button>
        <div className="notebook-nav-center">
          <button className="notebook-delete-btn" onClick={deletePage} title="Delete this page">🗑️</button>
          <button className="notebook-add-btn" onClick={addPage} title="Add new page">+</button>
        </div>
        <button className="notebook-nav-btn" onClick={goNext} disabled={pageIdx >= notes.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ---- Wellness Page ----
// All questions below are from PUBLIC DOMAIN clinically validated instruments:
// PHQ-9 (Kroenke et al., 2001) — depression screening
// GAD-7 (Spitzer et al., 2006) — anxiety screening
// CESD-R (Eaton et al., 2004) — depression screening, public domain per cesd-r.com
// DASS-21 (Lovibond & Lovibond, 1995) — depression/anxiety/stress, public domain per Psychology Foundation of Australia
// Items are pooled by category. Each session draws a randomized subset.

// ============================================================
// DEPRESSION ITEMS POOL (~25 items from PHQ-9, CESD-R, DASS-21)
// ============================================================
const DEPRESSION_POOL = [
  // PHQ-9 items (source: Patient Health Questionnaire, Kroenke et al. 2001)
  { id: 'phq1', text: "Little interest or pleasure in doing things", source: 'PHQ-9', domain: 'anhedonia', selfHarm: false },
  { id: 'phq2', text: "Feeling down, depressed, or hopeless", source: 'PHQ-9', domain: 'mood', selfHarm: false },
  { id: 'phq3', text: "Trouble falling or staying asleep, or sleeping too much", source: 'PHQ-9', domain: 'sleep', selfHarm: false },
  { id: 'phq4', text: "Feeling tired or having little energy", source: 'PHQ-9', domain: 'fatigue', selfHarm: false },
  { id: 'phq5', text: "Poor appetite or overeating", source: 'PHQ-9', domain: 'appetite', selfHarm: false },
  { id: 'phq6', text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", source: 'PHQ-9', domain: 'worthlessness', selfHarm: false },
  { id: 'phq7', text: "Trouble concentrating on things, such as reading or watching TV", source: 'PHQ-9', domain: 'concentration', selfHarm: false },
  { id: 'phq8', text: "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless", source: 'PHQ-9', domain: 'psychomotor', selfHarm: false },
  { id: 'phq9', text: "Thoughts that you would be better off dead, or of hurting yourself", source: 'PHQ-9', domain: 'selfharm', selfHarm: true },
  // CESD-R items (source: Center for Epidemiologic Studies Depression Scale-Revised, Eaton et al. 2004)
  { id: 'cesd1', text: "My appetite was poor", source: 'CESD-R', domain: 'appetite', selfHarm: false },
  { id: 'cesd2', text: "I could not shake off the blues", source: 'CESD-R', domain: 'mood', selfHarm: false },
  { id: 'cesd3', text: "I had trouble keeping my mind on what I was doing", source: 'CESD-R', domain: 'concentration', selfHarm: false },
  { id: 'cesd4', text: "I felt depressed", source: 'CESD-R', domain: 'mood', selfHarm: false },
  { id: 'cesd5', text: "My sleep was restless", source: 'CESD-R', domain: 'sleep', selfHarm: false },
  { id: 'cesd6', text: "I felt sad", source: 'CESD-R', domain: 'mood', selfHarm: false },
  { id: 'cesd7', text: "I could not get going", source: 'CESD-R', domain: 'fatigue', selfHarm: false },
  { id: 'cesd8', text: "Nothing made me happy", source: 'CESD-R', domain: 'anhedonia', selfHarm: false },
  { id: 'cesd9', text: "I felt like a bad person", source: 'CESD-R', domain: 'worthlessness', selfHarm: false },
  { id: 'cesd10', text: "I lost interest in my usual activities", source: 'CESD-R', domain: 'anhedonia', selfHarm: false },
  { id: 'cesd11', text: "I slept much more than usual", source: 'CESD-R', domain: 'sleep', selfHarm: false },
  { id: 'cesd12', text: "I felt like I was moving too slowly", source: 'CESD-R', domain: 'psychomotor', selfHarm: false },
  { id: 'cesd13', text: "I felt fidgety or restless", source: 'CESD-R', domain: 'psychomotor', selfHarm: false },
  { id: 'cesd14', text: "I wished I were dead", source: 'CESD-R', domain: 'selfharm', selfHarm: true },
  { id: 'cesd15', text: "I wanted to hurt myself", source: 'CESD-R', domain: 'selfharm', selfHarm: true },
  { id: 'cesd16', text: "I was tired all the time", source: 'CESD-R', domain: 'fatigue', selfHarm: false },
  { id: 'cesd17', text: "I did not like myself", source: 'CESD-R', domain: 'worthlessness', selfHarm: false },
  { id: 'cesd18', text: "I lost a lot of weight without trying to", source: 'CESD-R', domain: 'appetite', selfHarm: false },
  { id: 'cesd19', text: "I had a lot of trouble getting to sleep", source: 'CESD-R', domain: 'sleep', selfHarm: false },
  { id: 'cesd20', text: "I could not focus on the important things", source: 'CESD-R', domain: 'concentration', selfHarm: false },
  // DASS-21 Depression items (source: Depression Anxiety Stress Scales, Lovibond & Lovibond 1995)
  { id: 'dassd1', text: "I couldn't seem to experience any positive feeling at all", source: 'DASS-21', domain: 'anhedonia', selfHarm: false },
  { id: 'dassd2', text: "I found it difficult to work up the initiative to do things", source: 'DASS-21', domain: 'fatigue', selfHarm: false },
  { id: 'dassd3', text: "I felt that I had nothing to look forward to", source: 'DASS-21', domain: 'mood', selfHarm: false },
  { id: 'dassd4', text: "I felt down-hearted and blue", source: 'DASS-21', domain: 'mood', selfHarm: false },
  { id: 'dassd5', text: "I was unable to become enthusiastic about anything", source: 'DASS-21', domain: 'anhedonia', selfHarm: false },
  { id: 'dassd6', text: "I felt I wasn't worth much as a person", source: 'DASS-21', domain: 'worthlessness', selfHarm: false },
  { id: 'dassd7', text: "I felt that life was meaningless", source: 'DASS-21', domain: 'mood', selfHarm: false },
];

// ============================================================
// ANXIETY ITEMS POOL (~14 items from GAD-7, DASS-21)
// ============================================================
const ANXIETY_POOL = [
  // GAD-7 items (source: Generalized Anxiety Disorder 7-item scale, Spitzer et al. 2006)
  { id: 'gad1', text: "Feeling nervous, anxious, or on edge", source: 'GAD-7', domain: 'nervousness' },
  { id: 'gad2', text: "Not being able to stop or control worrying", source: 'GAD-7', domain: 'worry' },
  { id: 'gad3', text: "Worrying too much about different things", source: 'GAD-7', domain: 'worry' },
  { id: 'gad4', text: "Trouble relaxing", source: 'GAD-7', domain: 'tension' },
  { id: 'gad5', text: "Being so restless that it's hard to sit still", source: 'GAD-7', domain: 'restlessness' },
  { id: 'gad6', text: "Becoming easily annoyed or irritable", source: 'GAD-7', domain: 'irritability' },
  { id: 'gad7', text: "Feeling afraid, as if something awful might happen", source: 'GAD-7', domain: 'fear' },
  // DASS-21 Anxiety items (source: Lovibond & Lovibond 1995)
  { id: 'dassa1', text: "I was aware of dryness of my mouth", source: 'DASS-21', domain: 'somatic' },
  { id: 'dassa2', text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness without physical exertion)", source: 'DASS-21', domain: 'somatic' },
  { id: 'dassa3', text: "I experienced trembling (e.g. in the hands)", source: 'DASS-21', domain: 'somatic' },
  { id: 'dassa4', text: "I was worried about situations in which I might panic and make a fool of myself", source: 'DASS-21', domain: 'fear' },
  { id: 'dassa5', text: "I felt I was close to panic", source: 'DASS-21', domain: 'fear' },
  { id: 'dassa6', text: "I was aware of my heart beating without physical exertion (e.g. sense of heart rate increase, heart missing a beat)", source: 'DASS-21', domain: 'somatic' },
  { id: 'dassa7', text: "I felt scared without any good reason", source: 'DASS-21', domain: 'fear' },
];

// ============================================================
// STRESS ITEMS POOL (7 items from DASS-21)
// ============================================================
const STRESS_POOL = [
  { id: 'dasss1', text: "I found it hard to wind down", source: 'DASS-21', domain: 'tension' },
  { id: 'dasss2', text: "I tended to over-react to situations", source: 'DASS-21', domain: 'overreaction' },
  { id: 'dasss3', text: "I felt that I was using a lot of nervous energy", source: 'DASS-21', domain: 'arousal' },
  { id: 'dasss4', text: "I found myself getting agitated", source: 'DASS-21', domain: 'agitation' },
  { id: 'dasss5', text: "I found it difficult to relax", source: 'DASS-21', domain: 'tension' },
  { id: 'dasss6', text: "I was intolerant of anything that kept me from getting on with what I was doing", source: 'DASS-21', domain: 'impatience' },
  { id: 'dasss7', text: "I felt that I was rather touchy", source: 'DASS-21', domain: 'irritability' },
];

// Standard 0-3 response options (shared by PHQ-9, GAD-7, and adaptable for CESD-R/DASS-21)
const SCORE_OPTIONS = [
  { value: 0, label: "Not at all", emoji: "🟢" },
  { value: 1, label: "Several days", emoji: "🟡" },
  { value: 2, label: "More than half the days", emoji: "🟠" },
  { value: 3, label: "Nearly every day", emoji: "🔴" },
];

// Shuffle array helper (Fisher-Yates)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random items from pool, ensuring at least one self-harm item is included for depression if the pool has them
function pickQuestions(pool, n) {
  const selfHarmItems = pool.filter(q => q.selfHarm);
  const otherItems = pool.filter(q => !q.selfHarm);
  const shuffledOther = shuffleArray(otherItems);

  let selected;
  if (selfHarmItems.length > 0 && n > 3) {
    // Always include 1 self-harm screening item
    const shItem = selfHarmItems[Math.floor(Math.random() * selfHarmItems.length)];
    selected = [shItem, ...shuffledOther.slice(0, n - 1)];
  } else {
    selected = shuffleArray(pool).slice(0, n);
  }
  return shuffleArray(selected); // Final shuffle so self-harm item isn't always last
}

// ============================================================
// SCORING & SEVERITY
// ============================================================
function scoreSeverity(score, maxScore, type) {
  const pct = score / maxScore;
  if (type === 'depression') {
    if (pct <= 0.15) return { level: 'minimal', label: 'Minimal', emoji: '🌿', color: '#66bb6a' };
    if (pct <= 0.33) return { level: 'mild', label: 'Mild', emoji: '🌤️', color: '#fdd835' };
    if (pct <= 0.52) return { level: 'moderate', label: 'Moderate', emoji: '🌥️', color: '#ffb74d' };
    if (pct <= 0.70) return { level: 'moderately_severe', label: 'Moderately Severe', emoji: '🌧️', color: '#ff8a65' };
    return { level: 'severe', label: 'Severe', emoji: '⛈️', color: '#e57373' };
  }
  if (type === 'anxiety') {
    if (pct <= 0.19) return { level: 'minimal', label: 'Minimal', emoji: '🌿', color: '#66bb6a' };
    if (pct <= 0.43) return { level: 'mild', label: 'Mild', emoji: '🌤️', color: '#fdd835' };
    if (pct <= 0.67) return { level: 'moderate', label: 'Moderate', emoji: '🌥️', color: '#ffb74d' };
    return { level: 'severe', label: 'Severe', emoji: '⛈️', color: '#e57373' };
  }
  // stress
  if (pct <= 0.33) return { level: 'normal', label: 'Normal', emoji: '🌿', color: '#66bb6a' };
  if (pct <= 0.52) return { level: 'mild', label: 'Mild', emoji: '🌤️', color: '#fdd835' };
  if (pct <= 0.71) return { level: 'moderate', label: 'Moderate', emoji: '🌥️', color: '#ffb74d' };
  return { level: 'severe', label: 'Severe', emoji: '⛈️', color: '#e57373' };
}

function generateExpandedSummary(questions, answers, type) {
  const score = answers.reduce((s, a) => s + a, 0);
  const maxScore = questions.length * 3;
  const sev = scoreSeverity(score, maxScore, type);
  const labels = { depression: 'Depression', anxiety: 'Anxiety', stress: 'Stress' };

  const sections = [];

  // Score
  sections.push({
    title: "Your Results",
    text: `${labels[type]} Score: ${score}/${maxScore} — ${sev.emoji} ${sev.label}\nBased on ${questions.length} items from ${[...new Set(questions.map(q => q.source))].join(', ')}`
  });

  // Theme-based insight
  const depMsgs = {
    minimal: "Your responses suggest you're doing well in terms of mood. Keep doing what's working for you — the small things matter more than you think. 💛",
    mild: "You're experiencing some low mood. This is common and doesn't mean something is wrong with you. Pay attention to sleep, movement, and connection with people you trust.",
    moderate: "Your answers point to a noticeable weight on your mood. This level of depression can affect your daily life. Consider talking to someone you trust — a friend, family member, or counselor.",
    moderately_severe: "Your responses suggest significant depression. Please know this isn't your fault and it's treatable. Reaching out to a mental health professional could make a real difference. You deserve support.",
    severe: "Your answers indicate severe depression. Please consider reaching out to a professional soon. You don't have to carry this alone. If you're in crisis, please contact a helpline — you matter more than you know. 💙",
  };
  const anxMsgs = {
    minimal: "Your anxiety levels look manageable right now. That's a great sign. Keep nurturing whatever brings you calm. 🌿",
    mild: "You're carrying some worry and tension. Gentle breathing exercises, limiting news/social media, and talking things out can help. You've got this.",
    moderate: "Your anxiety is at a level where it might be interfering with your daily life. Consider trying structured relaxation techniques or speaking with a counselor. You deserve to feel at ease.",
    severe: "Your responses suggest significant anxiety. This level of worry can be exhausting. A mental health professional can offer tools that really help — therapy for anxiety has some of the best outcomes. Please reach out. 🫂",
  };
  const strMsgs = {
    normal: "Your stress levels seem well-managed. That's great — keep up whatever routines help you stay grounded. 🌿",
    mild: "You're under some stress but it seems manageable. Prioritizing rest, setting small boundaries, and making time for things you enjoy can keep it from building up.",
    moderate: "Your stress levels are elevated. When stress stays at this level it can start affecting sleep, mood, and health. Try to identify what you can control and let go of what you can't.",
    severe: "Your stress is running high. This level of chronic tension takes a real toll on your body and mind. Please consider talking to someone — even a single session with a counselor can help you find relief. 🫂",
  };

  const msgMap = type === 'depression' ? depMsgs : type === 'anxiety' ? anxMsgs : strMsgs;
  sections.push({ title: `About Your ${labels[type]}`, text: msgMap[sev.level] });

  // Self-harm flag
  const selfHarmQs = questions.filter(q => q.selfHarm);
  if (selfHarmQs.length > 0) {
    const selfHarmScored = selfHarmQs.some((q, _) => {
      const idx = questions.indexOf(q);
      return answers[idx] >= 1;
    });
    if (selfHarmScored) {
      sections.push({
        title: "💙 An Important Note",
        text: "You indicated having thoughts of hurting yourself or being better off dead. These feelings are more common than people talk about, and they are treatable.\n\nPlease reach out to someone:\n• Crisis Text Line: Text HOME to 741741\n• 988 Suicide & Crisis Lifeline: Call or text 988\n• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\nYou are not alone. Asking for help is brave."
      });
    }
  }

  // Domain-specific tips
  const tips = [];
  const domainScores = {};
  questions.forEach((q, i) => {
    const d = q.domain;
    if (!domainScores[d]) domainScores[d] = { total: 0, count: 0 };
    domainScores[d].total += answers[i];
    domainScores[d].count++;
  });
  const avgDomain = (d) => domainScores[d] ? domainScores[d].total / domainScores[d].count : 0;

  if (avgDomain('sleep') >= 2) tips.push("😴 Sleep seems to be a struggle. Try a consistent bedtime, limit screens 1hr before bed, and keep your room cool and dark.");
  if (avgDomain('fatigue') >= 2) tips.push("⚡ Low energy can be both a cause and a symptom. Even a 10-minute walk outside can help reset your body's energy signals.");
  if (avgDomain('appetite') >= 2) tips.push("🍽️ Your eating patterns might be off. Try to eat something small and nourishing even when you don't feel like it — your brain needs fuel.");
  if (avgDomain('worthlessness') >= 2) tips.push("🤍 You're being hard on yourself. Try writing down one thing you did okay today — not great, just okay. That counts.");
  if (avgDomain('anhedonia') >= 2) tips.push("🎨 Loss of interest in things you used to enjoy is a key signal. Try doing something you used to love for just 5 minutes — sometimes the spark returns mid-action.");
  if (avgDomain('concentration') >= 2) tips.push("🧠 Trouble focusing is common with depression and anxiety. Break tasks into tiny steps and give yourself grace when your brain won't cooperate.");
  if (avgDomain('worry') >= 2) tips.push("🫁 For worry that won't stop: try the 4-7-8 breath (inhale 4 sec, hold 7, exhale 8). Doing this 3 times can calm your nervous system.");
  if (avgDomain('nervousness') >= 2) tips.push("🌊 When anxiety spikes, try grounding: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.");
  if (avgDomain('fear') >= 2) tips.push("💜 Feeling scared or panicky is your body's alarm system overreacting. It's not dangerous — it's uncomfortable. Slow breaths signal safety to your brain.");
  if (avgDomain('somatic') >= 2) tips.push("💓 Physical symptoms like racing heart, trembling, or breathlessness can be anxiety manifesting in your body. Progressive muscle relaxation can help break the cycle.");
  if (avgDomain('tension') >= 2) tips.push("🧘 Trouble relaxing is your body stuck in fight-or-flight. Progressive muscle relaxation (tense then release each muscle group) can signal safety.");
  if (avgDomain('agitation') >= 2 || avgDomain('overreaction') >= 2) tips.push("🔥 Feeling agitated or overreactive often means your stress cup is full. One less commitment, one early bedtime — small subtractions help.");
  if (avgDomain('irritability') >= 2 || avgDomain('impatience') >= 2) tips.push("🍃 Irritability and impatience are often signs your nervous system needs a reset. Even 5 minutes of silence, a short walk, or cold water on your wrists can help.");

  if (tips.length > 0) {
    sections.push({ title: "Personalized Tips", text: tips.slice(0, 5).join("\n\n") });
  }

  // Closing
  const heavy = ['severe', 'moderately_severe'].includes(sev.level);
  const closing = heavy
    ? "Thank you for being honest with yourself today. That takes real courage. Please remember — these scores are a snapshot, not a sentence. Things can get better with the right support. 🌱"
    : sev.level === 'minimal' || sev.level === 'normal'
      ? "You're in a good place right now. Keep checking in with yourself — self-awareness is one of the most powerful things you can do for your mental health. ✨"
      : "Thanks for taking the time to check in. Awareness is the first step. Come back anytime — I'll be here. 🌿";
  sections.push({ title: "", text: closing });

  // Disclaimer
  sections.push({
    title: "📋 Important Disclaimer",
    text: `This screening uses items from ${[...new Set(questions.map(q => q.source))].join(', ')} — all clinically validated, public domain instruments. However, this is NOT a diagnosis. Only a qualified mental health professional can diagnose depression, anxiety, or stress disorders. These results are for self-awareness only.\n\nAll your answers stay on your device. Nothing is sent anywhere.`
  });

  return { sections, score, maxScore, sev };
}

// ============================================================
// SPIRIT CHARACTER (ghost style)
// ============================================================
function SpiritCharacter({ thinking }) {
  const [eyeOpen, setEyeOpen] = useState(true);

  useEffect(() => {
    const blink = () => {
      setEyeOpen(false);
      setTimeout(() => setEyeOpen(true), 150);
    };
    const id = setInterval(blink, 2000 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);

  const ey = eyeOpen ? 5.5 : 1;

  return (
    <div className="spirit-wrap">
      <div className="spirit-body">
        <svg className="spirit-svg" width="120" height="160" viewBox="0 0 120 160">
          <defs>
            <radialGradient id="ghostG" cx="45%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity=".97"/>
              <stop offset="40%" stopColor="#e6f5ff" stopOpacity=".9"/>
              <stop offset="75%" stopColor="#cce8ff" stopOpacity=".6"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2"/>
            </radialGradient>
            <radialGradient id="ghostGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity=".15"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </radialGradient>
            <filter id="ghostShadow">
              <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="var(--accent)" floodOpacity=".3"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.3"/>
            </filter>
          </defs>
          <ellipse cx="60" cy="70" rx="52" ry="58" fill="url(#ghostGlow)"/>
          <path d="M58 12 Q52 2, 56 -4 Q60 -8, 62 -2 Q66 6, 60 12" fill="url(#ghostG)" opacity=".7" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".2"/>
          <path d="M55 18 Q48 6, 54 -2 Q58 -6, 60 0 Q64 8, 58 18" fill="url(#ghostG)" opacity=".5"/>
          <ellipse cx="60" cy="65" rx="40" ry="45" fill="url(#ghostG)" filter="url(#ghostShadow)" stroke="var(--accent)" strokeWidth=".8" strokeOpacity=".15"/>
          <ellipse cx="45" cy="55" rx="12" ry="2" fill="white" opacity=".08" transform="rotate(-8 45 55)"/>
          <ellipse cx="70" cy="48" rx="8" ry="1.5" fill="white" opacity=".06" transform="rotate(5 70 48)"/>
          <circle cx="38" cy="60" r="1" fill="white" opacity=".2"/>
          <circle cx="75" cy="55" r=".8" fill="white" opacity=".15"/>
          <circle cx="50" cy="80" r=".7" fill="white" opacity=".12"/>
          <circle cx="68" cy="78" r=".9" fill="white" opacity=".13"/>
          <ellipse cx="40" cy="72" rx="8" ry="5" fill="#ffb0b0" opacity=".18"/>
          <ellipse cx="80" cy="72" rx="8" ry="5" fill="#ffb0b0" opacity=".18"/>
          <ellipse cx="46" cy="62" rx="6" ry={ey} fill="#2A2A3A" opacity=".85"/>
          <ellipse cx="74" cy="62" rx="6" ry={ey} fill="#2A2A3A" opacity=".85"/>
          {eyeOpen && <>
            <circle cx="48.5" cy="59" r="2.5" fill="white" opacity=".95"/>
            <circle cx="76.5" cy="59" r="2.5" fill="white" opacity=".95"/>
            <circle cx="44" cy="63" r="1" fill="white" opacity=".5"/>
            <circle cx="72" cy="63" r="1" fill="white" opacity=".5"/>
          </>}
          {thinking ? (
            <ellipse cx="60" cy="80" rx="3.5" ry="3" fill="#2A2A3A" opacity=".3"/>
          ) : (
            <path d="M50 78 Q60 87, 70 78" fill="none" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
          )}
          <ellipse cx="22" cy="68" rx="7" ry="10" fill="url(#ghostG)" stroke="var(--accent)" strokeWidth=".5" strokeOpacity=".12" transform="rotate(-15 22 68)"/>
          <ellipse cx="98" cy="68" rx="7" ry="10" fill="url(#ghostG)" stroke="var(--accent)" strokeWidth=".5" strokeOpacity=".12" transform="rotate(15 98 68)"/>
          <path d="M35 105 Q42 120, 38 135 Q36 142, 40 148 Q43 152, 46 148" fill="url(#ghostG)" opacity=".6" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".1"/>
          <path d="M60 108 Q58 125, 62 138 Q64 145, 60 150" fill="url(#ghostG)" opacity=".5" stroke="var(--accent)" strokeWidth=".3" strokeOpacity=".08"/>
          <path d="M85 105 Q78 120, 82 135 Q84 142, 80 148 Q77 152, 74 148" fill="url(#ghostG)" opacity=".6" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".1"/>
          <text x="8" y="45" fontSize="8" opacity=".3" fill="var(--accent)">✧</text>
          <text x="105" y="40" fontSize="6" opacity=".25" fill="var(--accent)">✦</text>
          <text x="15" y="100" fontSize="5" opacity=".2" fill="var(--accent)">✧</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// WELLNESS PAGE — 4 sub-tabs: Depression, Anxiety, Stress, Full Check-in
// ============================================================
function WellnessPage() {
  const [subTab, setSubTab] = useState('depression');
  return (
    <div className="wellness-page">
      <div className="wellness-sub-tabs">
        <button className={`wellness-sub-tab ${subTab === 'depression' ? 'active' : ''}`} onClick={() => setSubTab('depression')}>💙 Depression</button>
        <button className={`wellness-sub-tab ${subTab === 'anxiety' ? 'active' : ''}`} onClick={() => setSubTab('anxiety')}>💜 Anxiety</button>
        <button className={`wellness-sub-tab ${subTab === 'stress' ? 'active' : ''}`} onClick={() => setSubTab('stress')}>🔥 Stress</button>
        <button className={`wellness-sub-tab ${subTab === 'full' ? 'active' : ''}`} onClick={() => setSubTab('full')}>🧠 Full Check-in</button>
      </div>
      {subTab === 'depression' && <ScreeningTab type="depression" pool={DEPRESSION_POOL} count={15} />}
      {subTab === 'anxiety' && <ScreeningTab type="anxiety" pool={ANXIETY_POOL} count={14} />}
      {subTab === 'stress' && <ScreeningTab type="stress" pool={STRESS_POOL} count={7} />}
      {subTab === 'full' && <FullCheckInTab />}
    </div>
  );
}

// ============================================================
// SINGLE SCREENING TAB (used by Depression, Anxiety, Stress)
// ============================================================
function ScreeningTab({ type, pool, count }) {
  const labels = { depression: 'Depression', anxiety: 'Anxiety', stress: 'Stress' };
  const sources = { depression: 'PHQ-9, CESD-R & DASS-21', anxiety: 'GAD-7 & DASS-21', stress: 'DASS-21' };
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const startSession = () => {
    const picked = pickQuestions(pool, Math.min(count, pool.length));
    setQuestions(picked);
    setAnswers([]);
    setQIndex(0);
    setSummaryData(null);
    setPhase('asking');
  };

  const selectAnswer = (val) => {
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);
    if (qIndex + 1 >= questions.length) {
      setPhase('thinking');
      setTimeout(() => {
        setSummaryData(generateExpandedSummary(questions, newAnswers, type));
        setPhase('summary');
      }, 2200);
    } else {
      setQIndex(qIndex + 1);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-bubble">
          <div>Hey there 💛</div>
          <div style={{ marginTop: 8, fontSize: '.88em', color: 'var(--text2)' }}>
            This {labels[type]} screening draws from <strong>{sources[type]}</strong> — real, clinically validated tools used by healthcare professionals worldwide. I'll show you {Math.min(count, pool.length)} randomized items. For each, pick how often you've felt that way in the <strong>last 2 weeks</strong>.
          </div>
          <div style={{ marginTop: 8, fontSize: '.82em', color: 'var(--text2)', fontStyle: 'italic' }}>
            Questions are randomized each time so you get a different experience. Everything stays on your device.
          </div>
        </div>
        <div className="spirit-btns" style={{ marginTop: 16 }}>
          <button className="spirit-btn spirit-btn-primary" onClick={startSession}>Let's begin ✨</button>
        </div>
      </div>
    );
  }

  if (phase === 'asking') {
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-bubble">
          <div className="spirit-question-num">{labels[type]} — Question {qIndex + 1} of {questions.length}</div>
          <div style={{ marginTop: 6 }}>Over the last 2 weeks, how often have you been bothered by:</div>
          <div style={{ marginTop: 10, fontWeight: 600, fontSize: '1.05em' }}>"{questions[qIndex].text}"</div>
          <div style={{ marginTop: 4, fontSize: '.72em', color: 'var(--text2)', fontStyle: 'italic' }}>Source: {questions[qIndex].source}</div>
        </div>
        <div className="spirit-progress">
          <div className="spirit-progress-bar" style={{ width: `${(qIndex / questions.length) * 100}%` }} />
        </div>
        <div className="spirit-input-area">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {SCORE_OPTIONS.map(opt => (
              <button key={opt.value} className="spirit-btn" onClick={() => selectAnswer(opt.value)}
                style={{ textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{opt.emoji}</span> <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'thinking') {
    return (
      <div className="spirit-container">
        <div className="spirit-thinking">
          <SpiritCharacter thinking={true} />
        </div>
        <div className="spirit-bubble">
          <div>Let me look at your answers...</div>
          <div className="spirit-dots">
            <div className="spirit-dot" /><div className="spirit-dot" /><div className="spirit-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && summaryData) {
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-summary">
          {summaryData.sections.map((sec, i) => (
            <div key={i} className="spirit-summary-card">
              {sec.title && <div className="spirit-summary-title">{sec.title}</div>}
              {sec.text.split('\n').map((line, j) => (
                <div key={j} style={{ marginBottom: line ? 6 : 10 }}>{line}</div>
              ))}
            </div>
          ))}
          <div className="spirit-restart">
            <button className="spirit-btn spirit-btn-primary" onClick={startSession}>Take again 🔄</button>
            <button className="spirit-btn" onClick={() => setPhase('intro')} style={{ marginLeft: 8 }}>Back</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ============================================================
// FULL CHECK-IN — draws from ALL pools (~20 questions total)
// ============================================================
function FullCheckInTab() {
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]); // parallel array: 'depression'|'anxiety'|'stress'
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const startSession = () => {
    // Pick from each pool: 10 depression, 7 anxiety, 4 stress = 21 total
    const depQs = pickQuestions(DEPRESSION_POOL, 10);
    const anxQs = pickQuestions(ANXIETY_POOL, 7);
    const strQs = pickQuestions(STRESS_POOL, 4);

    // Combine and create parallel type tracking
    const combined = [
      ...depQs.map(q => ({ q, type: 'depression' })),
      ...anxQs.map(q => ({ q, type: 'anxiety' })),
      ...strQs.map(q => ({ q, type: 'stress' })),
    ];
    const shuffled = shuffleArray(combined);

    setQuestions(shuffled.map(c => c.q));
    setQuestionTypes(shuffled.map(c => c.type));
    setAnswers([]);
    setQIndex(0);
    setSummaryData(null);
    setPhase('asking');
  };

  const selectAnswer = (val) => {
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);
    if (qIndex + 1 >= questions.length) {
      setPhase('thinking');
      setTimeout(() => {
        // Split answers back by type
        const depIdxs = [], anxIdxs = [], strIdxs = [];
        const depQs = [], anxQs = [], strQs = [];
        const depAns = [], anxAns = [], strAns = [];
        questionTypes.forEach((t, i) => {
          if (t === 'depression') { depQs.push(questions[i]); depAns.push(newAnswers[i]); }
          else if (t === 'anxiety') { anxQs.push(questions[i]); anxAns.push(newAnswers[i]); }
          else { strQs.push(questions[i]); strAns.push(newAnswers[i]); }
        });

        const depResult = generateExpandedSummary(depQs, depAns, 'depression');
        const anxResult = generateExpandedSummary(anxQs, anxAns, 'anxiety');
        const strResult = generateExpandedSummary(strQs, strAns, 'stress');

        // Merge into combined summary
        const allSections = [];
        allSections.push({
          title: "Full Check-in Results",
          text: `Depression: ${depResult.score}/${depResult.maxScore} — ${depResult.sev.emoji} ${depResult.sev.label}\nAnxiety: ${anxResult.score}/${anxResult.maxScore} — ${anxResult.sev.emoji} ${anxResult.sev.label}\nStress: ${strResult.score}/${strResult.maxScore} — ${strResult.sev.emoji} ${strResult.sev.label}`
        });

        // Add each category's insight (skip their individual score sections and disclaimers)
        [depResult, anxResult, strResult].forEach(r => {
          r.sections.forEach(s => {
            if (s.title && !s.title.includes('Results') && !s.title.includes('Disclaimer') && s.title !== '') {
              allSections.push(s);
            }
          });
        });

        // Combined closing
        const worst = [depResult.sev.level, anxResult.sev.level, strResult.sev.level];
        const isHeavy = worst.some(l => l === 'severe' || l === 'moderately_severe');
        const closing = isHeavy
          ? "Thank you for being honest with yourself today. That takes real courage. Please remember — these scores are a snapshot, not a sentence. Things can get better with the right support. 🌱"
          : "Thanks for doing a full check-in. Self-awareness across all three areas — mood, worry, and stress — is incredibly powerful. Come back anytime. 🌿";
        allSections.push({ title: "", text: closing });

        // Single disclaimer
        const allSources = [...new Set(questions.map(q => q.source))].join(', ');
        allSections.push({
          title: "📋 Important Disclaimer",
          text: `This screening uses items from ${allSources} — all clinically validated, public domain instruments. This is NOT a diagnosis. Only a qualified mental health professional can diagnose mental health conditions. All answers stay on your device.`
        });

        setSummaryData({ sections: allSections });
        setPhase('summary');
      }, 2800);
    } else {
      setQIndex(qIndex + 1);
    }
  };

  const typeLabels = { depression: '💙 Depression', anxiety: '💜 Anxiety', stress: '🔥 Stress' };

  if (phase === 'intro') {
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-bubble">
          <div>Full Mental Health Check-in 💛</div>
          <div style={{ marginTop: 8, fontSize: '.88em', color: 'var(--text2)' }}>
            I'll walk you through ~21 randomized questions covering <strong>depression</strong>, <strong>anxiety</strong>, and <strong>stress</strong> — drawn from PHQ-9, CESD-R, GAD-7, and DASS-21. For each, pick how often you've felt that way in the <strong>last 2 weeks</strong>.
          </div>
          <div style={{ marginTop: 8, fontSize: '.82em', color: 'var(--text2)', fontStyle: 'italic' }}>
            All clinically validated, public domain tools used by healthcare professionals. Questions are shuffled each time. Everything stays 100% on your device.
          </div>
        </div>
        <div className="spirit-btns" style={{ marginTop: 16 }}>
          <button className="spirit-btn spirit-btn-primary" onClick={startSession}>Let's begin ✨</button>
        </div>
      </div>
    );
  }

  if (phase === 'asking') {
    const currentType = questionTypes[qIndex];
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-bubble">
          <div className="spirit-question-num">{typeLabels[currentType]} — Question {qIndex + 1} of {questions.length}</div>
          <div style={{ marginTop: 6 }}>Over the last 2 weeks, how often have you been bothered by:</div>
          <div style={{ marginTop: 10, fontWeight: 600, fontSize: '1.05em' }}>"{questions[qIndex].text}"</div>
          <div style={{ marginTop: 4, fontSize: '.72em', color: 'var(--text2)', fontStyle: 'italic' }}>Source: {questions[qIndex].source}</div>
        </div>
        <div className="spirit-progress">
          <div className="spirit-progress-bar" style={{ width: `${(qIndex / questions.length) * 100}%` }} />
        </div>
        <div className="spirit-input-area">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {SCORE_OPTIONS.map(opt => (
              <button key={opt.value} className="spirit-btn" onClick={() => selectAnswer(opt.value)}
                style={{ textAlign: 'left', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{opt.emoji}</span> <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'thinking') {
    return (
      <div className="spirit-container">
        <div className="spirit-thinking">
          <SpiritCharacter thinking={true} />
        </div>
        <div className="spirit-bubble">
          <div>Let me sit with everything you shared...</div>
          <div className="spirit-dots">
            <div className="spirit-dot" /><div className="spirit-dot" /><div className="spirit-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && summaryData) {
    return (
      <div className="spirit-container">
        <SpiritCharacter thinking={false} />
        <div className="spirit-summary">
          {summaryData.sections.map((sec, i) => (
            <div key={i} className="spirit-summary-card">
              {sec.title && <div className="spirit-summary-title">{sec.title}</div>}
              {sec.text.split('\n').map((line, j) => (
                <div key={j} style={{ marginBottom: line ? 6 : 10 }}>{line}</div>
              ))}
            </div>
          ))}
          <div className="spirit-restart">
            <button className="spirit-btn spirit-btn-primary" onClick={startSession}>Check in again 🔄</button>
            <button className="spirit-btn" onClick={() => setPhase('intro')} style={{ marginLeft: 8 }}>Back</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}


// ---- Goals Page (stacked cards) ----
const GOALS_STORAGE = 'folioGoals';
const GOAL_TYPES = [
  { key: 'daily', label: 'Daily', icon: '☀️', color: '#66bb6a' },
  { key: 'weekly', label: 'Weekly', icon: '📅', color: '#42a5f5' },
  { key: 'yearly', label: 'Yearly', icon: '🌟', color: '#fdd835' },
];

function GoalsPage() {
  const [goals, setGoals] = useState(() => getStorage(GOALS_STORAGE, []));
  const [newGoal, setNewGoal] = useState('');
  const [goalType, setGoalType] = useState('daily');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedStack, setExpandedStack] = useState(null);

  const saveGoals = g => { setStorage(GOALS_STORAGE, g); setGoals(g); };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const g = { id: 'goal_' + Date.now(), text: newGoal.trim(), type: goalType, done: false, createdAt: new Date().toISOString(), completedAt: null, streak: 0 };
    saveGoals([g, ...goals]);
    setNewGoal(''); setShowAdd(false); setExpandedStack(goalType);
  };

  const toggleDone = id => {
    saveGoals(goals.map(g => g.id === id ? { ...g, done: !g.done, completedAt: !g.done ? new Date().toISOString() : null, streak: !g.done ? (g.streak || 0) + 1 : g.streak } : g));
  };

  const deleteGoal = id => saveGoals(goals.filter(g => g.id !== id));

  const resetDaily = () => {
    saveGoals(goals.map(g => g.type === 'daily' ? { ...g, done: false, completedAt: null } : g));
  };

  useEffect(() => {
    const lastReset = localStorage.getItem('folioLastDailyReset');
    const today = new Date().toDateString();
    if (lastReset !== today) {
      saveGoals(goals.map(g => g.type === 'daily' ? { ...g, done: false, completedAt: null } : g));
      localStorage.setItem('folioLastDailyReset', today);
    }
  }, []);

  const byType = type => goals.filter(g => g.type === type);
  const completedCount = goals.filter(g => g.done).length;
  const totalActive = goals.length;
  const pct = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

  return (
    <div className="mood-page">
      {/* Progress overview */}
      <div className="mood-card mood-card-gradient-1">
        <div className="mood-card-header"><span className="mood-card-icon">🎯</span><span className="mood-card-title">Your Progress</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: `conic-gradient(var(--btn1) ${pct}%, var(--border) ${pct}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85em', fontWeight: 700, color: 'var(--btn1)' }}>{pct}%</div>
          </div>
          <div>
            <div style={{ color: 'var(--text1)', fontWeight: 600, fontSize: '1.05em' }}>{completedCount}/{totalActive} goals done</div>
            <div style={{ color: 'var(--text2)', fontSize: '.85em', fontStyle: 'italic' }}>Keep going — every step counts 🌱</div>
          </div>
        </div>
      </div>

      {/* Add goal */}
      <div className="mood-card">
        {showAdd ? (
          <>
            <div className="mood-card-header"><span className="mood-card-icon">✏️</span><span className="mood-card-title">New Goal</span></div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {GOAL_TYPES.map(t => (
                <button key={t.key} className={`comm-anon-tag ${goalType === t.key ? 'active' : ''}`} onClick={() => setGoalType(t.key)}>{t.icon} {t.label}</button>
              ))}
            </div>
            <input className="form-input" value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="What's your goal?" maxLength={120}
              onKeyDown={e => e.key === 'Enter' && addGoal()} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="save-btn" onClick={addGoal} style={{ flex: 1, padding: '12px 20px', fontSize: '.95em' }}>Add Goal ✦</button>
              <button className="modal-btn modal-btn-cancel" onClick={() => { setShowAdd(false); setNewGoal(''); }} style={{ padding: '12px 20px' }}>Cancel</button>
            </div>
          </>
        ) : (
          <button className="save-btn" onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '14px', fontSize: '1em' }}>+ Add a New Goal</button>
        )}
      </div>

      {/* Goal stacks */}
      {GOAL_TYPES.map(t => {
        const items = byType(t.key);
        const doneCount = items.filter(g => g.done).length;
        const isExpanded = expandedStack === t.key;
        const stackPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

        return (
          <div key={t.key} className="goal-stack" onClick={() => setExpandedStack(isExpanded ? null : t.key)} style={{ cursor: 'pointer' }}>
            {/* Stack header */}
            <div className="mood-card" style={{ marginBottom: 0, borderRadius: isExpanded && items.length > 0 ? '18px 18px 0 0' : '18px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.6em' }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text1)', fontWeight: 700, fontSize: '1.1em' }}>{t.label} Goals</div>
                  <div style={{ color: 'var(--text2)', fontSize: '.82em' }}>{items.length === 0 ? 'No goals yet' : `${doneCount}/${items.length} complete · ${stackPct}%`}</div>
                </div>
                {/* Mini progress bar */}
                {items.length > 0 && (
                  <div style={{ width: 50, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${stackPct}%`, height: '100%', borderRadius: 3, background: t.color, transition: 'width .3s' }} />
                  </div>
                )}
                <span style={{ color: 'var(--text2)', fontSize: '1.2em', transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                {t.key === 'daily' && items.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); resetDaily(); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '3px 8px', color: 'var(--text2)', fontFamily: "'Lora',serif", fontSize: '.72em', cursor: 'pointer' }}>Reset</button>
                )}
              </div>
            </div>

            {/* Expanded items */}
            {isExpanded && items.length > 0 && (
              <div className="mood-card" style={{ borderRadius: '0 0 18px 18px', borderTop: '1px dashed var(--border)', marginTop: 0, paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                {items.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, background: g.done ? 'rgba(111,175,143,.12)' : 'rgba(255,255,255,.04)', borderRadius: 12, borderLeft: `3px solid ${g.done ? t.color : 'var(--border)'}`, transition: 'all .2s' }}>
                    <span onClick={() => toggleDone(g.id)} style={{ fontSize: '1.3em', cursor: 'pointer', lineHeight: 1 }}>{g.done ? '✅' : '⬜'}</span>
                    <span style={{ flex: 1, color: g.done ? 'var(--text2)' : 'var(--text1)', textDecoration: g.done ? 'line-through' : 'none', fontSize: '.95em', transition: 'all .2s' }}>{g.text}</span>
                    {g.streak > 1 && <span style={{ fontSize: '.75em', color: t.color, fontWeight: 700 }}>🔥{g.streak}</span>}
                    <span onClick={() => deleteGoal(g.id)} style={{ cursor: 'pointer', fontSize: '.9em', opacity: .5 }} title="Delete">🗑️</span>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsed peek - show top 2 items as stacked cards behind */}
            {!isExpanded && items.length > 0 && (
              <div style={{ position: 'relative', height: items.length > 1 ? 14 : 7, marginTop: -4 }}>
                <div style={{ position: 'absolute', left: 8, right: 8, height: 8, background: 'var(--card-bg)', borderRadius: '0 0 14px 14px', opacity: .6, border: '1px solid var(--card-border)', borderTop: 'none', top: 0 }} />
                {items.length > 1 && <div style={{ position: 'absolute', left: 16, right: 16, height: 8, background: 'var(--card-bg)', borderRadius: '0 0 12px 12px', opacity: .35, border: '1px solid var(--card-border)', borderTop: 'none', top: 6 }} />}
              </div>
            )}
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="mood-card">
          <div className="mood-empty-gentle">No goals yet. Add your first daily, weekly, or yearly goal above 🌱</div>
        </div>
      )}
    </div>
  );
}

const COMM_SETTINGS_KEY = 'commUserSettings';
const COMM_GUIDELINE_KEY = 'commGuidelineSeen';
const COMM_BLOCKED_KEY = 'commBlockedUsers';
const COMM_HIDDEN_KEY = 'commHiddenUsers';
const COMM_ADJECTIVES = ['Sleepy','Cozy','Gentle','Quiet','Warm','Dreamy','Soft','Calm','Kind','Brave','Little','Misty','Starry','Cloudy','Mellow'];
const COMM_NOUNS = ['Pillow','Blanket','Candle','Cloud','Moon','Bear','Kitten','Bunny','Firefly','Star','Petal','Raindrop','Owl','Fox','Dove'];
const COMM_AVATARS = ['🧸','🕯️','🌙','☁️','🦊','🐱','🐰','🦉','🌟','🪷','🍂','☕','🧣','🎐','🪻'];
// Regex patterns for evasion attempts (l33t speak, spacing, etc.)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}
function generateAnonIdentity(seed) {
  const h = simpleHash(seed);
  return { name: COMM_ADJECTIVES[h % COMM_ADJECTIVES.length] + ' ' + COMM_NOUNS[(h >> 4) % COMM_NOUNS.length], avatar: COMM_AVATARS[(h >> 8) % COMM_AVATARS.length] };
}
function filterContent(text) {
  if (!text) return '';
  let f = text;
  for (const w of COMM_BAD_WORDS) { if (f.toLowerCase().includes(w)) f = f.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '***'); }
  return f;
}
function formatPostDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function getDevicePlatform() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'web';
}
function getDeviceFingerprint() {
  let fp = localStorage.getItem('folioDeviceFP');
  if (!fp) {
    fp = getDevicePlatform() + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('folioDeviceFP', fp);
  }
  return fp;
}


// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  // State
  const [entries, setEntries] = useState(() => getStorage('journalEntries', []));
  const [theme, setTheme] = useState(() => getStorage('journalTheme', 'default') || 'default');
  const [mode, setMode] = useState(() => getStorage('displayMode', 'light') || 'light');
  const [page, setPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ top: 0, right: 0 });
  const [emoji, setEmoji] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [causeTags, setCauseTags] = useState([]);
  const [search, setSearch] = useState('');
  const [openBooks, setOpenBooks] = useState(new Set());
  // Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, idx: null });
  const [lockModal, setLockModal] = useState(false);
  const [unlockModal, setUnlockModal] = useState({ open: false, idx: null, lockEl: null });
  const [lockPw, setLockPw] = useState('');
  const [lockPwConfirm, setLockPwConfirm] = useState('');
  const [unlockPw, setUnlockPw] = useState('');
  // Feedback
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  
  

  // Apply theme/mode to body
  useEffect(() => {
    const themeClass = theme === 'forest' ? 'forest-theme' : theme === 'blossom' ? 'blossom-theme' : '';
    document.body.className = [themeClass, mode === 'dark' ? 'dark-mode' : ''].join(' ').trim();
  }, [theme, mode]);

  const saveEntries = useCallback(e => { setStorage('journalEntries', e); setEntries(e); }, []);

  // Migrate legacy plaintext password on first load
  useEffect(() => { CRYPTO.migrateLegacy(); }, []);

  const handleTheme = t => { setTheme(t); setStorage('journalTheme', t); };
  const handleMode = m => { setMode(m); setStorage('displayMode', m); };

  const [alertModal, setAlertModal] = useState({ open: false, msg: '', title: 'Oops' });
  const showAlert = (msg, title) => setAlertModal({ open: true, msg, title: title || 'Oops' });

  const handleSave = () => {
    if (!emoji) { showAlert('Please select an emoji'); return; }
    if (!title.trim()) { showAlert('Title cannot be empty'); return; }
    if (!content.trim()) { showAlert('Entry cannot be empty'); return; }
    const now = new Date();
    const entry = { title: title.trim(), emoji, content: content.trim(), causeTags: [...causeTags], dateISO: now.toISOString(), date: now.toLocaleDateString() };
    const next = [...entries, entry];
    saveEntries(next);
    setTitle(''); setContent(''); setEmoji(null); setCauseTags([]);
  };

  const handleDelete = idx => setDeleteModal({ open: true, idx });
  const confirmDelete = () => {
    const next = [...entries]; next.splice(deleteModal.idx, 1);
    saveEntries(next);
    setDeleteModal({ open: false, idx: null });
  };

  const handleBookmark = idx => {
    const next = [...entries]; next[idx] = { ...next[idx], bookmarked: !next[idx].bookmarked };
    saveEntries(next);
  };

  const handleLock = (e, idx) => {
    if (!CRYPTO.hasMasterPassword()) { showAlert('Please set a master password first from Settings → Security'); return; }
    if (!entries[idx].locked) {
      const next = [...entries]; next[idx] = { ...next[idx], locked: true };
      saveEntries(next);
    } else {
      setUnlockModal({ open: true, idx });
    }
  };

  const submitUnlock = async () => {
    const ok = await CRYPTO.verifyPassword(unlockPw);
    if (ok) {
      const next = [...entries]; next[unlockModal.idx] = { ...next[unlockModal.idx], locked: false };
      saveEntries(next);
      setUnlockModal({ open: false, idx: null }); setUnlockPw('');
    } else { showAlert('Incorrect password!'); setUnlockPw(''); }
  };

  const saveMasterPassword = async () => {
    if (!lockPw || lockPw.length < 4) { showAlert('Password must be at least 4 characters!'); return; }
    if (lockPw !== lockPwConfirm) { showAlert('Passwords do not match!'); return; }
    try {
      await CRYPTO.setMasterPassword(lockPw);
      if (entries.length > 0) {
        await CRYPTO.encryptEntries(entries, lockPw);
      }
      setLockPw(''); setLockPwConfirm(''); setLockModal(false);
      showAlert('✅ Master password set! Your entries are now encrypted. You can lock individual entries by clicking 🔓', 'Success');
    } catch (err) {
      showAlert('Error setting password. Please try again.');
    }
  };

  const toggleBook = (e, dateKey) => {
    if (e.target.closest('.delete-btn') || e.target.classList.contains('lock-icon') || e.target.classList.contains('bookmark-star') || e.target.closest('.close-book-btn')) return;
    e.preventDefault();
    setOpenBooks(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey); else next.add(dateKey);
      return next;
    });
  };

  const closeBook = dateKey => {
    setOpenBooks(prev => { const next = new Set(prev); next.delete(dateKey); return next; });
  };

  // Orientation detection with manual override
  const [orientationPref, setOrientationPref] = useState(() => getStorage('folioOrientation', 'auto'));
  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight);
  useEffect(() => {
    const handleResize = () => {
      if (orientationPref === 'auto') {
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };
    if (orientationPref === 'portrait') setIsLandscape(false);
    else if (orientationPref === 'landscape') setIsLandscape(true);
    else handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));
    return () => { window.removeEventListener('resize', handleResize); };
  }, [orientationPref]);
  const handleOrientation = o => { setOrientationPref(o); setStorage('folioOrientation', o); };

  // Group entries by date
  const entriesByDate = {};
  entries.forEach((entry, index) => {
    const d = safeDateParse(entry);
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (!entriesByDate[key]) entriesByDate[key] = { date: d, entries: [] };
    entriesByDate[key].entries.push({ ...entry, originalIndex: index });
  });
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => entriesByDate[b].date - entriesByDate[a].date);

  // Search auto-open matching books (only reacts to search changes, not entry mutations)
  const searchRef = useRef(search);
  useEffect(() => {
    const prevSearch = searchRef.current;
    searchRef.current = search;
    if (!search.trim()) {
      // Only clear books if search was just cleared (not on entry save)
      if (prevSearch.trim()) setOpenBooks(new Set());
      return;
    }
    const s = search.toLowerCase();
    const matchingKeys = new Set();
    entries.forEach(entry => {
      if (
        (entry.title || '').toLowerCase().includes(s) ||
        (entry.content || '').toLowerCase().includes(s) ||
        String(entry.dateISO).toLowerCase().includes(s)
      ) {
        const d = safeDateParse(entry);
        const key = d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        matchingKeys.add(key);
      }
    });
    setOpenBooks(matchingKeys);
  }, [search, entries]);

  const lockStatus = CRYPTO.hasMasterPassword() ? 'Change Password' : 'Journal Password';

  // ---- Export / Import Backup ----
  const exportBackup = () => {
    const backup = {
      _folio_backup: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      journalEntries: getStorage('journalEntries', []),
      folioGoals: getStorage('folioGoals', null),
      journalTheme: getStorage('journalTheme', 'default'),
      displayMode: getStorage('displayMode', 'light'),
      // Include encrypted data if it exists
      folio_salt: localStorage.getItem('folio_salt'),
      folio_pw_hash: localStorage.getItem('folio_pw_hash'),
      folio_entries_enc: localStorage.getItem('folio_entries_enc'),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'folio-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showAlert('📦 Backup exported! Keep this file somewhere safe.', 'Exported');
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data._folio_backup) { showAlert('This file is not a valid Folio backup.'); return; }
        // Restore data
        if (data.journalEntries) { setStorage('journalEntries', data.journalEntries); setEntries(data.journalEntries); }
        if (data.folioGoals) setStorage('folioGoals', data.folioGoals);
        if (data.journalTheme) { setStorage('journalTheme', data.journalTheme); setTheme(data.journalTheme); }
        if (data.displayMode) { setStorage('displayMode', data.displayMode); setMode(data.displayMode); }
        // Restore encryption data
        if (data.folio_salt) localStorage.setItem('folio_salt', data.folio_salt);
        if (data.folio_pw_hash) localStorage.setItem('folio_pw_hash', data.folio_pw_hash);
        if (data.folio_entries_enc) localStorage.setItem('folio_entries_enc', data.folio_entries_enc);
        showAlert('✅ Backup restored! Your journal data has been imported.', 'Restored');
      } catch (err) {
        showAlert('Failed to read backup file. Make sure it\'s a valid Folio backup.');
      }
    };
    input.click();
  };

  const submitFeedback = () => {
    const url = 'https://docs.google.com/forms/d/e/1FAIpQLScXoWPkP_kHZKiHGN5VSy5QNGUHBDFyWI1OU2yL1ddsjK7zwA/viewform';
    window.open(url, '_system');
    setFeedbackModal(false);
  };
  return (
    <div id="folio-root" className={isLandscape ? 'landscape' : 'portrait'}>
      <style>{STYLES}</style>
      <div className="vine-left" />
      <div className="vine-right" />
      <div className="sun" />
      <div className="forest-trees">
        {[1,2,3,4,5,6,8,9,10].map(n => (
          <div key={n} className={`tree tree-${n}`}>{
            theme === 'blossom' ? (n % 3 === 0 ? '🌸' : '🩷') :
            theme === 'forest' ? (n % 3 === 0 ? '🍂' : '🍃') :
            (n % 3 === 0 ? '🌲' : '🌿')
          }</div>
        ))}
      </div>

      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="deco-flowers flowers-left">{theme === 'blossom' ? '🌸✧' : theme === 'forest' ? '🍂✧' : '🌿✧'}</div>
          <div className="deco-flowers flowers-right">{theme === 'blossom' ? '✧🌸' : theme === 'forest' ? '✧🍂' : '✧🍃'}</div>
          <div className="settings-icon" onClick={e => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setSettingsPos({ top: rect.bottom + 5, right: window.innerWidth - rect.right });
            setSettingsOpen(o => !o);
          }}>⚙️</div>
          <h1>Folio</h1>
          <p>My Journal</p>
          <div className="support-btn" onClick={() => setSupportModal(true)}>💖 Support</div>
        </div>

        <SettingsDropdown
          open={settingsOpen} pos={settingsPos} theme={theme} mode={mode}
          onTheme={handleTheme} onMode={handleMode}
          onLock={() => { setLockModal(true); setSettingsOpen(false); }}
          lockStatus={lockStatus}
          onFeedback={() => { setFeedbackModal(true); setSettingsOpen(false); }}
          onPrivacy={() => { setPrivacyModal(true); setSettingsOpen(false); }}
          onExport={() => { exportBackup(); setSettingsOpen(false); }}
          onImport={() => { importBackup(); setSettingsOpen(false); }}
          orientation={orientationPref}
          onOrientation={handleOrientation}
        />

        {/* Close settings on outside click */}
        {settingsOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}
            onClick={() => setSettingsOpen(false)} />
        )}

        <div className="heart-divider">{theme === 'blossom' ? '🌸' : theme === 'forest' ? '🍂' : '🌿'}</div>

        {/* Nav */}
        <div className="page-nav">
          {[['Diary',1],['Moods',2],['Goals',3],['Notes',4],['Wellness',5]].map(([label, pg]) => (
            <button key={pg} className={`nav-page ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{label}</button>
          ))}
        </div>

        {/* Page 1 */}
        {page === 1 && (
          <>
            <div className="entry-card">
              <div className="entry-header"><span className="sparkle">✧</span><span>Your Journal</span></div>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Today in couple words🌼" />
              <div className="emoji-slider-label">{emoji ? <span>Feeling {emoji}</span> : <span>How are you feeling?</span>}</div>
              <EmojiSlider selected={emoji} onSelect={setEmoji} />
              <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="hey....you okay? what're you thinking?💛" />
              <div className="cause-tag-section">
                <div className="cause-tag-label">Because of... <span className="cause-tag-hint">(optional)</span></div>
                <div className="cause-tag-grid">
                  {CAUSE_TAGS.map(tag => (
                    <div key={tag.key} className={`cause-tag ${causeTags.includes(tag.key) ? 'active' : ''}`}
                      onClick={() => setCauseTags(prev => prev.includes(tag.key) ? prev.filter(t => t !== tag.key) : [...prev, tag.key])}>
                      {tag.label}
                    </div>
                  ))}
                </div>
              </div>
              <button className="save-btn" onClick={handleSave}>Save this thought? ✦</button>
            </div>

            {/* Search — between entry card and past entries */}
            <div className="search-container search-container-small">
              <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search entries..." />
              {search && <button className="clear-search" onClick={() => { setSearch(''); setOpenBooks(new Set()); }}>✕</button>}
              {search.trim() && (() => {
                const s = search.toLowerCase();
                const found = entries.some(ent => (ent.title||'').toLowerCase().includes(s) || (ent.content||'').toLowerCase().includes(s) || String(ent.dateISO).toLowerCase().includes(s));
                return !found ? <div className="search-no-result">That entry doesn't exist 😢</div> : null;
              })()}
            </div>

            <div className="past-entries-section">
              {entries.length === 0 ? (
                <div className="empty-state">Your journal entries will appear here...</div>
              ) : (
                <div className="entries-list">
                  {sortedDates.map(dk => (
                    <Book
                      key={dk} dateKey={dk} dayData={entriesByDate[dk]}
                      openBooks={openBooks} onToggleBook={toggleBook} onCloseBook={closeBook}
                      onDelete={handleDelete} onBookmark={handleBookmark} onLock={handleLock}
                      searchTerm={search}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {page === 2 && <MoodPage entries={entries} />}
        {page === 3 && <GoalsPage />}
        {page === 4 && <NotesPage />}
        {page === 5 && <WellnessPage />}
      </div>

      {/* Delete Modal */}
      <Modal open={deleteModal.open} title="Delete Entry?" message="Are you sure you want to delete this journal entry? This action cannot be undone."
        onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, idx: null })} />

      {/* Lock Modal */}
      {lockModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setLockModal(false); }}>
          <div className="modal-box">
            <div className="modal-title">🔒 Set Master Password</div>
            <div className="modal-msg">Create a master password to lock/unlock individual entries.</div>
            <input className="modal-input" type="password" value={lockPw} onChange={e => setLockPw(e.target.value)} placeholder="Enter password (min 4 characters)" onKeyDown={e => e.key === 'Enter' && document.getElementById('lockPwConfirmInput').focus()} />
            <input id="lockPwConfirmInput" className="modal-input" type="password" value={lockPwConfirm} onChange={e => setLockPwConfirm(e.target.value)} placeholder="Confirm password" onKeyDown={e => e.key === 'Enter' && saveMasterPassword()} />
            <div className="modal-btns">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setLockModal(false); setLockPw(''); setLockPwConfirm(''); }}>Cancel</button>
              <button className="modal-btn modal-btn-confirm" onClick={saveMasterPassword}>Set Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {unlockModal.open && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) { setUnlockModal({ open: false, idx: null }); setUnlockPw(''); } }}>
          <div className="modal-box">
            <div className="modal-title">🔒 Enter Password</div>
            <div className="modal-msg">Enter your master password to unlock this entry.</div>
            <input className="modal-input" type="password" value={unlockPw} onChange={e => setUnlockPw(e.target.value)} placeholder="Enter master password" onKeyDown={e => e.key === 'Enter' && submitUnlock()} autoFocus />
            <div className="modal-btns">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setUnlockModal({ open: false, idx: null }); setUnlockPw(''); }}>Cancel</button>
              <button className="modal-btn modal-btn-confirm" onClick={submitUnlock}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <Modal open={alertModal.open} title={alertModal.title || 'Oops'} message={alertModal.msg}
        onConfirm={() => setAlertModal({ open: false, msg: '', title: 'Oops' })} />

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setFeedbackModal(false); }}>
          <div className="modal-box">
            <div className="modal-title">💬 Send Feedback</div>
            <div className="modal-msg" style={{ lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>We'd love to hear from you! Tap below to open our feedback form.</p>
              <p style={{ fontSize: '.85em', color: 'var(--text2)' }}>This opens a Google Form in your browser — no data is collected by the app.</p>
            </div>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-cancel" onClick={() => setFeedbackModal(false)}>Cancel</button>
              <button className="modal-btn modal-btn-confirm" onClick={submitFeedback}>Open Form ↗</button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {privacyModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setPrivacyModal(false); }}>
          <div className="modal-box" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-title">📄 Privacy Policy</div>
            <div className="modal-msg" style={{ textAlign: 'left', fontSize: '.9em', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 10 }}><strong>Last updated:</strong> February 2026</p>
              <p style={{ marginBottom: 10 }}>Folio is a 100% offline personal journal app. Your privacy is not just a feature — it is the foundation of this app.</p>
              
              <p style={{ marginBottom: 6 }}><strong>📱 Data Storage</strong></p>
              <p style={{ marginBottom: 10 }}>All of your data — journal entries, mood logs, goals, notes, wellness screening answers, and app settings — is stored exclusively on your device using local storage. Nothing is stored on any server. We have no database, no cloud, and no backend. We physically cannot see, access, or retrieve anything you write.</p>
              
              <p style={{ marginBottom: 6 }}><strong>🔒 Encryption</strong></p>
              <p style={{ marginBottom: 10 }}>If you set a master password, individual diary entries are encrypted using AES-256-GCM with PBKDF2 key derivation (600,000 iterations). Your password is never stored — only a salted cryptographic hash. Even if someone accessed your device storage directly, locked entries would be unreadable without your password.</p>
              
              <p style={{ marginBottom: 6 }}><strong>🚫 What We Do NOT Collect</strong></p>
              <p style={{ marginBottom: 10 }}>Folio does not collect, transmit, or share: your name, email address, phone number, location, contacts, photos, IP address, device identifiers, usage analytics, crash reports, or any personal information of any kind. There are zero analytics trackers, zero advertisements, and zero third-party SDKs in this app.</p>
              
              <p style={{ marginBottom: 6 }}><strong>🌐 Network Activity</strong></p>
              <p style={{ marginBottom: 10 }}>Folio makes no network requests except: (1) loading Google Fonts on first launch for display typography, and (2) opening external links you explicitly tap (feedback form, support page, crisis resources). No data from the app is ever sent in these requests. Your journal content, mood data, wellness answers, and all personal data stay entirely on your device.</p>
              
              <p style={{ marginBottom: 6 }}><strong>🧠 Wellness Screenings</strong></p>
              <p style={{ marginBottom: 10 }}>The mental health screenings (PHQ-9, GAD-7, CESD-R, DASS-21) run entirely on your device. Your answers are scored locally and are never transmitted anywhere. Results are shown to you and then discarded — they are not saved unless you choose to write about them in your journal.</p>
              
              <p style={{ marginBottom: 6 }}><strong>💬 Feedback</strong></p>
              <p style={{ marginBottom: 10 }}>If you choose to send feedback, it opens a Google Form in your browser. This is completely optional and separate from the app. No app data is included in the feedback form.</p>
              
              <p style={{ marginBottom: 6 }}><strong>🗑️ Deleting Your Data</strong></p>
              <p style={{ marginBottom: 10 }}>You can delete individual entries from the Diary tab, individual notes from the Notes tab, or clear all app data by clearing your browser/app storage in your device settings. Since no data exists on any server, deletion is instant and permanent.</p>
              
              <p style={{ marginBottom: 6 }}><strong>👶 Children's Privacy</strong></p>
              <p style={{ marginBottom: 10 }}>Folio does not knowingly collect any data from anyone, including children under 13. Since no data is collected at all, no special provisions are necessary.</p>
              
              <p style={{ fontSize: '.85em', color: 'var(--text2)' }}>If you have questions, use the feedback form or visit bio.link/ferisooo</p>
            </div>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-confirm" onClick={() => setPrivacyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {supportModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setSupportModal(false); }}>
          <div className="modal-box" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-title">💖 Support Folio</div>
            <div className="modal-msg" style={{ textAlign: 'center', fontSize: '.92em', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Folio is built with love by a solo creator. Your support helps keep the app growing.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); window.open('https://bio.link/ferisooo', '_system'); }} style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'linear-gradient(135deg,var(--btn1),var(--btn2))', color: 'white', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center', boxShadow: '0 3px 12px rgba(111,175,143,.25)' }}>
                  🌿 Visit Creator — bio.link/ferisooo
                </a>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); window.open('https://bio.link/ferisooo', '_system'); }} style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'var(--card-bg)', border: '1.5px solid var(--btn1)', color: 'var(--btn1)', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center' }}>
                  💖 Subscribe & Support Monthly
                </a>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); window.open('https://bio.link/ferisooo', '_system'); }} style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'var(--card-bg)', border: '1.5px solid var(--card-border)', color: 'var(--text2)', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center' }}>
                  ☕ Buy Me a Coffee
                </a>
              </div>
              <p style={{ marginTop: 14, fontSize: '.82em', color: 'var(--text2)' }}>Every bit helps — even just sharing the app with a friend 🌱</p>
            </div>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-confirm" onClick={() => setSupportModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
