export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQuestions(pool, n) {
  const selfHarmItems = pool.filter(q => q.selfHarm);
  const otherItems = pool.filter(q => !q.selfHarm);
  const shuffledOther = shuffleArray(otherItems);

  let selected;
  if (selfHarmItems.length > 0 && n > 3) {
    const shItem = selfHarmItems[Math.floor(Math.random() * selfHarmItems.length)];
    selected = [shItem, ...shuffledOther.slice(0, n - 1)];
  } else {
    selected = shuffleArray(pool).slice(0, n);
  }
  return shuffleArray(selected);
}

export function scoreSeverity(score, maxScore, type) {
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

export function generateExpandedSummary(questions, answers, type) {
  const score = answers.reduce((s, a) => s + a, 0);
  const maxScore = questions.length * 3;
  const sev = scoreSeverity(score, maxScore, type);
  const labels = { depression: 'Depression', anxiety: 'Anxiety', stress: 'Stress' };

  const sections = [];

  sections.push({
    title: "Your Results",
    text: `${labels[type]} Score: ${score}/${maxScore} — ${sev.emoji} ${sev.label}\nBased on ${questions.length} items from ${[...new Set(questions.map(q => q.source))].join(', ')}`
  });

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

  const selfHarmQs = questions.filter(q => q.selfHarm);
  if (selfHarmQs.length > 0) {
    const selfHarmScored = selfHarmQs.some((q) => {
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

  const heavy = ['severe', 'moderately_severe'].includes(sev.level);
  const closing = heavy
    ? "Thank you for being honest with yourself today. That takes real courage. Please remember — these scores are a snapshot, not a sentence. Things can get better with the right support. 🌱"
    : sev.level === 'minimal' || sev.level === 'normal'
      ? "You're in a good place right now. Keep checking in with yourself — self-awareness is one of the most powerful things you can do for your mental health. ✨"
      : "Thanks for taking the time to check in. Awareness is the first step. Come back anytime — I'll be here. 🌿";
  sections.push({ title: "", text: closing });

  sections.push({
    title: "📋 Important Disclaimer",
    text: `This screening uses items from ${[...new Set(questions.map(q => q.source))].join(', ')} — all clinically validated, public domain instruments. However, this is NOT a diagnosis. Only a qualified mental health professional can diagnose depression, anxiety, or stress disorders. These results are for self-awareness only.\n\nAll your answers stay on your device. Nothing is sent anywhere.`
  });

  return { sections, score, maxScore, sev };
}
