"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { WeekView } from "@/components/week-view";
import { MonthView } from "@/components/month-view";
import { UnresolvedBanner } from "@/components/unresolved-banner";
import { useSchedule } from "@/lib/use-schedule";
import type { PickupEvent, Person } from "@/types/calendar";
import { getMonday } from "@/lib/date-utils";

export default function Home() {
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const { data, loading, error, refetch } = useSchedule(baseDate, view);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setBaseDate((prev) => {
        const next = new Date(prev);
        if (view === "week") {
          next.setDate(next.getDate() + direction * 7);
        } else {
          next.setMonth(next.getMonth() + direction);
        }
        return next;
      });
    },
    [view]
  );

  const goToday = useCallback(() => setBaseDate(new Date()), []);

  const handleAssign = useCallback(
    async (pickup: PickupEvent, assignee: Person | null) => {
      if (!pickup.googleEventId) {
        // 新規作成
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "pickup",
            type: pickup.type,
            date: pickup.date,
            assignee,
          }),
        });
      } else {
        // 更新
        await fetch(`/api/events/${pickup.googleEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignee,
            type: pickup.type,
            calendar: "pickup",
          }),
        });
      }
      refetch();
    },
    [refetch]
  );

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
      <Header
        baseDate={baseDate}
        view={view}
        onViewChange={setView}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
      />

      <main className="flex-1 py-3 space-y-3">
        {/* 未調整バナー */}
        {data && <UnresolvedBanner count={data.unresolvedCount} />}

        {/* ローディング */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="mx-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            カレンダーの読み込みに失敗しました
            <button
              onClick={refetch}
              className="block mt-2 text-red-700 font-medium underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* カレンダー表示 */}
        {data && !loading && (
          view === "week" ? (
            <WeekView days={data.days} onAssign={handleAssign} />
          ) : (
            <MonthView
              days={data.days}
              currentMonth={baseDate.getMonth()}
              onAssign={handleAssign}
            />
          )
        )}
      </main>

      {/* フッターナビ */}
      <nav className="sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-0.5 text-blue-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] font-medium">カレンダー</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[10px] font-medium">送迎</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[10px] font-medium">設定</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
