import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "./api";
import { safeDateParse } from "./utils/dates";
import "./styles.css";

import Modal from "./components/common/Modal";
import SettingsDropdown from "./components/SettingsDropdown";
import DiaryPage from "./components/DiaryPage";
import MoodPage from "./components/MoodPage";
import GoalsPage from "./components/GoalsPage";
import NotesPage from "./components/NotesPage";
import WellnessPage from "./components/WellnessPage";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [theme, setTheme] = useState('default');
  const [mode, setMode] = useState('light');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ top: 0, right: 0 });
  const [emoji, setEmoji] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [causeTags, setCauseTags] = useState([]);
  const [search, setSearch] = useState('');
  const [openBooks, setOpenBooks] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({ open: false, idx: null });
  const [lockModal, setLockModal] = useState(false);
  const [unlockModal, setUnlockModal] = useState({ open: false, idx: null });
  const [lockPw, setLockPw] = useState('');
  const [lockPwConfirm, setLockPwConfirm] = useState('');
  const [unlockPw, setUnlockPw] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, msg: '', title: 'Oops' });
  const [hasPassword, setHasPassword] = useState(false);

  const showAlert = (msg, title) => setAlertModal({ open: true, msg, title: title || 'Oops' });

  // Load data from Rust backend on mount
  useEffect(() => {
    Promise.all([
      api.loadEntries(),
      api.loadSettings(),
      api.hasMasterPassword(),
    ]).then(([loadedEntries, settings, hasPw]) => {
      setEntries(loadedEntries || []);
      setTheme(settings?.theme || 'default');
      setMode(settings?.mode || 'light');
      setHasPassword(hasPw);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });
  }, []);

  // Apply theme/mode to body
  useEffect(() => {
    const themeClass = theme === 'forest' ? 'forest-theme' : theme === 'blossom' ? 'blossom-theme' : '';
    document.body.className = [themeClass, mode === 'dark' ? 'dark-mode' : ''].join(' ').trim();
  }, [theme, mode]);

  const saveEntries = useCallback(e => {
    setEntries(e);
    api.saveEntries(e);
  }, []);

  const handleTheme = t => {
    setTheme(t);
    api.saveSettings({ theme: t, mode, orientation: orientationPref });
  };
  const handleMode = m => {
    setMode(m);
    api.saveSettings({ theme, mode: m, orientation: orientationPref });
  };

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
    if (!hasPassword) { showAlert('Please set a master password first from Settings → Security'); return; }
    if (!entries[idx].locked) {
      const next = [...entries]; next[idx] = { ...next[idx], locked: true };
      saveEntries(next);
    } else {
      setUnlockModal({ open: true, idx });
    }
  };

  const submitUnlock = async () => {
    const ok = await api.verifyPassword(unlockPw);
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
      await api.setMasterPassword(lockPw);
      setHasPassword(true);
      setLockPw(''); setLockPwConfirm(''); setLockModal(false);
      showAlert('✅ Master password set! You can lock individual entries by clicking 🔓', 'Success');
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
  const [orientationPref, setOrientationPref] = useState('auto');
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
  const handleOrientation = o => {
    setOrientationPref(o);
    api.saveSettings({ theme, mode, orientation: o });
  };

  // Group entries by date
  const entriesByDate = {};
  entries.forEach((entry, index) => {
    const d = safeDateParse(entry);
    const key = d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (!entriesByDate[key]) entriesByDate[key] = { date: d, entries: [] };
    entriesByDate[key].entries.push({ ...entry, originalIndex: index });
  });
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => entriesByDate[b].date - entriesByDate[a].date);

  // Search auto-open matching books
  const searchRef = useRef(search);
  useEffect(() => {
    const prevSearch = searchRef.current;
    searchRef.current = search;
    if (!search.trim()) {
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

  const lockStatus = hasPassword ? 'Change Password' : 'Journal Password';

  // Export / Import via Tauri backend + native file dialog
  const exportBackup = async () => {
    try {
      const backup = await api.exportBackup();
      // Use Blob download approach (works in Tauri webview)
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'folio-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showAlert('📦 Backup exported! Keep this file somewhere safe.', 'Exported');
    } catch (err) {
      showAlert('Failed to export backup: ' + err);
    }
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
        await api.importBackup(data);
        // Reload all data
        const [loadedEntries, settings] = await Promise.all([
          api.loadEntries(),
          api.loadSettings(),
        ]);
        setEntries(loadedEntries || []);
        if (settings?.theme) setTheme(settings.theme);
        if (settings?.mode) setMode(settings.mode);
        showAlert('✅ Backup restored! Your journal data has been imported.', 'Restored');
      } catch (err) {
        showAlert('Failed to read backup file. Make sure it\'s a valid Folio backup.');
      }
    };
    input.click();
  };

  const submitFeedback = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScXoWPkP_kHZKiHGN5VSy5QNGUHBDFyWI1OU2yL1ddsjK7zwA/viewform', '_blank');
    setFeedbackModal(false);
  };

  if (loading) {
    return (
      <div id="folio-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text1)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: 8 }}>🌿</div>
          <div>Loading Folio...</div>
        </div>
      </div>
    );
  }

  return (
    <div id="folio-root" className={isLandscape ? 'landscape' : 'portrait'}>
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

        {settingsOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}
            onClick={() => setSettingsOpen(false)} />
        )}

        <div className="heart-divider">{theme === 'blossom' ? '🌸' : theme === 'forest' ? '🍂' : '🌿'}</div>

        <div className="page-nav">
          {[['Diary',1],['Moods',2],['Goals',3],['Notes',4],['Wellness',5]].map(([label, pg]) => (
            <button key={pg} className={`nav-page ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{label}</button>
          ))}
        </div>

        {page === 1 && (
          <DiaryPage
            entries={entries} emoji={emoji} setEmoji={setEmoji}
            title={title} setTitle={setTitle} content={content} setContent={setContent}
            causeTags={causeTags} setCauseTags={setCauseTags}
            search={search} setSearch={setSearch}
            openBooks={openBooks} setOpenBooks={setOpenBooks}
            onSave={handleSave} onDelete={handleDelete}
            onBookmark={handleBookmark} onLock={handleLock}
            onToggleBook={toggleBook} onCloseBook={closeBook}
            entriesByDate={entriesByDate} sortedDates={sortedDates}
            theme={theme}
          />
        )}

        {page === 2 && <MoodPage entries={entries} />}
        {page === 3 && <GoalsPage />}
        {page === 4 && <NotesPage />}
        {page === 5 && <WellnessPage />}
      </div>

      <Modal open={deleteModal.open} title="Delete Entry?" message="Are you sure you want to delete this journal entry? This action cannot be undone."
        onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, idx: null })} />

      {lockModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setLockModal(false); }}>
          <div className="modal-box">
            <div className="modal-title">🔒 Set Master Password</div>
            <div className="modal-msg">Create a master password to lock/unlock individual entries.</div>
            <input className="modal-input" type="password" value={lockPw} onChange={e => setLockPw(e.target.value)} placeholder="Enter password (min 4 characters)" onKeyDown={e => e.key === 'Enter' && document.getElementById('lockPwConfirmInput')?.focus()} />
            <input id="lockPwConfirmInput" className="modal-input" type="password" value={lockPwConfirm} onChange={e => setLockPwConfirm(e.target.value)} placeholder="Confirm password" onKeyDown={e => e.key === 'Enter' && saveMasterPassword()} />
            <div className="modal-btns">
              <button className="modal-btn modal-btn-cancel" onClick={() => { setLockModal(false); setLockPw(''); setLockPwConfirm(''); }}>Cancel</button>
              <button className="modal-btn modal-btn-confirm" onClick={saveMasterPassword}>Set Password</button>
            </div>
          </div>
        </div>
      )}

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

      <Modal open={alertModal.open} title={alertModal.title || 'Oops'} message={alertModal.msg}
        onConfirm={() => setAlertModal({ open: false, msg: '', title: 'Oops' })} />

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

      {privacyModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setPrivacyModal(false); }}>
          <div className="modal-box" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-title">📄 Privacy Policy</div>
            <div className="modal-msg" style={{ textAlign: 'left', fontSize: '.9em', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 10 }}><strong>Last updated:</strong> February 2026</p>
              <p style={{ marginBottom: 10 }}>Folio is a 100% offline personal journal app. Your privacy is not just a feature — it is the foundation of this app.</p>
              <p style={{ marginBottom: 6 }}><strong>📱 Data Storage</strong></p>
              <p style={{ marginBottom: 10 }}>All of your data — journal entries, mood logs, goals, notes, wellness screening answers, and app settings — is stored exclusively on your device. Nothing is stored on any server.</p>
              <p style={{ marginBottom: 6 }}><strong>🔒 Encryption</strong></p>
              <p style={{ marginBottom: 10 }}>If you set a master password, individual diary entries are encrypted using AES-256-GCM with PBKDF2 key derivation (600,000 iterations). Your password is never stored — only a salted cryptographic hash.</p>
              <p style={{ marginBottom: 6 }}><strong>🚫 What We Do NOT Collect</strong></p>
              <p style={{ marginBottom: 10 }}>Folio does not collect, transmit, or share any personal information of any kind. There are zero analytics trackers, zero advertisements, and zero third-party SDKs in this app.</p>
              <p style={{ marginBottom: 6 }}><strong>🗑️ Deleting Your Data</strong></p>
              <p style={{ marginBottom: 10 }}>You can delete individual entries, or remove all app data by deleting the Folio data directory on your system. Since no data exists on any server, deletion is permanent.</p>
              <p style={{ fontSize: '.85em', color: 'var(--text2)' }}>If you have questions, use the feedback form or visit bio.link/ferisooo</p>
            </div>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-confirm" onClick={() => setPrivacyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {supportModal && (
        <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) setSupportModal(false); }}>
          <div className="modal-box" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-title">💖 Support Folio</div>
            <div className="modal-msg" style={{ textAlign: 'center', fontSize: '.92em', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Folio is built with love by a solo creator. Your support helps keep the app growing.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'linear-gradient(135deg,var(--btn1),var(--btn2))', color: 'white', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center', boxShadow: '0 3px 12px rgba(111,175,143,.25)' }}>
                  🌿 Visit Creator — bio.link/ferisooo
                </a>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'var(--card-bg)', border: '1.5px solid var(--btn1)', color: 'var(--btn1)', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center' }}>
                  💖 Subscribe & Support Monthly
                </a>
                <a href="https://bio.link/ferisooo" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px 20px', borderRadius: 16, background: 'var(--card-bg)', border: '1.5px solid var(--card-border)', color: 'var(--text2)', textDecoration: 'none', fontFamily: "'Lora',serif", fontSize: '.95em', textAlign: 'center' }}>
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
