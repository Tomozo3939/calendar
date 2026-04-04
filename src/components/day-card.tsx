"use client";

import type { DaySchedule, PickupEvent } from "@/types/calendar";
import { getWeekdayShort, isToday, parseDate, isWeekend } from "@/lib/date-utils";
import { getTrashLabel, getTrashColor } from "@/lib/trash-schedule";
import { PickupBadge } from "./pickup-badge";

interface DayCardProps {
  schedule: DaySchedule;
  onPickupTap: (pickup: PickupEvent) => void;
}

export function DayCard({ schedule, onPickupTap }: DayCardProps) {
  const date = parseDate(schedule.date);
  const today = isToday(date);
  const weekend = isWeekend(date);
  const dayNum = date.getDate();
  const weekday = getWeekdayShort(date);

  const hasUnresolved = schedule.pickups.some((p) => p.assignee === null);

  return (
    <div
      className={`
        rounded-xl border p-2 min-h-[120px] transition-colors
        ${today
          ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-200"
          : hasUnresolved
            ? "border-yellow-300 bg-yellow-50/30"
            : "border-gray-200 bg-white"
        }
      `}
    >
      {/* 日付ヘッダー */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span
            className={`
              text-sm font-bold leading-none
              ${today ? "text-blue-600" : weekend ? "text-red-400" : "text-gray-700"}
            `}
          >
            {dayNum}
          </span>
          <span
            className={`
              text-[10px] leading-none
              ${weekend ? "text-red-300" : "text-gray-400"}
            `}
          >
            {weekday}
          </span>
        </div>
        <div className="flex gap-0.5">
          {schedule.isWfh && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">
              とっちゃん在宅
            </span>
          )}
          {schedule.trash.map((t) => (
            <span key={t} className={`text-[9px] font-bold px-1 rounded ${getTrashColor(t)}`} aria-label={t}>
              {getTrashLabel(t)}
            </span>
          ))}
        </div>
      </div>

      {/* 送迎 */}
      <div className="space-y-1">
        {schedule.pickups.map((pickup, i) => (
          <PickupBadge
            key={`${pickup.type}-${i}`}
            type={pickup.type}
            assignee={pickup.assignee}
            onTap={() => onPickupTap(pickup)}
          />
        ))}
      </div>

      {/* 川村の予定 */}
      {schedule.kawamuraEvents.filter((e) => !e.isWfh).length > 0 && (
        <div className="mt-1 space-y-0.5">
          {schedule.kawamuraEvents
            .filter((e) => !e.isWfh)
            .map((ev) => (
              <div
                key={ev.id}
                className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded truncate"
              >
                {ev.startTime && (
                  <span className="font-mono mr-0.5">{ev.startTime}</span>
                )}
                {ev.title}
              </div>
            ))}
        </div>
      )}

      {/* 萌香の予定 */}
      {schedule.moekaEvents.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {schedule.moekaEvents.map((ev) => (
            <div
              key={ev.id}
              className="text-[10px] text-pink-600 bg-pink-50 px-1 py-0.5 rounded truncate"
            >
              {ev.startTime && (
                <span className="font-mono mr-0.5">{ev.startTime}</span>
              )}
              {ev.title}
            </div>
          ))}
        </div>
      )}

      {/* 家族予定 */}
      {schedule.familyEvents.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {schedule.familyEvents.map((ev) => (
            <div
              key={ev.id}
              className="text-[10px] text-red-600 bg-red-50 px-1 py-0.5 rounded truncate"
            >
              {ev.startTime && (
                <span className="font-mono mr-0.5">{ev.startTime}</span>
              )}
              {ev.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
