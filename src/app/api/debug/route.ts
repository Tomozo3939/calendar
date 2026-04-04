import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getCalendarIds } from "@/lib/calendar-config";

export async function GET() {
  const ids = getCalendarIds();

  // Base64版で直接テスト
  let credentials;
  const source = process.env.GOOGLE_SA_KEY_BASE64 ? "base64" : "json";
  if (process.env.GOOGLE_SA_KEY_BASE64) {
    credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SA_KEY_BASE64, "base64").toString("utf8")
    );
  } else {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const cal = google.calendar({ version: "v3", auth });

  try {
    // まずlistを試す
    const listRes = await cal.events.list({
      calendarId: ids.pickup,
      maxResults: 1,
    });
    const listOk = true;

    // insertを試す
    const insertRes = await cal.events.insert({
      calendarId: ids.pickup,
      requestBody: {
        summary: "テスト送り",
        start: { date: "2026-04-09" },
        end: { date: "2026-04-10" },
      },
    });

    // 成功したら削除
    if (insertRes.data.id) {
      await cal.events.delete({
        calendarId: ids.pickup,
        eventId: insertRes.data.id,
      });
    }

    return NextResponse.json({
      source,
      listOk,
      insertOk: true,
      clientEmail: credentials.client_email,
      privateKeyLen: credentials.private_key?.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const detail =
      (error as { response?: { data?: unknown } })?.response?.data;
    return NextResponse.json({
      source,
      error: msg,
      detail,
      clientEmail: credentials.client_email,
      privateKeyLen: credentials.private_key?.length,
    });
  }
}
