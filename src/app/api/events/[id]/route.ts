import { NextRequest, NextResponse } from "next/server";
import { updateEvent, deleteEvent, pickupSummary } from "@/lib/google-calendar";
import { getCalendarIds, COLOR_IDS } from "@/lib/calendar-config";
import type { Person } from "@/types/calendar";

/**
 * PATCH /api/events/[id]
 * 送迎担当の変更
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { assignee, type, calendar } = body as {
    assignee?: Person | null;
    type?: "送り" | "迎え";
    calendar?: "pickup" | "wfh" | "family";
  };

  const ids = getCalendarIds();
  const calendarId = calendar === "wfh" ? ids.wfh
    : calendar === "family" ? ids.family
    : ids.pickup;

  try {
    if (type && calendar === "pickup") {
      const summary = pickupSummary(type, assignee ?? null);
      const colorId = assignee === "パパ"
        ? COLOR_IDS.papa
        : assignee === "ママ"
          ? COLOR_IDS.mama
          : COLOR_IDS.unset;
      const event = await updateEvent(calendarId, id, { summary, colorId });
      return NextResponse.json(event);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const calendar = req.nextUrl.searchParams.get("calendar") || "pickup";
  const ids = getCalendarIds();
  const calendarId = calendar === "wfh" ? ids.wfh
    : calendar === "family" ? ids.family
    : ids.pickup;

  try {
    await deleteEvent(calendarId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
