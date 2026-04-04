"use client";

import { useState } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, isToday, isWeekend, getWeekdayShort } from "@/lib/date-utils";
import { getTrashLabel, getTrashColor } from "@/lib/trash-schedule";
import { AssignModal } from "./assign-modal";

interface WeekViewProps {
  days: DaySchedule[];
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
}

export function WeekView({ days, onAssign }: WeekViewProps) {
  const [selectedPickup, setSelectedPickup] = useState<PickupEvent | null>(null);

  return (
    <>
      <div className="px-3 space-y-1.5">
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
                  ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-100"
                  : day.pickups.some((p) => p.assignee === null)
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-gray-200 bg-white"
                }
              `}
            >
              {/* 日付 */}
              <div className="w-12 shrink-0 text-center pt-0.5">
                <div className={`text-lg font-bold leading-none ${today ? "text-blue-600" : weekend ? "text-red-400" : "text-gray-800"}`}>
                  {dayNum}
                </div>
                <div className={`text-[10px] mt-0.5 ${weekend ? "text-red-300" : "text-gray-400"}`}>
                  {weekday}
                </div>
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* 送迎 */}
                {day.pickups.length > 0 && (
                  <div className="flex gap-1.5">
                    {day.pickups.map((pickup, i) => {
                      const bgColor = pickup.assignee === "とっちゃん"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : pickup.assignee === "かあか"
                          ? "bg-pink-100 text-pink-700 border-pink-200"
                          : "bg-amber-50 text-amber-700 border-amber-200";

                      return (
                        <button
                          key={`${pickup.type}-${i}`}
                          onClick={() => setSelectedPickup(pickup)}
                          className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${bgColor}`}
                        >
                          {pickup.type} {pickup.assignee ?? "未定"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* タグ行 */}
                <div className="flex flex-wrap gap-1">
                  {day.isHoliday && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                      {day.holidayName ?? "休日"}
                    </span>
                  )}
                  {day.isWfh && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      在宅
                    </span>
                  )}
                  {day.trash.map((t) => (
                    <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrashColor(t)}`}>
                      {getTrashLabel(t)}
                    </span>
                  ))}
                </div>

                {/* 予定 */}
                {(day.kawamuraEvents.filter((e) => !e.isWfh).length > 0 ||
                  day.moekaEvents.length > 0 ||
                  day.familyEvents.length > 0) && (
                  <div className="space-y-0.5">
                    {day.kawamuraEvents.filter((e) => !e.isWfh).map((ev) => (
                      <div key={ev.id} className="text-[11px] text-blue-600 truncate">
                        {ev.startTime && <span className="font-mono mr-1">{ev.startTime}</span>}
                        {ev.title}
                      </div>
                    ))}
                    {day.moekaEvents.map((ev) => (
                      <div key={ev.id} className="text-[11px] text-pink-600 truncate">
                        {ev.startTime && <span className="font-mono mr-1">{ev.startTime}</span>}
                        {ev.title}
                      </div>
                    ))}
                    {day.familyEvents.map((ev) => (
                      <div key={ev.id} className="text-[11px] text-red-600 truncate">
                        {ev.startTime && <span className="font-mono mr-1">{ev.startTime}</span>}
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )}
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
