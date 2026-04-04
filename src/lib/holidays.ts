/**
 * 日本の祝日判定（2026年）
 * 保育園の休園日 = 土日 + 祝日
 */

/** 2026年の祝日リスト */
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
};

/** 祝日名を返す（祝日でなければnull） */
export function getHolidayName(dateStr: string): string | null {
  return HOLIDAYS_2026[dateStr] ?? null;
}

/** 保育園が休みかどうか（土日 or 祝日） */
export function isNurseryHoliday(date: Date, dateStr: string): boolean {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return true; // 土日
  if (HOLIDAYS_2026[dateStr]) return true; // 祝日
  return false;
}
