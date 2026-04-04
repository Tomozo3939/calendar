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
          const weekend = isWeekend(date);
          const okuri = day.pickups.find((p) => p.type === "送り");
          const mukae = day.pickups.find((p) => p.type === "迎え");

          return (
            <button
              key={day.date}
              onClick={() => onDayTap(day)}
              className={`
                p-0.5 border-b border-r border-[var(--color-border)] text-left
                active:bg-gray-100 dark:active:bg-white/5
                focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none
                ${!inMonth ? "opacity-20" : ""}
                ${today ? "bg-blue-50 dark:bg-blue-950" : ""}
              `}
            >
              {/* 日付(左) + ゴミ(右) */}
              <div className="flex items-start justify-between mb-0.5">
                <span
                  className={`
                    text-sm font-semibold pl-0.5
                    ${today ? "text-blue-600 dark:text-blue-400" : weekend ? "text-red-400" : "text-[var(--color-text)]"}
                  `}
                >
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-px items-end">
                  {day.trash.map((t) => (
                    <span key={t} className={`text-[7px] font-bold px-0.5 rounded ${getTrashColor(t)}`}>
                      {getTrashLabel(t)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 min-h-[28px]">
                {/* 保育園休み */}
                {day.isHoliday && inMonth && day.pickups.length === 0 && (
                  <div className="text-[8px] text-center text-red-500 dark:text-red-400">
                    {day.holidayName ?? "休み"}
                  </div>
                )}

                {/* 送迎: 左=送り 右=迎え */}
                {day.pickups.length > 0 && (
                  <div className="flex gap-px text-[9px] leading-none font-medium">
                    {okuri && (
                      <span className={`flex-1 text-center rounded-sm py-0.5 ${assigneeColor(okuri.assignee)}`}>
                        送{okuri.assignee?.[0] ?? "-"}
                      </span>
                    )}
                    {mukae && (
                      <span className={`flex-1 text-center rounded-sm py-0.5 ${assigneeColor(mukae.assignee)}`}>
                        迎{mukae.assignee?.[0] ?? "-"}
                      </span>
                    )}
                  </div>
                )}

                {day.isWfh && (
                  <div className="text-[8px] bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-sm px-0.5 text-center">在宅</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function assigneeColor(assignee: string | null): string {
  if (assignee === "とっちゃん") return "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
  if (assignee === "かあか") return "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
}
