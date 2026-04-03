"use client";

import { getWeekdayShort } from "@/lib/date-utils";

interface HeaderProps {
  baseDate: Date;
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function Header({
  baseDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: HeaderProps) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        {/* タイトル */}
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            {year}年{month}月
          </h1>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100"
          >
            今日
          </button>
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg text-gray-500 active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg text-gray-500 active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ビュー切替 */}
      <div className="flex gap-1 px-4 pb-2">
        <button
          onClick={() => onViewChange("week")}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            view === "week"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          週
        </button>
        <button
          onClick={() => onViewChange("month")}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            view === "month"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          月
        </button>
      </div>
    </header>
  );
}
