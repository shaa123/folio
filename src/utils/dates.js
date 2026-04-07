export function getStartOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function safeDateParse(entry) {
  const d = new Date(entry.dateISO || entry.date);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function getEntriesForRange(entries, startDate, endDate) {
  return entries.filter(e => {
    const d = safeDateParse(e);
    return d >= startDate && d <= endDate;
  });
}

export function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
