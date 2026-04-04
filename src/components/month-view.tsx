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

export function MonthView({ days, currentMonth, onAssign, onDayTap }: MonthViewProps) {
  return (
    <>
      <div className="grid grid-cols-7 px-2 mb-1">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-medium py-1 ${
              i >= 5 ? "text-red-300" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px px-2">
        {days.map((day) => {
          const date = parseDate(day.date);
          const inMonth = date.getMonth() === currentMonth;
          const today = isToday(date);
          const hasUnresolved = day.pickups.some((p) => p.assignee === null);

          return (
            <button
              key={day.date}
              onClick={() => onDayTap(day)}
              className={`
                min-h-[80px] p-1 rounded-lg text-left
                transition-colors active:bg-gray-100
                focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none
                ${!inMonth ? "opacity-25" : ""}
                ${today ? "bg-blue-50 ring-1 ring-blue-300" : ""}
                ${hasUnresolved && inMonth && !today ? "bg-amber-50/50" : ""}
              `}
            >
              <div className="text-center">
                <span
                  className={`
                    text-xs font-medium
                    ${today ? "text-blue-600" : isWeekend(date) ? "text-red-400" : "text-gray-600"}
                  `}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="mt-0.5 space-y-0.5">
                {day.pickups.map((p, i) => (
                  <div
                    key={`${p.type}-${i}`}
                    className={`
                      w-full text-[10px] leading-snug rounded px-0.5 py-0.5 text-center
                      ${p.assignee === "とっちゃん"
                        ? "bg-blue-100 text-blue-700"
                        : p.assignee === "かあか"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-amber-50 text-amber-600"
                      }
                    `}
                  >
                    {p.type[0]}{p.assignee?.[0] ?? "-"}
                  </div>
                ))}
                {day.isWfh && (
                  <div className="text-[9px] bg-green-100 text-green-700 rounded px-0.5 text-center">
                    在宅
                  </div>
                )}
                {day.trash.map((t) => (
                  <span key={t} className={`text-[8px] font-bold px-0.5 rounded ${getTrashColor(t)}`}>
                    {getTrashLabel(t)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
