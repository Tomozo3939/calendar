"use client";

import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, isToday, isWeekend } from "@/lib/date-utils";
import { getTrashLabel, getTrashColor } from "@/lib/trash-schedule";

interface MonthViewProps {
  days: DaySchedule[];
  currentMonth: number;
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
  onDayTap: (day: DaySchedule) => void;
}

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

export function MonthView({ days, currentMonth, onDayTap }: MonthViewProps) {
  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 px-1">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i >= 5 ? "text-red-400 dark:text-red-500" : "text-[var(--color-text-sub)]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 px-1">
        {days.map((day) => {
          const date = parseDate(day.date);
          const inMonth = date.getMonth() === currentMonth;
          const today = isToday(date);
          const hasUnresolved = day.pickups.some((p) => p.assignee === null);
          const weekend = isWeekend(date);

          return (
            <button
              key={day.date}
              onClick={() => onDayTap(day)}
              className={`
                p-0.5 pt-1 border-b border-r border-[var(--color-border)] text-left
                active:bg-gray-100 dark:active:bg-white/5
                focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none
                ${!inMonth ? "opacity-20" : ""}
                ${today ? "bg-blue-50 dark:bg-blue-950" : ""}
                ${hasUnresolved && inMonth && !today ? "bg-amber-50/60 dark:bg-amber-950/30" : ""}
              `}
            >
              <div className="text-center mb-0.5">
                <span
                  className={`
                    text-sm font-semibold
                    ${today ? "text-blue-600 dark:text-blue-400" : weekend ? "text-red-400" : "text-[var(--color-text)]"}
                  `}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="space-y-0.5 min-h-[36px]">
                {/* 送迎: 1行で 送|迎 */}
                {day.pickups.length > 0 && (
                  <div className="flex gap-px text-[9px] leading-none font-medium">
                    {day.pickups.map((p, i) => {
                      const bg = p.assignee === "とっちゃん"
                        ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                        : p.assignee === "かあか"
                          ? "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
                      return (
                        <span key={`${p.type}-${i}`} className={`flex-1 text-center rounded-sm py-0.5 ${bg}`}>
                          {p.type[0]}{p.assignee?.[0] ?? "-"}
                        </span>
                      );
                    })}
                  </div>
                )}
                {day.isWfh && (
                  <div className="text-[8px] bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-sm px-0.5 text-center">在宅</div>
                )}
                {day.trash.map((t) => (
                  <div key={t} className={`text-[8px] font-bold rounded-sm px-0.5 text-center ${getTrashColor(t)}`}>
                    {getTrashLabel(t)}
                  </div>
                ))}
                {day.isHoliday && inMonth && (
                  <div className="text-[8px] text-red-500 text-center truncate">{day.holidayName}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
