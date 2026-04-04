"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { DaySchedule, PickupEvent, Person, PickupType } from "@/types/calendar";
import { formatDate, getSunday } from "@/lib/date-utils";
import { getTrashTypes } from "@/lib/trash-schedule";
import { isNurseryHoliday, getHolidayName } from "@/lib/holidays";

interface ScheduleData {
  days: DaySchedule[];
  unresolvedCount: number;
}

/** ローカルで即座にカレンダー骨格を生成（DB不要） */
function buildLocalSchedule(start: string, end: string): ScheduleData {
  const days: DaySchedule[] = [];
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holiday = !isWeekend && isNurseryHoliday(d, dateStr);
    const pickups: PickupEvent[] = [];

    if (!isWeekend && !holiday) {
      pickups.push({ date: dateStr, type: "送り", assignee: null });
      pickups.push({ date: dateStr, type: "迎え", assignee: null });
    }

    days.push({
      date: dateStr,
      pickups,
      isWfh: false,
      trash: getTrashTypes(d),
      familyEvents: [],
      kawamuraEvents: [],
      moekaEvents: [],
      isHoliday: holiday,
      holidayName: !isWeekend ? (getHolidayName(dateStr) ?? undefined) : undefined,
    });
  }

  const unresolvedCount = days.reduce((c, d) => c + (d.pickups.some((p) => p.assignee === null) ? 1 : 0), 0);
  return { days, unresolvedCount };
}

/** DBデータをローカルスケジュールにマージ */
function mergeDbData(
  local: ScheduleData,
  pickups: Array<{ id: string; date: string; type: string; assignee: string | null }>,
  events: Array<{ id: string; date: string; title: string; start_time: string | null; end_time: string | null; category: string }>
): ScheduleData {
  const dayMap = new Map(local.days.map((d) => [d.date, { ...d, pickups: [...d.pickups], familyEvents: [...d.familyEvents], kawamuraEvents: [...d.kawamuraEvents], moekaEvents: [...d.moekaEvents] }]));

  // 送迎データをマージ
  for (const p of pickups) {
    const day = dayMap.get(p.date);
    if (!day) continue;
    const existing = day.pickups.find((x) => x.type === p.type);
    if (existing) {
      existing.assignee = p.assignee as Person | null;
      existing.googleEventId = p.id;
    }
  }

  // イベントデータをマージ
  for (const ev of events) {
    const day = dayMap.get(ev.date);
    if (!day) continue;
    const eventObj = {
      id: ev.id,
      title: ev.title,
      startTime: ev.start_time?.slice(0, 5),
      endTime: ev.end_time?.slice(0, 5),
    };
    if (ev.category === "家族") {
      day.familyEvents.push(eventObj);
    } else if (ev.category === "川村") {
      const isWfh = /在宅|WFH|テレワーク|リモート/i.test(ev.title);
      if (isWfh) day.isWfh = true;
      day.kawamuraEvents.push({ ...eventObj, isWfh });
    } else if (ev.category === "萌香") {
      day.moekaEvents.push(eventObj);
    }
  }

  const days = Array.from(dayMap.values());
  const unresolvedCount = days.reduce((c, d) => c + (d.pickups.some((p) => p.assignee === null) ? 1 : 0), 0);
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
  if (calEnd.getDay() !== 6) {
    calEnd.setDate(calEnd.getDate() + (6 - calEnd.getDay()));
  }
  return { start: formatDate(calStart), end: formatDate(calEnd) };
}

export function useSchedule(baseDate: Date, range: "week" | "month") {
  const { start, end } = getDateRange(baseDate, range);

  // ローカルデータで即描画
  const [data, setData] = useState<ScheduleData>(() => buildLocalSchedule(start, end));
  const [error, setError] = useState<string | null>(null);
  const prevKey = useRef("");

  // range/baseDateが変わったらローカルデータを即差し替え
  useEffect(() => {
    const key = `${start}-${end}`;
    if (key !== prevKey.current) {
      prevKey.current = key;
      setData(buildLocalSchedule(start, end));
    }
  }, [start, end]);

  // バックグラウンドでDBデータを取得してマージ
  const fetchAndMerge = useCallback(async () => {
    try {
      const [{ data: pickups }, { data: events }] = await Promise.all([
        supabase.from("pickups").select("*").gte("date", start).lte("date", end),
        supabase.from("events").select("*").gte("date", start).lte("date", end),
      ]);
      const local = buildLocalSchedule(start, end);
      setData(mergeDbData(local, pickups || [], events || []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [start, end]);

  useEffect(() => {
    fetchAndMerge();
  }, [fetchAndMerge]);

  /** 楽観的にUIを更新 */
  const optimisticAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      setData((prev) => {
        const newDays = prev.days.map((day) => {
          if (day.date !== pickup.date) return day;
          return { ...day, pickups: day.pickups.map((p) => p.type === pickup.type ? { ...p, assignee } : p) };
        });
        const unresolvedCount = newDays.reduce((c, d) => c + (d.pickups.some((p) => p.assignee === null) ? 1 : 0), 0);
        return { days: newDays, unresolvedCount };
      });
    },
    []
  );

  /** 在宅を楽観的に切り替え */
  const optimisticToggleWfh = useCallback(
    (dateStr: string, isWfh: boolean) => {
      setData((prev) => ({
        ...prev,
        days: prev.days.map((day) => day.date === dateStr ? { ...day, isWfh } : day),
      }));
    },
    []
  );

  return { data, error, silentRefetch: fetchAndMerge, optimisticAssign, optimisticToggleWfh };
}
