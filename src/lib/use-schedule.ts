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

function buildSchedule(
  pickups: Array<{ id: string; date: string; type: string; assignee: string | null }>,
  events: Array<{ id: string; date: string; title: string; start_time: string | null; end_time: string | null; category: string }>,
  start: string,
  end: string
): ScheduleData {
  const scheduleMap = new Map<string, DaySchedule>();

  const getOrCreate = (dateStr: string): DaySchedule => {
    if (!scheduleMap.has(dateStr)) {
      const date = new Date(dateStr + "T00:00:00");
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      scheduleMap.set(dateStr, {
        date: dateStr,
        pickups: [],
        isWfh: false,
        trash: getTrashTypes(date),
        familyEvents: [],
        kawamuraEvents: [],
        moekaEvents: [],
        isHoliday: !isWeekend && isNurseryHoliday(date, dateStr),
        holidayName: !isWeekend ? (getHolidayName(dateStr) ?? undefined) : undefined,
      });
    }
    return scheduleMap.get(dateStr)!;
  };

  for (const p of pickups) {
    const day = getOrCreate(p.date);
    day.pickups.push({
      date: p.date,
      type: p.type as PickupType,
      assignee: p.assignee as Person | null,
      googleEventId: p.id,
    });
  }

  for (const ev of events) {
    const day = getOrCreate(ev.date);
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

  // 全日分を埋める + 平日に送迎スロット生成
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const day = getOrCreate(dateStr);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    if (!isWeekend && !isNurseryHoliday(d, dateStr)) {
      const hasOkuri = day.pickups.some((p) => p.type === "送り");
      const hasMukae = day.pickups.some((p) => p.type === "迎え");
      if (!hasOkuri) day.pickups.unshift({ date: dateStr, type: "送り", assignee: null });
      if (!hasMukae) day.pickups.push({ date: dateStr, type: "迎え", assignee: null });
    }
  }

  const days = Array.from(scheduleMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const unresolvedCount = days.reduce((c, d) => c + (d.pickups.some((p) => p.assignee === null) ? 1 : 0), 0);
  return { days, unresolvedCount };
}

export function useSchedule(baseDate: Date, range: "week" | "month") {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoaded = useRef(false);

  const getDateRange = useCallback(() => {
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
    // 日曜始まり
    const calStart = new Date(firstDay);
    calStart.setDate(calStart.getDate() - calStart.getDay());
    const calEnd = new Date(lastDay);
    if (calEnd.getDay() !== 6) {
      calEnd.setDate(calEnd.getDate() + (6 - calEnd.getDay()));
    }
    return { start: formatDate(calStart), end: formatDate(calEnd) };
  }, [baseDate, range]);

  const fetchSchedule = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    const { start, end } = getDateRange();

    try {
      const [{ data: pickups }, { data: events }] = await Promise.all([
        supabase.from("pickups").select("*").gte("date", start).lte("date", end),
        supabase.from("events").select("*").gte("date", start).lte("date", end),
      ]);

      setData(buildSchedule(pickups || [], events || [], start, end));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      initialLoaded.current = true;
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchSchedule(!initialLoaded.current);
  }, [fetchSchedule]);

  /** バックグラウンドでリフレッシュ（UIを止めない） */
  const silentRefetch = useCallback(() => {
    fetchSchedule(false);
  }, [fetchSchedule]);

  /** 楽観的にUIを更新 */
  const optimisticAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      setData((prev) => {
        if (!prev) return prev;
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
      setData((prev) => {
        if (!prev) return prev;
        const newDays = prev.days.map((day) => {
          if (day.date !== dateStr) return day;
          return { ...day, isWfh };
        });
        return { ...prev, days: newDays };
      });
    },
    []
  );

  return { data, loading, error, refetch: fetchSchedule, silentRefetch, optimisticAssign, optimisticToggleWfh };
}
