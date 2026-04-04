import { NextResponse } from "next/server";
import { createEvent, deleteEvent } from "@/lib/google-calendar";
import { getCalendarIds } from "@/lib/calendar-config";

export async function GET() {
  const ids = getCalendarIds();

  try {
    // createEvent内でensureSubscribedが呼ばれる
    const result = await createEvent(ids.pickup, {
      summary: "テスト送り",
      date: "2026-04-09",
    });

    // 成功したら削除
    if (result.id) {
      await deleteEvent(ids.pickup, result.id);
    }

    return NextResponse.json({
      status: "OK",
      eventId: result.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const detail =
      (error as { response?: { data?: unknown } })?.response?.data;
    return NextResponse.json({
      status: "FAIL",
      error: msg,
      detail,
    });
  }
}
