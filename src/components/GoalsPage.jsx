import { useState, useEffect } from "react";
import { GOAL_TYPES } from "../constants";
import * as api from "../api";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [goalType, setGoalType] = useState('daily');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedStack, setExpandedStack] = useState(null);

  useEffect(() => {
    api.loadGoals().then(g => { setGoals(g || []); setLoading(false); });
  }, []);

  const saveGoals = g => { api.saveGoals(g); setGoals(g); };

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
    if (loading) return;
    const lastReset = localStorage.getItem('folioLastDailyReset');
    const today = new Date().toDateString();
    if (lastReset !== today) {
      saveGoals(goals.map(g => g.type === 'daily' ? { ...g, done: false, completedAt: null } : g));
      localStorage.setItem('folioLastDailyReset', today);
    }
  }, [loading]);

  const byType = type => goals.filter(g => g.type === type);
  const completedCount = goals.filter(g => g.done).length;
  const totalActive = goals.length;
  const pct = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

  if (loading) return <div className="mood-page"><div className="mood-card"><div>Loading...</div></div></div>;

  return (
    <div className="mood-page">
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

      {GOAL_TYPES.map(t => {
        const items = byType(t.key);
        const doneCount = items.filter(g => g.done).length;
        const isExpanded = expandedStack === t.key;
        const stackPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

        return (
          <div key={t.key} className="goal-stack" onClick={() => setExpandedStack(isExpanded ? null : t.key)} style={{ cursor: 'pointer' }}>
            <div className="mood-card" style={{ marginBottom: 0, borderRadius: isExpanded && items.length > 0 ? '18px 18px 0 0' : '18px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.6em' }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text1)', fontWeight: 700, fontSize: '1.1em' }}>{t.label} Goals</div>
                  <div style={{ color: 'var(--text2)', fontSize: '.82em' }}>{items.length === 0 ? 'No goals yet' : `${doneCount}/${items.length} complete · ${stackPct}%`}</div>
                </div>
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
