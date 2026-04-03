/**
 * Google Calendar のカレンダーID設定
 *
 * セットアップ手順:
 * 1. tomohisa.moeka@gmail.com で Google Calendar を開く
 * 2. 以下の4つのカレンダーを作成:
 *    - 「送迎」（青）
 *    - 「在宅」（緑）
 *    - 「ゴミ」（灰）
 *    - 「家族」（赤）
 * 3. 各カレンダーの設定 → 「特定のユーザーとの共有」で
 *    サービスアカウントのメールアドレスを追加（予定の変更権限）
 * 4. 各カレンダーのIDを .env.local に設定
 */

export function getCalendarIds() {
  return {
    pickup: process.env.GOOGLE_CALENDAR_PICKUP_ID || "",
    wfh: process.env.GOOGLE_CALENDAR_WFH_ID || "",
    trash: process.env.GOOGLE_CALENDAR_TRASH_ID || "",
    family: process.env.GOOGLE_CALENDAR_FAMILY_ID || "",
  };
}

/** Google Calendar イベントの色ID */
export const COLOR_IDS = {
  papa: "9",      // 青紫
  mama: "4",      // ピンク
  unset: "5",     // 黄色（未調整）
  wfh: "10",      // 緑
  trash: "8",     // 灰色
  family: "11",   // 赤
} as const;
