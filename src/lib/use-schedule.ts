"use client";

import { useState, useEffect, useCallback } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { formatDate, getMonday } from "@/lib/date-utils";

interface ScheduleData {
  days: DaySchedule[];
  unresolvedCount: number;
}

export function useSchedule(baseDate: Date, range: "week" | "month") {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    let start: string;
    let end: string;

    if (range === "week") {
      const monday = getMonday(baseDate);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      start = formatDate(monday);
      end = formatDate(sunday);
    } else {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const calStart = getMonday(firstDay);
      const calEnd = new Date(lastDay);
      calEnd.setDate(calEnd.getDate() + (7 - calEnd.getDay()) % 7);
      start = formatDate(calStart);
      end = formatDate(calEnd);
    }

    try {
      const res = await fetch(`/api/events?start=${start}&end=${end}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [baseDate, range]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  /** 楽観的にUIを更新してからAPIを叩く */
  const optimisticAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      setData((prev) => {
        if (!prev) return prev;
        const newDays = prev.days.map((day) => {
          if (day.date !== pickup.date) return day;
          return {
            ...day,
            pickups: day.pickups.map((p) =>
              p.type === pickup.type
                ? { ...p, assignee }
                : p
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
