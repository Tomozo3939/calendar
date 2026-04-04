"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getCachedPickups, getCachedEvents, updateCache } from "@/lib/local-cache";
import type { DaySchedule, PickupEvent, Person, PickupType } from "@/types/calendar";
import { formatDate, getSunday } from "@/lib/date-utils";
import { getTrashTypes } from "@/lib/trash-schedule";
import { isNurseryHoliday, getHolidayName } from "@/lib/holidays";

interface ScheduleData {
  days: DaySchedule[];
  unresolvedCount: number;
}

interface DbPickup { id: string; date: string; type: string; assignee: string | null }
interface DbEvent { id: string; date: string; title: string; start_time: string | null; end_time: string | null; category: string }

/** カレンダー骨格を生成し、DBデータをマージ */
function buildSchedule(start: string, end: string, pickups: DbPickup[], events: DbEvent[]): ScheduleData {
  const days: DaySchedule[] = [];
  const pickupMap = new Map<string, DbPickup[]>();
  const eventMap = new Map<string, DbEvent[]>();

  for (const p of pickups) {
    if (!pickupMap.has(p.date)) pickupMap.set(p.date, []);
    pickupMap.get(p.date)!.push(p);
  }
  for (const e of events) {
    if (!eventMap.has(e.date)) eventMap.set(e.date, []);
    eventMap.get(e.date)!.push(e);
  }

  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holiday = !isWeekend && isNurseryHoliday(d, dateStr);
    const needsPickup = !isWeekend && !holiday;

    // 送迎
    const dbPickups = pickupMap.get(dateStr) ?? [];
    const dayPickups: PickupEvent[] = [];
    if (needsPickup) {
      const okuri = dbPickups.find((p) => p.type === "送り");
      const mukae = dbPickups.find((p) => p.type === "迎え");
      dayPickups.push({ date: dateStr, type: "送り", assignee: (okuri?.assignee as Person | null) ?? null, googleEventId: okuri?.id });
      dayPickups.push({ date: dateStr, type: "迎え", assignee: (mukae?.assignee as Person | null) ?? null, googleEventId: mukae?.id });
    }

    // イベント
    const dbEvents = eventMap.get(dateStr) ?? [];
    const familyEvents: DaySchedule["familyEvents"] = [];
    const kawamuraEvents: DaySchedule["kawamuraEvents"] = [];
    const moekaEvents: DaySchedule["moekaEvents"] = [];
    let isWfh = false;

    for (const ev of dbEvents) {
      const obj = { id: ev.id, title: ev.title, startTime: ev.start_time?.slice(0, 5), endTime: ev.end_time?.slice(0, 5) };
      if (ev.category === "家族") {
        familyEvents.push(obj);
      } else if (ev.category === "川村") {
        const wfh = /在宅|WFH|テレワーク|リモート/i.test(ev.title);
        if (wfh) isWfh = true;
        kawamuraEvents.push({ ...obj, isWfh: wfh });
      } else if (ev.category === "萌香") {
        moekaEvents.push(obj);
      }
    }

    days.push({
      date: dateStr,
      pickups: dayPickups,
      isWfh,
      trash: getTrashTypes(d),
      familyEvents,
      kawamuraEvents,
      moekaEvents,
      isHoliday: holiday,
      holidayName: !isWeekend ? (getHolidayName(dateStr) ?? undefined) : undefined,
    });
  }

  const unresolvedCount = days.reduce((c, day) => c + (day.pickups.some((p) => p.assignee === null) ? 1 : 0), 0);
  return { days, unresolvedCount };
}

function getDateRange(baseDate: Date, range: "week" | "month") {
  if (range === "week") {
    const sunday = getSunday(baseDate);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return { start: formatDate(sunday), end: formatDate(saturday) };
  }
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const calStart = new Date(firstDay);
  calStart.setDate(calStart.getDate() - calStart.getDay());
  const calEnd = new Date(lastDay);
  if (calEnd.getDay() !== 6) calEnd.setDate(calEnd.getDate() + (6 - calEnd.getDay()));
  return { start: formatDate(calStart), end: formatDate(calEnd) };
}

export function useSchedule(baseDate: Date, range: "week" | "month") {
  const { start, end } = getDateRange(baseDate, range);

  // キャッシュからデータを即座にビルド
  const [data, setData] = useState<ScheduleData>(() =>
    buildSchedule(start, end, getCachedPickups(), getCachedEvents())
  );
  const [error, setError] = useState<string | null>(null);
  const synced = useRef(false);

  // range/baseDateが変わったらキャッシュデータで即再描画
  useEffect(() => {
    setData(buildSchedule(start, end, getCachedPickups(), getCachedEvents()));
  }, [start, end]);

  // 初回のみDBから取得してキャッシュ更新
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    syncFromDb();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function syncFromDb() {
    try {
      const [{ data: pickups }, { data: events }] = await Promise.all([
        supabase.from("pickups").select("*"),
        supabase.from("events").select("*"),
      ]);
      const p = pickups ?? [];
      const e = events ?? [];
      updateCache(p, e);
      setData(buildSchedule(start, end, p, e));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  /** DBと同期（変更操作後に呼ぶ） */
  const syncDb = useCallback(async () => {
    try {
      const [{ data: pickups }, { data: events }] = await Promise.all([
        supabase.from("pickups").select("*"),
        supabase.from("events").select("*"),
      ]);
      const p = pickups ?? [];
      const e = events ?? [];
      updateCache(p, e);
      setData(buildSchedule(start, end, p, e));
    } catch {
      // silent
    }
  }, [start, end]);

  /** 楽観的に送迎を更新 */
  const optimisticAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day) =>
          day.date !== pickup.date ? day : { ...day, pickups: day.pickups.map((p) => p.type === pickup.type ? { ...p, assignee } : p) }
        ),
        unresolvedCount: prev.days.reduce((c, d) => {
          if (d.date === pickup.date) {
            return c + (d.pickups.some((p) => p.type === pickup.type ? assignee === null : p.assignee === null) ? 1 : 0);
          }
          return c + (d.pickups.some((p) => p.assignee === null) ? 1 : 0);
        }, 0),
      }));
    },
    []
  );

  /** 楽観的に在宅を切り替え */
  const optimisticToggleWfh = useCallback(
    (dateStr: string, isWfh: boolean) => {
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day) => day.date === dateStr ? { ...day, isWfh } : day),
      }));
    },
    []
  );

  return { data, error, syncDb, optimisticAssign, optimisticToggleWfh };
}
