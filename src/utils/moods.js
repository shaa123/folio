import { MOOD_CATEGORIES } from "../constants";

export function getEmojiCategory(emoji) {
  if (!emoji) return null;
  for (const [key, cat] of Object.entries(MOOD_CATEGORIES)) {
    if (cat.emojis.includes(emoji)) return { key, ...cat };
  }
  return { key: 'other', label: 'Other', color: '#81c784', css: 'other' };
}
