"use client";

import { useEffect } from "react";
import type { Person, PickupEvent } from "@/types/calendar";
import { getWeekdayShort, parseDate } from "@/lib/date-utils";

interface AssignModalProps {
  pickup: PickupEvent;
  onAssign: (assignee: Person) => void;
  onUnassign: () => void;
  onClose: () => void;
}

export function AssignModal({ pickup, onAssign, onUnassign, onClose }: AssignModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const date = parseDate(pickup.date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = getWeekdayShort(date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${pickup.type}の担当選択`}
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl px-5 pt-3 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <p className="text-sm text-gray-500 text-center mb-1">
          {month}/{day}（{weekday}）
        </p>
        <h3 className="text-base font-bold text-center mb-5">
          {pickup.type === "送り" ? "朝の送り" : "夕方の迎え"}
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => onAssign("パパ")}
            aria-label="パパに割り当て"
            className={`
              py-4 rounded-xl text-lg font-bold
              transition-colors active:scale-[0.97]
              focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none
              ${pickup.assignee === "パパ"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
                : "bg-blue-50 text-blue-600 border-2 border-blue-200"
              }
            `}
          >
            パパ
          </button>
          <button
            onClick={() => onAssign("ママ")}
            aria-label="ママに割り当て"
            className={`
              py-4 rounded-xl text-lg font-bold
              transition-colors active:scale-[0.97]
              focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-none
              ${pickup.assignee === "ママ"
                ? "bg-pink-500 text-white shadow-lg shadow-pink-200"
                : "bg-pink-50 text-pink-600 border-2 border-pink-200"
              }
            `}
          >
            ママ
          </button>
        </div>

        {pickup.assignee && (
          <button
            onClick={onUnassign}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none rounded-lg"
          >
            担当を外す
          </button>
        )}
      </div>
    </div>
  );
}
