import { MOOD_CATEGORIES, CAUSE_TAGS } from "../constants";
import { getEmojiCategory } from "../utils/moods";
import { getStartOfWeek, getEndOfDay, getEntriesForRange, safeDateParse } from "../utils/dates";

export default function MoodPage({ entries }) {
  const today = new Date();
  const weekStart = getStartOfWeek(today);
  const weekEntries = getEntriesForRange(entries, weekStart, getEndOfDay(today));
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const dayData = dayNames.map((name, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    const de = getEntriesForRange(entries, d, getEndOfDay(d));
    const isToday = d.toDateString() === today.toDateString();
    const isFuture = d > today;
    return { name, entries: de, isToday, isFuture, date: d };
  });

  const moodCounts = {};
  weekEntries.forEach(e => {
    if (e.emoji) moodCounts[e.emoji] = (moodCounts[e.emoji] || 0) + 1;
  });
  const topEmoji = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0];

  const catCounts = {};
  weekEntries.forEach(e => {
    const cat = getEmojiCategory(e.emoji);
    if (cat) catCounts[cat.key] = (catCounts[cat.key] || 0) + 1;
  });
  const sortedCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
  const totalMoods = sortedCats.reduce((s,[,c]) => s+c, 0);

  const domKey = sortedCats[0]?.[0];
  const domCat = domKey ? MOOD_CATEGORIES[domKey] : null;

  const journaledDays = new Set(weekEntries.map(e => safeDateParse(e).toDateString()));
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (journaledDays.has(d.toDateString())) streak++; else break;
  }

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

  const causeInsights = sortedCats.filter(([key]) => causeByCat[key] && Object.keys(causeByCat[key]).length > 0).map(([key]) => {
    const cat = MOOD_CATEGORIES[key] || { label: key, emojis: ['📝'] };
    const causes = Object.entries(causeByCat[key]).sort((a,b) => b[1]-a[1]);
    return { catKey: key, catLabel: cat.label, catEmoji: cat.emojis[0], causes };
  });

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

      <div className="mood-card mood-card-gradient-3">
        <div className="mood-card-header"><span className="mood-card-icon">📊</span><span className="mood-card-title">Week Stats</span></div>
        <div className="mood-stats-grid">
          <div className="summary-stat"><span className="summary-stat-icon">📝</span><span className="summary-stat-text">Entries</span><span className="summary-stat-value">{weekEntries.length}</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">📅</span><span className="summary-stat-text">Days</span><span className="summary-stat-value">{journaledDays.size}/7</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">{domCat?.emojis[0] || '📝'}</span><span className="summary-stat-text">Top</span><span className="summary-stat-value">{domCat?.label || '—'}</span></div>
          <div className="summary-stat"><span className="summary-stat-icon">🔥</span><span className="summary-stat-text">Streak</span><span className="summary-stat-value">{streak}d</span></div>
        </div>
      </div>

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
