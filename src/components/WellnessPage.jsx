import { useState } from "react";
import { SCORE_OPTIONS, DEPRESSION_POOL, ANXIETY_POOL, STRESS_POOL } from "../constants";
import { pickQuestions, generateExpandedSummary } from "../utils/wellness";
import SpiritCharacter from "./common/SpiritCharacter";

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

function FullCheckInTab() {
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const startSession = () => {
    const depQs = pickQuestions(DEPRESSION_POOL, 10);
    const anxQs = pickQuestions(ANXIETY_POOL, 7);
    const strQs = pickQuestions(STRESS_POOL, 4);

    const combined = [
      ...depQs.map(q => ({ q, type: 'depression' })),
      ...anxQs.map(q => ({ q, type: 'anxiety' })),
      ...strQs.map(q => ({ q, type: 'stress' })),
    ];
    // Fisher-Yates shuffle
    const shuffled = [...combined];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

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

        const allSections = [];
        allSections.push({
          title: "Full Check-in Results",
          text: `Depression: ${depResult.score}/${depResult.maxScore} — ${depResult.sev.emoji} ${depResult.sev.label}\nAnxiety: ${anxResult.score}/${anxResult.maxScore} — ${anxResult.sev.emoji} ${anxResult.sev.label}\nStress: ${strResult.score}/${strResult.maxScore} — ${strResult.sev.emoji} ${strResult.sev.label}`
        });

        [depResult, anxResult, strResult].forEach(r => {
          r.sections.forEach(s => {
            if (s.title && !s.title.includes('Results') && !s.title.includes('Disclaimer') && s.title !== '') {
              allSections.push(s);
            }
          });
        });

        const worst = [depResult.sev.level, anxResult.sev.level, strResult.sev.level];
        const isHeavy = worst.some(l => l === 'severe' || l === 'moderately_severe');
        const closing = isHeavy
          ? "Thank you for being honest with yourself today. That takes real courage. Please remember — these scores are a snapshot, not a sentence. Things can get better with the right support. 🌱"
          : "Thanks for doing a full check-in. Self-awareness across all three areas — mood, worry, and stress — is incredibly powerful. Come back anytime. 🌿";
        allSections.push({ title: "", text: closing });

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

export default function WellnessPage() {
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
