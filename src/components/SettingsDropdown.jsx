import { useState, useEffect } from "react";

export default function SettingsDropdown({ open, pos, theme, mode, onTheme, onMode, onLock, lockStatus, onFeedback, onPrivacy, onExport, onImport, orientation, onOrientation }) {
  const [sections, setSections] = useState({ display: false, theme: false, security: false, feedback: false, privacy: false, backup: false });
  const toggle = k => setSections(s => ({ ...s, [k]: !s[k] }));
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
