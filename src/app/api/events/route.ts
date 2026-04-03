import { NextRequest, NextResponse } from "next/server";
import { listEvents, createEvent, pickupSummary } from "@/lib/google-calendar";
import { getCalendarIds, COLOR_IDS } from "@/lib/calendar-config";
import { getTrashTypes } from "@/lib/trash-schedule";
import type { Person, PickupType, DaySchedule } from "@/types/calendar";
import { parsePickupSummary } from "@/lib/google-calendar";
import { formatDate } from "@/lib/date-utils";

/**
 * GET /api/events?start=YYYY-MM-DD&end=YYYY-MM-DD
 * 指定期間のスケジュールを返す
 */
export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end are required" },
      { status: 400 }
    );
  }

  const ids = getCalendarIds();
  const timeMin = `${start}T00:00:00+09:00`;
  const timeMax = `${end}T23:59:59+09:00`;

  try {
    // 全カレンダーから並列取得
    const [pickupEvents, familyEvents, kawamuraEvents, moekaEvents] =
      await Promise.all([
        ids.pickup ? listEvents(ids.pickup, timeMin, timeMax) : [],
        ids.family ? listEvents(ids.family, timeMin, timeMax) : [],
        ids.kawamura ? listEvents(ids.kawamura, timeMin, timeMax) : [],
        ids.moeka ? listEvents(ids.moeka, timeMin, timeMax) : [],
      ]);

    // 日付ごとにまとめる
    const scheduleMap = new Map<string, DaySchedule>();

    const getOrCreate = (dateStr: string): DaySchedule => {
      if (!scheduleMap.has(dateStr)) {
        const date = new Date(dateStr + "T00:00:00");
        scheduleMap.set(dateStr, {
          date: dateStr,
          pickups: [],
          isWfh: false,
          trash: getTrashTypes(date),
          familyEvents: [],
          kawamuraEvents: [],
          moekaEvents: [],
          isHoliday: false,
        });
      }
      return scheduleMap.get(dateStr)!;
    };

    // 送迎イベントをパース
    for (const ev of pickupEvents) {
      const dateStr = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
      if (!dateStr || !ev.summary) continue;
      const parsed = parsePickupSummary(ev.summary);
      if (!parsed) continue;
      const day = getOrCreate(dateStr);
      day.pickups.push({
        date: dateStr,
        type: parsed.type as PickupType,
        assignee: parsed.assignee as Person | null,
        googleEventId: ev.id || undefined,
      });
    }

    // 家族イベント
    for (const ev of familyEvents) {
      const dateStr = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
      if (!dateStr) continue;
      const day = getOrCreate(dateStr);
      day.familyEvents.push({
        id: ev.id || "",
        title: ev.summary || "",
        startTime: ev.start?.dateTime?.slice(11, 16),
        endTime: ev.end?.dateTime?.slice(11, 16),
        googleEventId: ev.id || undefined,
      });
    }

    // 川村イベント（在宅勤務の検出含む）
    for (const ev of kawamuraEvents) {
      const dateStr = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
      if (!dateStr) continue;
      const day = getOrCreate(dateStr);
      const title = ev.summary || "";
      const isWfh = /在宅|WFH|テレワーク|リモート/i.test(title);
      if (isWfh) {
        day.isWfh = true;
      }
      day.kawamuraEvents.push({
        id: ev.id || "",
        title,
        startTime: ev.start?.dateTime?.slice(11, 16),
        endTime: ev.end?.dateTime?.slice(11, 16),
        googleEventId: ev.id || undefined,
        isWfh,
      });
    }

    // 萌香イベント
    for (const ev of moekaEvents) {
      const dateStr = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
      if (!dateStr) continue;
      const day = getOrCreate(dateStr);
      day.moekaEvents.push({
        id: ev.id || "",
        title: ev.summary || "",
        startTime: ev.start?.dateTime?.slice(11, 16),
        endTime: ev.end?.dateTime?.slice(11, 16),
        googleEventId: ev.id || undefined,
      });
    }

    // 指定期間の全日分を埋める（ゴミの日表示のため）
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      getOrCreate(formatDate(d));
    }

    // ソートして配列化
    const days = Array.from(scheduleMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const unresolvedCount = days.reduce((count, day) => {
      const hasUnresolved = day.pickups.some((p) => p.assignee === null);
      return count + (hasUnresolved ? 1 : 0);
    }, 0);

    return NextResponse.json({ days, unresolvedCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch events:", msg, error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events", detail: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * イベントを作成
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, date, assignee, category } = body as {
    type?: PickupType;
    date: string;
    assignee?: Person | null;
    category: "pickup" | "family" | "kawamura" | "moeka";
    title?: string;
  };

  const ids = getCalendarIds();

  try {
    if (category === "pickup" && type) {
      const summary = pickupSummary(type, assignee ?? null);
      const colorId =
        assignee === "パパ"
          ? COLOR_IDS.papa
          : assignee === "ママ"
            ? COLOR_IDS.mama
            : COLOR_IDS.unset;
      const event = await createEvent(ids.pickup, {
        summary,
        date,
        colorId,
      });
      return NextResponse.json(event);
    }

    if (category === "family") {
      const event = await createEvent(ids.family, {
        summary: body.title || "予定",
        date,
        colorId: COLOR_IDS.family,
      });
      return NextResponse.json(event);
    }

    if (category === "kawamura") {
      const event = await createEvent(ids.kawamura, {
        summary: body.title || "予定",
        date,
        colorId: COLOR_IDS.kawamura,
      });
      return NextResponse.json(event);
    }

    if (category === "moeka") {
      const event = await createEvent(ids.moeka, {
        summary: body.title || "予定",
        date,
        colorId: COLOR_IDS.moeka,
      });
      return NextResponse.json(event);
    }

    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
