"use client";

import { getMonday } from "@/lib/date-utils";

interface HeaderProps {
  baseDate: Date;
  view: "week" | "month";
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function Header({ baseDate, view, onPrev, onNext, onToday }: HeaderProps) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  let subtitle = "";
  if (view === "week") {
    const monday = getMonday(baseDate);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    subtitle = `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{year}年{month}月</h1>
          {subtitle && <p className="text-xs text-[var(--color-text-sub)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToday} className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 rounded-lg active:opacity-70 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none">
            今日
          </button>
          <button onClick={onPrev} aria-label="前へ" className="p-2 rounded-lg text-[var(--color-text-sub)] active:bg-gray-100 dark:active:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={onNext} aria-label="次へ" className="p-2 rounded-lg text-[var(--color-text-sub)] active:bg-gray-100 dark:active:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
