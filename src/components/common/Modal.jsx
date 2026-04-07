import { useState } from "react";

export default function Modal({ open, title, message, onConfirm, onCancel, children }) {
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
