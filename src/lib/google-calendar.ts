import { google } from "googleapis";

/**
 * Google Calendar API クライアント
 *
 * 認証方式: サービスアカウント
 * - 家族用Googleアカウント(tomohisa.moeka@gmail.com)のカレンダーに
 *   サービスアカウントを共有設定で追加して使う
 * - OAuth不要でサーバーサイドから直接操作できる
 */

function getAuth() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getAuth() });
}

/** カレンダー一覧を取得 */
export async function listCalendars() {
  const cal = getCalendarClient();
  const res = await cal.calendarList.list();
  return res.data.items || [];
}

/** 指定期間のイベントを取得 */
export async function listEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const cal = getCalendarClient();
  const res = await cal.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items || [];
}

/** イベントを作成 */
export async function createEvent(
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    date: string; // YYYY-MM-DD（終日イベント）
    colorId?: string;
  }
) {
  const cal = getCalendarClient();
  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { date: event.date },
      end: { date: event.date },
      colorId: event.colorId,
    },
  });
  return res.data;
}

/** イベントを更新 */
export async function updateEvent(
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    colorId?: string;
  }
) {
  const cal = getCalendarClient();
  const res = await cal.events.patch({
    calendarId,
    eventId,
    requestBody: updates,
  });
  return res.data;
}

/** イベントを削除 */
export async function deleteEvent(calendarId: string, eventId: string) {
  const cal = getCalendarClient();
  await cal.events.delete({ calendarId, eventId });
}

/**
 * 送迎イベントのsummary生成
 * 例: "送り: パパ" / "迎え: ママ" / "送り: ？"
 */
export function pickupSummary(
  type: "送り" | "迎え",
  assignee: string | null
): string {
  return `${type}: ${assignee ?? "？"}`;
}

/**
 * summaryから送迎情報をパース
 */
export function parsePickupSummary(summary: string): {
  type: "送り" | "迎え";
  assignee: string | null;
} | null {
  const match = summary.match(/^(送り|迎え): (.+)$/);
  if (!match) return null;
  const type = match[1] as "送り" | "迎え";
  const assignee = match[2] === "？" ? null : match[2];
  return { type, assignee };
}
