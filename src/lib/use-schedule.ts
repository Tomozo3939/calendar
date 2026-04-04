"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DaySchedule, PickupEvent, Person, PickupType } from "@/types/calendar";
import { formatDate, getMonday } from "@/lib/date-utils";
import { getTrashTypes } from "@/lib/trash-schedule";
import { isNurseryHoliday, getHolidayName } from "@/lib/holidays";

interface ScheduleData {
  days: DaySchedule[];
  unresolvedCount: number;
}

export function useSchedule(baseDate: Date, range: "week" | "month") {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback(() => {
    if (range === "week") {
      const monday = getMonday(baseDate);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return { start: formatDate(monday), end: formatDate(sunday) };
    }
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const calStart = getMonday(firstDay);
    const calEnd = new Date(lastDay);
    calEnd.setDate(calEnd.getDate() + (7 - calEnd.getDay()) % 7);
    return { start: formatDate(calStart), end: formatDate(calEnd) };
  }, [baseDate, range]);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { start, end } = getDateRange();

    try {
      // Supabaseから送迎データを取得
      const { data: pickups } = await supabase
        .from("pickups")
        .select("*")
        .gte("date", start)
        .lte("date", end);

      // イベントデータを取得
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .gte("date", start)
        .lte("date", end);

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
            isHoliday: isNurseryHoliday(date, dateStr),
            holidayName: getHolidayName(dateStr) ?? undefined,
          });
        }
        return scheduleMap.get(dateStr)!;
      };

      // 送迎データをセット
      for (const p of pickups || []) {
        const day = getOrCreate(p.date);
        day.pickups.push({
          date: p.date,
          type: p.type as PickupType,
          assignee: p.assignee as Person | null,
          googleEventId: p.id,
        });
      }

      // イベントデータをセット
      for (const ev of events || []) {
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

        if (!isNurseryHoliday(d, dateStr)) {
          const hasOkuri = day.pickups.some((p) => p.type === "送り");
          const hasMukae = day.pickups.some((p) => p.type === "迎え");
          if (!hasOkuri) {
            day.pickups.unshift({ date: dateStr, type: "送り", assignee: null });
          }
          if (!hasMukae) {
            day.pickups.push({ date: dateStr, type: "迎え", assignee: null });
          }
        }
      }

      const days = Array.from(scheduleMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      const unresolvedCount = days.reduce((count, day) => {
        return count + (day.pickups.some((p) => p.assignee === null) ? 1 : 0);
      }, 0);

      setData({ days, unresolvedCount });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  /** 楽観的にUIを更新 */
  const optimisticAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      setData((prev) => {
        if (!prev) return prev;
        const newDays = prev.days.map((day) => {
          if (day.date !== pickup.date) return day;
          return {
            ...day,
            pickups: day.pickups.map((p) =>
              p.type === pickup.type ? { ...p, assignee } : p
            ),
          };
        });
        const unresolvedCount = newDays.reduce((count, day) => {
          return count + (day.pickups.some((p) => p.assignee === null) ? 1 : 0);
        }, 0);
        return { days: newDays, unresolvedCount };
      });
    },
    []
  );

  return { data, loading, error, refetch: fetchSchedule, optimisticAssign };
}
