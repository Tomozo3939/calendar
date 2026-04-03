/** YYYY-MM-DD 形式の文字列を返す */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → Date */
export function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 曜日名（短縮） */
const WEEKDAY_SHORT = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function getWeekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

/** 今日を含む週の月曜日を返す */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 日曜は前の月曜
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 指定日から n 日分の日付配列を返す */
export function getDays(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** 今日かどうか */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** 月の全日付を返す（カレンダー表示用：前月末・翌月頭を含む6週分） */
export function getCalendarMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const monday = getMonday(firstDay);
  return getDays(monday, 42); // 6週 × 7日
}

/** 日本の祝日かどうか（簡易版） */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
