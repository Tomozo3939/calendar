"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { WeekView } from "@/components/week-view";
import { MonthView } from "@/components/month-view";
import { UnresolvedBanner } from "@/components/unresolved-banner";
import { DayDetail } from "@/components/day-detail";
import { useSchedule } from "@/lib/use-schedule";
import { useSwipe } from "@/lib/use-swipe";
import { supabase } from "@/lib/supabase";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";

type Tab = "calendar" | "week" | "settings";

export default function Home() {
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("calendar");
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const view = tab === "week" ? "week" : "month";
  const { data, loading, error, refetch, optimisticAssign } = useSchedule(baseDate, view);

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

  // スワイプでナビゲーション
  const swipe = useSwipe({
    onSwipeLeft: () => navigate(1),
    onSwipeRight: () => navigate(-1),
  });

  const handleAssign = useCallback(
    async (pickup: PickupEvent, assignee: Person | null) => {
      // UIを即座に更新（リロードしない）
      optimisticAssign(pickup, assignee);

      // 日付詳細のデータも更新
      setSelectedDay((prev) => {
        if (!prev || prev.date !== pickup.date) return prev;
        return {
          ...prev,
          pickups: prev.pickups.map((p) =>
            p.type === pickup.type ? { ...p, assignee } : p
          ),
        };
      });

      // バックグラウンドでDBに書き込み（await不要）
      if (pickup.googleEventId) {
        supabase
          .from("pickups")
          .update({ assignee })
          .eq("id", pickup.googleEventId)
          .then();
      } else {
        supabase
          .from("pickups")
          .upsert(
            { date: pickup.date, type: pickup.type, assignee },
            { onConflict: "date,type" }
          )
          .then();
      }
    },
    [optimisticAssign]
  );

  const handleDayTap = useCallback(
    (day: DaySchedule) => {
      setSelectedDay(day);
    },
    []
  );

  const tabClass = (t: Tab) =>
    `flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
      tab === t ? "text-blue-600" : "text-gray-400"
    }`;

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
      <Header
        baseDate={baseDate}
        view={view}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
      />

      <main
        className="flex-1 py-3 space-y-3"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {data && <UnresolvedBanner count={data.unresolvedCount} />}

        {loading && (
          <div className="flex justify-center py-12" role="status" aria-live="polite">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mx-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            読み込みに失敗しました
            <button
              onClick={refetch}
              className="block mt-2 px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-lg"
            >
              再試行
            </button>
          </div>
        )}

        {data && !loading && (
          tab === "calendar" ? (
            <MonthView
              days={data.days}
              currentMonth={baseDate.getMonth()}
              onAssign={handleAssign}
              onDayTap={handleDayTap}
            />
          ) : tab === "week" ? (
            <WeekView
              days={data.days}
              onAssign={handleAssign}
              onDayTap={handleDayTap}
            />
          ) : (
            <div className="px-4 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-2">ゴミの日</h2>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>火曜・金曜: 燃えるゴミ</p>
                  <p>第1・3・5木曜: カン・ビン</p>
                  <p>第2・4木曜: ペットボトル</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-2">保育園</h2>
                <p className="text-xs text-gray-500">土日祝は休園</p>
              </div>
            </div>
          )
        )}
      </main>

      {/* 日付詳細モーダル */}
      {selectedDay && (
        <DayDetail
          schedule={selectedDay}
          onAssign={handleAssign}
          onClose={() => setSelectedDay(null)}
          onEventAdded={refetch}
        />
      )}

      <nav className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="メインナビゲーション">
        <div className="flex justify-around">
          <button onClick={() => setTab("calendar")} aria-label="月表示" className={tabClass("calendar")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] font-medium">月</span>
          </button>
          <button onClick={() => setTab("week")} aria-label="週表示" className={tabClass("week")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="3" y1="14" x2="21" y2="14" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="text-[10px] font-medium">週</span>
          </button>
          <button onClick={() => setTab("settings")} aria-label="設定" className={tabClass("settings")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
