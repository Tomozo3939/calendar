"use client";

import { useState } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, isToday, isWeekend } from "@/lib/date-utils";
import { getTrashEmoji } from "@/lib/trash-schedule";
import { AssignModal } from "./assign-modal";

interface MonthViewProps {
  days: DaySchedule[];
  currentMonth: number; // 0-indexed
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
}

const WEEKDAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

export function MonthView({ days, currentMonth, onAssign }: MonthViewProps) {
  const [selectedPickup, setSelectedPickup] = useState<PickupEvent | null>(null);

  return (
    <>
      {/* 曜日ヘッダー */}
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

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-px px-2">
        {days.map((day) => {
          const date = parseDate(day.date);
          const inMonth = date.getMonth() === currentMonth;
          const today = isToday(date);
          const hasUnresolved = day.pickups.some((p) => p.assignee === null);

          return (
            <div
              key={day.date}
              className={`
                min-h-[80px] p-1 rounded-lg
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
                  <button
                    key={`${p.type}-${i}`}
                    onClick={() => setSelectedPickup(p)}
                    aria-label={`${day.date} ${p.type} ${p.assignee ?? "未定"}`}
                    className={`
                      w-full text-[10px] leading-snug rounded px-0.5 py-0.5 min-h-[20px]
                      focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none
                      ${p.assignee === "パパ"
                        ? "bg-blue-100 text-blue-700"
                        : p.assignee === "ママ"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-amber-50 text-amber-600"
                      }
                    `}
                  >
                    {p.type === "送り" ? "☀" : "🌙"}{p.assignee?.[0] ?? "—"}
                  </button>
                ))}
                {day.isWfh && (
                  <div className="text-[9px] bg-green-100 text-green-700 rounded px-0.5 text-center">
                    在宅
                  </div>
                )}
                {day.trash.map((t) => (
                  <span key={t} className="text-[10px]" aria-label={t}>{getTrashEmoji(t)}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPickup && (
        <AssignModal
          pickup={selectedPickup}
          onAssign={(person) => {
            onAssign(selectedPickup, person);
            setSelectedPickup(null);
          }}
          onUnassign={() => {
            onAssign(selectedPickup, null);
            setSelectedPickup(null);
          }}
          onClose={() => setSelectedPickup(null)}
        />
      )}
    </>
  );
}
