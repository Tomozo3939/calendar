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
  let credentials: Record<string, unknown>;

  // Base64エンコード版を優先（Vercel環境変数でJSON特殊文字が壊れる問題の回避）
  if (process.env.GOOGLE_SA_KEY_BASE64) {
    credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SA_KEY_BASE64, "base64").toString("utf8")
    );
  } else {
    credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
    );
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getAuth() });
}

/**
 * サービスアカウントのカレンダーリストにカレンダーを追加する
 * 書き込み操作の前に呼ぶ（既に追加済みならスキップ）
 */
const subscribedCalendars = new Set<string>();

async function ensureSubscribed(calendarId: string) {
  if (subscribedCalendars.has(calendarId)) return;

  const cal = getCalendarClient();
  try {
    await cal.calendarList.insert({
      requestBody: { id: calendarId },
    });
  } catch {
    // 既に追加済みの場合は409 Conflictが返る → 無視
  }
  subscribedCalendars.add(calendarId);
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
  await ensureSubscribed(calendarId);

  const cal = getCalendarClient();
  const endDate = new Date(event.date + "T00:00:00");
  endDate.setDate(endDate.getDate() + 1);
  const endStr = endDate.toISOString().slice(0, 10);

  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { date: event.date },
      end: { date: endStr },
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
  await ensureSubscribed(calendarId);

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
  await ensureSubscribed(calendarId);

  const cal = getCalendarClient();
  await cal.events.delete({ calendarId, eventId });
}

/**
 * 送迎イベントのsummary生成
 * 例: "送り: とっちゃん" / "迎え: かあか" / "送り: ？"
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
