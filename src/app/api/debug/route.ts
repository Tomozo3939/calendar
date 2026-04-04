import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getCalendarIds } from "@/lib/calendar-config";

export async function GET() {
  const ids = getCalendarIds();

  // 直接認証テスト
  let credentials;
  if (process.env.GOOGLE_SA_KEY_BASE64) {
    credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SA_KEY_BASE64, "base64").toString("utf8")
    );
  } else {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  }

  // private_keyの改行チェック
  const pk = credentials.private_key as string;
  const hasRealNewlines = pk.includes("\n");
  const hasLiteralBackslashN = pk.includes("\\n");
  const startsCorrectly = pk.startsWith("-----BEGIN PRIVATE KEY-----");

  // private_keyをクリーンアップ
  if (hasLiteralBackslashN && !hasRealNewlines) {
    credentials.private_key = pk.replace(/\\n/g, "\n");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const cal = google.calendar({ version: "v3", auth });

  try {
    // calendarList.insertでカレンダーを購読
    try {
      await cal.calendarList.insert({ requestBody: { id: ids.pickup } });
    } catch {
      // 既に購読済みなら409
    }

    // events.insertテスト
    const res = await cal.events.insert({
      calendarId: ids.pickup,
      requestBody: {
        summary: "debug test",
        start: { date: "2026-04-09" },
        end: { date: "2026-04-10" },
      },
    });

    // 成功したら削除
    if (res.data.id) {
      await cal.events.delete({ calendarId: ids.pickup, eventId: res.data.id });
    }

    return NextResponse.json({
      status: "OK",
      hasRealNewlines,
      hasLiteralBackslashN,
      startsCorrectly,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: "FAIL",
      error: msg,
      hasRealNewlines,
      hasLiteralBackslashN,
      startsCorrectly,
      pkPreview: pk.slice(0, 40),
    });
  }
}
