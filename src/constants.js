export const EMOJIS = [
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

export const MOOD_CATEGORIES = {
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

export const CAUSE_TAGS = [
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

export const GOAL_TYPES = [
  { key: 'daily', label: 'Daily', icon: '☀️', color: '#66bb6a' },
  { key: 'weekly', label: 'Weekly', icon: '📅', color: '#42a5f5' },
  { key: 'yearly', label: 'Yearly', icon: '🌟', color: '#fdd835' },
];

export const SCORE_OPTIONS = [
  { value: 0, label: "Not at all", emoji: "🟢" },
  { value: 1, label: "Several days", emoji: "🟡" },
  { value: 2, label: "More than half the days", emoji: "🟠" },
  { value: 3, label: "Nearly every day", emoji: "🔴" },
];

// ============================================================
// DEPRESSION ITEMS POOL (~25 items from PHQ-9, CESD-R, DASS-21)
// ============================================================
export const DEPRESSION_POOL = [
  { id: 'phq1', text: "Little interest or pleasure in doing things", source: 'PHQ-9', domain: 'anhedonia', selfHarm: false },
  { id: 'phq2', text: "Feeling down, depressed, or hopeless", source: 'PHQ-9', domain: 'mood', selfHarm: false },
  { id: 'phq3', text: "Trouble falling or staying asleep, or sleeping too much", source: 'PHQ-9', domain: 'sleep', selfHarm: false },
  { id: 'phq4', text: "Feeling tired or having little energy", source: 'PHQ-9', domain: 'fatigue', selfHarm: false },
  { id: 'phq5', text: "Poor appetite or overeating", source: 'PHQ-9', domain: 'appetite', selfHarm: false },
  { id: 'phq6', text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", source: 'PHQ-9', domain: 'worthlessness', selfHarm: false },
  { id: 'phq7', text: "Trouble concentrating on things, such as reading or watching TV", source: 'PHQ-9', domain: 'concentration', selfHarm: false },
  { id: 'phq8', text: "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless", source: 'PHQ-9', domain: 'psychomotor', selfHarm: false },
  { id: 'phq9', text: "Thoughts that you would be better off dead, or of hurting yourself", source: 'PHQ-9', domain: 'selfharm', selfHarm: true },
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
export const ANXIETY_POOL = [
  { id: 'gad1', text: "Feeling nervous, anxious, or on edge", source: 'GAD-7', domain: 'nervousness' },
  { id: 'gad2', text: "Not being able to stop or control worrying", source: 'GAD-7', domain: 'worry' },
  { id: 'gad3', text: "Worrying too much about different things", source: 'GAD-7', domain: 'worry' },
  { id: 'gad4', text: "Trouble relaxing", source: 'GAD-7', domain: 'tension' },
  { id: 'gad5', text: "Being so restless that it's hard to sit still", source: 'GAD-7', domain: 'restlessness' },
  { id: 'gad6', text: "Becoming easily annoyed or irritable", source: 'GAD-7', domain: 'irritability' },
  { id: 'gad7', text: "Feeling afraid, as if something awful might happen", source: 'GAD-7', domain: 'fear' },
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
export const STRESS_POOL = [
  { id: 'dasss1', text: "I found it hard to wind down", source: 'DASS-21', domain: 'tension' },
  { id: 'dasss2', text: "I tended to over-react to situations", source: 'DASS-21', domain: 'overreaction' },
  { id: 'dasss3', text: "I felt that I was using a lot of nervous energy", source: 'DASS-21', domain: 'arousal' },
  { id: 'dasss4', text: "I found myself getting agitated", source: 'DASS-21', domain: 'agitation' },
  { id: 'dasss5', text: "I found it difficult to relax", source: 'DASS-21', domain: 'tension' },
  { id: 'dasss6', text: "I was intolerant of anything that kept me from getting on with what I was doing", source: 'DASS-21', domain: 'impatience' },
  { id: 'dasss7', text: "I felt that I was rather touchy", source: 'DASS-21', domain: 'irritability' },
];
