"use client";

import { useState } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, isToday, isWeekend, getWeekdayShort } from "@/lib/date-utils";
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
            className={`text-center text-[10px] font-medium py-1 ${
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
                min-h-[72px] p-1 rounded-lg text-center
                ${!inMonth ? "opacity-30" : ""}
                ${today ? "bg-blue-50 ring-1 ring-blue-300" : ""}
                ${hasUnresolved && inMonth ? "bg-yellow-50" : ""}
              `}
            >
              <span
                className={`
                  text-xs font-medium
                  ${today ? "text-blue-600" : isWeekend(date) ? "text-red-400" : "text-gray-600"}
                `}
              >
                {date.getDate()}
              </span>

              {/* コンパクト表示 */}
              <div className="mt-0.5 space-y-px">
                {day.pickups.map((p, i) => (
                  <button
                    key={`${p.type}-${i}`}
                    onClick={() => setSelectedPickup(p)}
                    className={`
                      w-full text-[8px] leading-tight rounded px-0.5 py-px truncate
                      ${p.assignee === "パパ"
                        ? "bg-blue-100 text-blue-600"
                        : p.assignee === "ママ"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-yellow-100 text-yellow-600"
                      }
                    `}
                  >
                    {p.type[0]}{p.assignee?.[0] ?? "？"}
                  </button>
                ))}
                {day.isWfh && (
                  <div className="text-[8px] bg-green-100 text-green-600 rounded px-0.5">
                    在宅
                  </div>
                )}
                {day.trash.map((t) => (
                  <span key={t} className="text-[9px]">{getTrashEmoji(t)}</span>
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
