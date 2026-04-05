"use client";

import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, isToday, isWeekend, getWeekdayShort } from "@/lib/date-utils";
import { getTrashLabel, getTrashColor } from "@/lib/trash-schedule";

interface WeekViewProps {
  days: DaySchedule[];
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
  onDayTap: (day: DaySchedule) => void;
}

export function WeekView({ days, onAssign, onDayTap }: WeekViewProps) {
  return (
    <div className="px-2 space-y-1">
      {days.slice(0, 7).map((day) => {
        const date = parseDate(day.date);
        const today = isToday(date);
        const weekend = isWeekend(date);
        const month = date.getMonth() + 1;
        const dayNum = date.getDate();
        const weekday = getWeekdayShort(date);

        return (
          <div
            key={day.date}
            className={`
              flex items-start gap-3 rounded-xl border p-3
              ${today
                ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
                : day.pickups.some((p) => p.assignee === null)
                  ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }
            `}
          >
            <button
              onClick={() => onDayTap(day)}
              className="w-12 shrink-0 text-center pt-0.5 rounded-lg active:opacity-70"
            >
              <div className={`text-lg font-bold leading-none ${today ? "text-blue-600 dark:text-blue-400" : weekend ? "text-red-400" : "text-[var(--color-text)]"}`}>
                {dayNum}
              </div>
              <div className={`text-[10px] mt-0.5 ${weekend ? "text-red-300" : "text-[var(--color-text-sub)]"}`}>
                {weekday}
              </div>
            </button>

            <div className="flex-1 min-w-0 space-y-1.5">
              {day.pickups.length > 0 && (
                <div className="flex gap-1.5">
                  {day.pickups.map((pickup, i) => {
                    const bg = pickup.assignee === "とっちゃん"
                      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                      : pickup.assignee === "かあか"
                        ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-700"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
                    return (
                      <button
                        key={`${pickup.type}-${i}`}
                        onClick={() => onDayTap(day)}
                        className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium active:scale-[0.97] ${bg}`}
                      >
                        {pickup.type} {pickup.assignee ?? "未定"}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {day.isHoliday && <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">{day.holidayName ?? "休日"}</span>}
                {day.isWfh && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">在宅</span>}
                {day.trash.map((t) => (
                  <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrashColor(t)}`}>{getTrashLabel(t)}</span>
                ))}
              </div>

              {/* 予定（色付きバー） */}
              {day.familyEvents.map((ev) => (
                <div key={ev.id} className="text-[11px] bg-red-400 text-white rounded px-1.5 py-0.5 truncate">{ev.startTime ? `${ev.startTime} ` : ""}{ev.title}</div>
              ))}
              {day.kawamuraEvents.filter((e) => !e.isWfh).map((ev) => (
                <div key={ev.id} className="text-[11px] bg-blue-400 text-white rounded px-1.5 py-0.5 truncate">{ev.startTime ? `${ev.startTime} ` : ""}{ev.title}</div>
              ))}
              {day.moekaEvents.map((ev) => (
                <div key={ev.id} className="text-[11px] bg-pink-400 text-white rounded px-1.5 py-0.5 truncate">{ev.startTime ? `${ev.startTime} ` : ""}{ev.title}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
