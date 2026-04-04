"use client";

import { formatDate, getMonday } from "@/lib/date-utils";

interface HeaderProps {
  baseDate: Date;
  view: "week" | "month";
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function Header({
  baseDate,
  view,
  onPrev,
  onNext,
  onToday,
}: HeaderProps) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  // 週表示のときは日付範囲を表示
  let subtitle = "";
  if (view === "week") {
    const monday = getMonday(baseDate);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const m1 = monday.getMonth() + 1;
    const d1 = monday.getDate();
    const m2 = sunday.getMonth() + 1;
    const d2 = sunday.getDate();
    subtitle = `${m1}/${d1} - ${m2}/${d2}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            {year}年{month}月
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            aria-label="今日に移動"
            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            今日
          </button>
          <button
            onClick={onPrev}
            aria-label="前へ"
            className="p-2 rounded-lg text-gray-500 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={onNext}
            aria-label="次へ"
            className="p-2 rounded-lg text-gray-500 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
