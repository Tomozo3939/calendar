"use client";

import { useState } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, getWeekdayShort, isToday } from "@/lib/date-utils";
import { AssignModal } from "./assign-modal";

interface PickupListProps {
  days: DaySchedule[];
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
}

export function PickupList({ days, onAssign }: PickupListProps) {
  const [selectedPickup, setSelectedPickup] = useState<PickupEvent | null>(null);

  // 送迎がある日だけ抽出
  const daysWithPickups = days.filter((d) => d.pickups.length > 0);

  return (
    <>
      <div className="px-3 space-y-2">
        {daysWithPickups.map((day) => {
          const date = parseDate(day.date);
          const today = isToday(date);
          const month = date.getMonth() + 1;
          const dayNum = date.getDate();
          const weekday = getWeekdayShort(date);

          return (
            <div
              key={day.date}
              className={`
                bg-white rounded-xl border p-3
                ${today ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${today ? "text-blue-600" : "text-gray-700"}`}>
                  {month}/{dayNum}
                </span>
                <span className="text-xs text-gray-400">({weekday})</span>
                {today && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">今日</span>}
                {day.isWfh && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">とっちゃん在宅</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {day.pickups.map((pickup, i) => {
                  const bgColor = pickup.assignee === "とっちゃん"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : pickup.assignee === "かあか"
                      ? "bg-pink-50 border-pink-200 text-pink-700"
                      : "bg-amber-50 border-amber-200 text-amber-700";

                  return (
                    <button
                      key={`${pickup.type}-${i}`}
                      onClick={() => setSelectedPickup(pickup)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium
                        transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none
                        ${bgColor}
                      `}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        {pickup.type === "送り" ? (
                          <>
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                          </>
                        ) : (
                          <>
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </>
                        )}
                      </svg>
                      <span>{pickup.type}</span>
                      <span className="ml-auto font-bold">{pickup.assignee ?? "未定"}</span>
                    </button>
                  );
                })}
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
