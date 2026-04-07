import { useRef, useEffect } from "react";
import { EMOJIS } from "../../constants";

export default function EmojiSlider({ selected, onSelect }) {
  const scrollRef = useRef();
  const scrollBy = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 140, behavior: 'smooth' });
    }
  };
  useEffect(() => {
    if (selected && scrollRef.current) {
      const idx = EMOJIS.indexOf(selected);
      if (idx >= 0) {
        const child = scrollRef.current.children[idx];
        if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selected]);
  return (
    <div className="emoji-slider-wrap">
      <button className="emoji-slider-arrow emoji-slider-arrow-left" onClick={() => scrollBy(-1)} aria-label="Scroll left">‹</button>
      <div className="emoji-slider" ref={scrollRef}>
        {EMOJIS.map((em, i) => (
          <div key={i} className={`emoji-slider-item ${selected === em ? 'selected' : ''}`} onClick={() => onSelect(selected === em ? null : em)}>{em}</div>
        ))}
      </div>
      <button className="emoji-slider-arrow emoji-slider-arrow-right" onClick={() => scrollBy(1)} aria-label="Scroll right">›</button>
    </div>
  );
}
