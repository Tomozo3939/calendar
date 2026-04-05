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

const WEEKDAY_HEADERS = ["日", "月", "火", "水", "木", "金", "土"];

export function MonthView({ days, currentMonth, onDayTap }: MonthViewProps) {
  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 px-1">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 || i === 6 ? "text-red-400 dark:text-red-500" : "text-[var(--color-text-sub)]"
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
                border-b border-r border-[var(--color-border)] text-left overflow-hidden
                active:bg-gray-100 dark:active:bg-white/5
                focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none
                flex flex-col
                ${!inMonth ? "opacity-20" : ""}
                ${today ? "bg-blue-50 dark:bg-blue-950" : ""}
              `}
            >
              {/* 日付(左上) + ゴミ(右上) */}
              <div className="flex items-start justify-between px-0.5">
                <span
                  className={`
                    text-xs font-semibold leading-tight
                    ${today ? "text-blue-600 dark:text-blue-400" : weekend ? "text-red-400" : "text-[var(--color-text)]"}
                  `}
                >
                  {date.getDate()}
                </span>
                {day.trash.length > 0 && (
                  <div className="flex gap-px">
                    {day.trash.map((t) => (
                      <span key={t} className={`text-[8px] font-bold px-0.5 rounded leading-tight ${getTrashColor(t)}`}>
                        {getTrashLabel(t)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* コンテンツ */}
              <div className="flex-1 px-0.5 pb-0.5 space-y-px overflow-hidden">
                {/* 保育園休み（平日祝日のみ） */}
                {day.isHoliday && inMonth && (
                  <div className="text-[9px] bg-red-500 text-white rounded-sm px-0.5 truncate leading-tight">
                    {day.holidayName ?? "休み"}
                  </div>
                )}

                {/* 送迎: 左=送り 右=迎え（1行） */}
                {day.pickups.length > 0 && (
                  <div className="flex gap-px text-[9px] leading-tight font-medium">
                    {okuri && (
                      <span className={`flex-1 text-center rounded-sm ${assigneeColor(okuri.assignee)}`}>
                        送{okuri.assignee?.[0] ?? "-"}
                      </span>
                    )}
                    {mukae && (
                      <span className={`flex-1 text-center rounded-sm ${assigneeColor(mukae.assignee)}`}>
                        迎{mukae.assignee?.[0] ?? "-"}
                      </span>
                    )}
                  </div>
                )}

                {/* 在宅 */}
                {day.isWfh && (
                  <div className="text-[9px] bg-green-500 text-white rounded-sm px-0.5 truncate leading-tight">在宅</div>
                )}

                {/* 予定（TimeTreeスタイル：色付きバーでタイトル表示） */}
                {day.familyEvents.map((ev) => (
                  <div key={ev.id} className="text-[9px] bg-red-400 text-white rounded-sm px-0.5 truncate leading-tight">
                    {ev.title}
                  </div>
                ))}
                {day.kawamuraEvents.filter((e) => !e.isWfh).map((ev) => (
                  <div key={ev.id} className="text-[9px] bg-blue-400 text-white rounded-sm px-0.5 truncate leading-tight">
                    {ev.title}
                  </div>
                ))}
                {day.moekaEvents.map((ev) => (
                  <div key={ev.id} className="text-[9px] bg-pink-400 text-white rounded-sm px-0.5 truncate leading-tight">
                    {ev.title}
                  </div>
                ))}
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
