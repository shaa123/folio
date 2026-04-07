import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "../api";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);
  const [flipAnim, setFlipAnim] = useState('');
  const [editText, setEditText] = useState('');
  const touchStart = useRef(null);

  useEffect(() => {
    api.loadNotes().then(n => { setNotes(n || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (notes.length > 0 && pageIdx < notes.length) {
      setEditText(notes[pageIdx].text || '');
    } else {
      setEditText('');
    }
  }, [pageIdx, notes.length]);

  const saveNotes = useCallback((updated) => {
    setNotes(updated);
    api.saveNotes(updated);
  }, []);

  const saveCurrentPage = useCallback(() => {
    if (notes.length === 0) return;
    const updated = [...notes];
    updated[pageIdx] = { ...updated[pageIdx], text: editText, updatedAt: new Date().toISOString() };
    saveNotes(updated);
  }, [notes, pageIdx, editText, saveNotes]);

  const handleTextChange = (val) => { setEditText(val); };
  const handleBlur = () => { saveCurrentPage(); };

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

  const goNext = () => { if (pageIdx < notes.length - 1) animateFlip('forward', pageIdx + 1); };
  const goPrev = () => { if (pageIdx > 0) animateFlip('backward', pageIdx - 1); };

  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  if (loading) return <div className="notes-page"><div className="notebook-empty"><div>Loading...</div></div></div>;

  const currentNote = notes[pageIdx];
  const dateStr = currentNote
    ? new Date(currentNote.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

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
      <div className="notebook-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
        <button className="notebook-nav-btn" onClick={goPrev} disabled={pageIdx === 0}>← Prev</button>
        <div className="notebook-nav-center">
          <button className="notebook-delete-btn" onClick={deletePage} title="Delete this page">🗑️</button>
          <button className="notebook-add-btn" onClick={addPage} title="Add new page">+</button>
        </div>
        <button className="notebook-nav-btn" onClick={goNext} disabled={pageIdx >= notes.length - 1}>Next →</button>
      </div>
    </div>
  );
}
