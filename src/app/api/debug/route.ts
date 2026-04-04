import { NextResponse } from "next/server";
import { createEvent } from "@/lib/google-calendar";
import { getCalendarIds } from "@/lib/calendar-config";

export async function GET() {
  const ids = getCalendarIds();

  try {
    const result = await createEvent(ids.pickup, {
      summary: "テスト: debug",
      date: "2026-04-09",
    });
    return NextResponse.json({
      status: "INSERT_OK",
      eventId: result.id,
      pickupId: ids.pickup.slice(0, 10) + "...",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const detail =
      (error as { response?: { data?: unknown } })?.response?.data;
    return NextResponse.json({
      status: "INSERT_FAIL",
      error: msg,
      detail: detail ?? null,
      pickupId: ids.pickup.slice(0, 10) + "...",
    });
  }
}
