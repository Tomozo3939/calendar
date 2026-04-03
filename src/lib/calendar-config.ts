/**
 * Google Calendar のカレンダーID設定
 *
 * カレンダー構成:
 * - 送迎: 保育園の送り迎え
 * - ゴミ: ゴミの日
 * - 家族: 家族共通の予定
 * - 川村: オーナーの予定（在宅勤務含む）
 * - 萌香: 奥さんの予定
 */

export function getCalendarIds() {
  return {
    pickup: process.env.GOOGLE_CALENDAR_PICKUP_ID || "",
    trash: process.env.GOOGLE_CALENDAR_TRASH_ID || "",
    family: process.env.GOOGLE_CALENDAR_FAMILY_ID || "",
    kawamura: process.env.GOOGLE_CALENDAR_KAWAMURA_ID || "",
    moeka: process.env.GOOGLE_CALENDAR_MOEKA_ID || "",
  };
}

export type CalendarKey = keyof ReturnType<typeof getCalendarIds>;

/** Google Calendar イベントの色ID */
export const COLOR_IDS = {
  papa: "9",      // 青紫
  mama: "4",      // ピンク
  unset: "5",     // 黄色（未調整）
  kawamura: "9",  // 青
  moeka: "4",     // ピンク
  trash: "8",     // 灰色
  family: "11",   // 赤
} as const;
