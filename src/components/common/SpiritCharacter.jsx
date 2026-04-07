import { useState, useEffect } from "react";

export default function SpiritCharacter({ thinking }) {
  const [eyeOpen, setEyeOpen] = useState(true);

  useEffect(() => {
    const blink = () => {
      setEyeOpen(false);
      setTimeout(() => setEyeOpen(true), 150);
    };
    const id = setInterval(blink, 2000 + Math.random() * 1500);
    return () => clearInterval(id);
  }, []);

  const ey = eyeOpen ? 5.5 : 1;

  return (
    <div className="spirit-wrap">
      <div className="spirit-body">
        <svg className="spirit-svg" width="120" height="160" viewBox="0 0 120 160">
          <defs>
            <radialGradient id="ghostG" cx="45%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity=".97"/>
              <stop offset="40%" stopColor="#e6f5ff" stopOpacity=".9"/>
              <stop offset="75%" stopColor="#cce8ff" stopOpacity=".6"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity=".2"/>
            </radialGradient>
            <radialGradient id="ghostGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity=".15"/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
            </radialGradient>
            <filter id="ghostShadow">
              <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="var(--accent)" floodOpacity=".3"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.3"/>
            </filter>
          </defs>
          <ellipse cx="60" cy="70" rx="52" ry="58" fill="url(#ghostGlow)"/>
          <path d="M58 12 Q52 2, 56 -4 Q60 -8, 62 -2 Q66 6, 60 12" fill="url(#ghostG)" opacity=".7" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".2"/>
          <path d="M55 18 Q48 6, 54 -2 Q58 -6, 60 0 Q64 8, 58 18" fill="url(#ghostG)" opacity=".5"/>
          <ellipse cx="60" cy="65" rx="40" ry="45" fill="url(#ghostG)" filter="url(#ghostShadow)" stroke="var(--accent)" strokeWidth=".8" strokeOpacity=".15"/>
          <ellipse cx="45" cy="55" rx="12" ry="2" fill="white" opacity=".08" transform="rotate(-8 45 55)"/>
          <ellipse cx="70" cy="48" rx="8" ry="1.5" fill="white" opacity=".06" transform="rotate(5 70 48)"/>
          <circle cx="38" cy="60" r="1" fill="white" opacity=".2"/>
          <circle cx="75" cy="55" r=".8" fill="white" opacity=".15"/>
          <circle cx="50" cy="80" r=".7" fill="white" opacity=".12"/>
          <circle cx="68" cy="78" r=".9" fill="white" opacity=".13"/>
          <ellipse cx="40" cy="72" rx="8" ry="5" fill="#ffb0b0" opacity=".18"/>
          <ellipse cx="80" cy="72" rx="8" ry="5" fill="#ffb0b0" opacity=".18"/>
          <ellipse cx="46" cy="62" rx="6" ry={ey} fill="#2A2A3A" opacity=".85"/>
          <ellipse cx="74" cy="62" rx="6" ry={ey} fill="#2A2A3A" opacity=".85"/>
          {eyeOpen && <>
            <circle cx="48.5" cy="59" r="2.5" fill="white" opacity=".95"/>
            <circle cx="76.5" cy="59" r="2.5" fill="white" opacity=".95"/>
            <circle cx="44" cy="63" r="1" fill="white" opacity=".5"/>
            <circle cx="72" cy="63" r="1" fill="white" opacity=".5"/>
          </>}
          {thinking ? (
            <ellipse cx="60" cy="80" rx="3.5" ry="3" fill="#2A2A3A" opacity=".3"/>
          ) : (
            <path d="M50 78 Q60 87, 70 78" fill="none" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
          )}
          <ellipse cx="22" cy="68" rx="7" ry="10" fill="url(#ghostG)" stroke="var(--accent)" strokeWidth=".5" strokeOpacity=".12" transform="rotate(-15 22 68)"/>
          <ellipse cx="98" cy="68" rx="7" ry="10" fill="url(#ghostG)" stroke="var(--accent)" strokeWidth=".5" strokeOpacity=".12" transform="rotate(15 98 68)"/>
          <path d="M35 105 Q42 120, 38 135 Q36 142, 40 148 Q43 152, 46 148" fill="url(#ghostG)" opacity=".6" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".1"/>
          <path d="M60 108 Q58 125, 62 138 Q64 145, 60 150" fill="url(#ghostG)" opacity=".5" stroke="var(--accent)" strokeWidth=".3" strokeOpacity=".08"/>
          <path d="M85 105 Q78 120, 82 135 Q84 142, 80 148 Q77 152, 74 148" fill="url(#ghostG)" opacity=".6" stroke="var(--accent)" strokeWidth=".4" strokeOpacity=".1"/>
          <text x="8" y="45" fontSize="8" opacity=".3" fill="var(--accent)">✧</text>
          <text x="105" y="40" fontSize="6" opacity=".25" fill="var(--accent)">✦</text>
          <text x="15" y="100" fontSize="5" opacity=".2" fill="var(--accent)">✧</text>
        </svg>
      </div>
    </div>
  );
}
