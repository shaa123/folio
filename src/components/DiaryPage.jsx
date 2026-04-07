import { useState } from "react";
import { CAUSE_TAGS } from "../constants";
import { safeDateParse } from "../utils/dates";
import EmojiSlider from "./common/EmojiSlider";

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

export default function DiaryPage({
  entries, emoji, setEmoji, title, setTitle, content, setContent,
  causeTags, setCauseTags, search, setSearch, openBooks, setOpenBooks,
  onSave, onDelete, onBookmark, onLock, onToggleBook, onCloseBook,
  entriesByDate, sortedDates, theme,
}) {
  return (
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
        <button className="save-btn" onClick={onSave}>Save this thought? ✦</button>
      </div>

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
                openBooks={openBooks} onToggleBook={onToggleBook} onCloseBook={onCloseBook}
                onDelete={onDelete} onBookmark={onBookmark} onLock={onLock}
                searchTerm={search}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
