"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { WeekView } from "@/components/week-view";
import { MonthView } from "@/components/month-view";
import { SettingsTab } from "@/components/settings-tab";
import { DayDetail } from "@/components/day-detail";
import { TodoList } from "@/components/todo-list";
import { ShoppingList } from "@/components/shopping-list";
import { useSchedule } from "@/lib/use-schedule";
import { useSwipe } from "@/lib/use-swipe";
import { supabase } from "@/lib/supabase";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";

type Tab = "calendar" | "week" | "todo" | "shop" | "settings";

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

  const swipe = useSwipe({
    onSwipeLeft: () => navigate(1),
    onSwipeRight: () => navigate(-1),
  });

  const handleAssign = useCallback(
    (pickup: PickupEvent, assignee: Person | null) => {
      optimisticAssign(pickup, assignee);

      setSelectedDay((prev) => {
        if (!prev || prev.date !== pickup.date) return prev;
        return {
          ...prev,
          pickups: prev.pickups.map((p) =>
            p.type === pickup.type ? { ...p, assignee } : p
          ),
        };
      });

      if (pickup.googleEventId) {
        supabase.from("pickups").update({ assignee }).eq("id", pickup.googleEventId).then();
      } else {
        supabase.from("pickups").upsert(
          { date: pickup.date, type: pickup.type, assignee },
          { onConflict: "date,type" }
        ).then();
      }
    },
    [optimisticAssign]
  );

  const handleDayTap = useCallback((day: DaySchedule) => setSelectedDay(day), []);

  const tabClass = (t: Tab) =>
    `flex flex-col items-center gap-0.5 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
      tab === t ? "text-blue-600 dark:text-blue-400" : "text-[var(--color-text-sub)]"
    }`;

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
      {(tab === "calendar" || tab === "week") && (
        <Header baseDate={baseDate} view={view} onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={goToday} />
      )}

      {tab === "todo" && (
        <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3">
          <h1 className="text-lg font-bold">TODO</h1>
        </header>
      )}

      {tab === "shop" && (
        <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3">
          <h1 className="text-lg font-bold">買い物リスト</h1>
        </header>
      )}

      {tab === "settings" && (
        <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 py-3">
          <h1 className="text-lg font-bold">設定</h1>
        </header>
      )}

      <main
        className="flex-1 flex flex-col py-2"
        onTouchStart={(tab === "calendar" || tab === "week") ? swipe.onTouchStart : undefined}
        onTouchEnd={(tab === "calendar" || tab === "week") ? swipe.onTouchEnd : undefined}
      >
        {(tab === "calendar" || tab === "week") && loading && (
          <div className="flex justify-center py-12" role="status"><div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /></div>
        )}

        {(tab === "calendar" || tab === "week") && error && (
          <div className="mx-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            読み込みに失敗しました
            <button onClick={refetch} className="block mt-2 px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium rounded-lg">再試行</button>
          </div>
        )}

        {tab === "calendar" && data && !loading && (
          <MonthView days={data.days} currentMonth={baseDate.getMonth()} onAssign={handleAssign} onDayTap={handleDayTap} />
        )}

        {tab === "week" && data && !loading && (
          <WeekView days={data.days} onAssign={handleAssign} onDayTap={handleDayTap} />
        )}

        {tab === "todo" && <TodoList />}
        {tab === "shop" && <ShoppingList />}

        {tab === "settings" && <SettingsTab />}
      </main>

      {selectedDay && (
        <DayDetail schedule={selectedDay} onAssign={handleAssign} onClose={() => setSelectedDay(null)} onEventAdded={refetch} />
      )}

      <nav className="sticky bottom-0 bg-[var(--color-bg)]/90 backdrop-blur-md border-t border-[var(--color-border)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]" aria-label="メインナビゲーション">
        <div className="flex justify-around">
          <button onClick={() => setTab("calendar")} className={tabClass("calendar")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[9px] font-medium">月</span>
          </button>
          <button onClick={() => setTab("week")} className={tabClass("week")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="3" y1="14" x2="21" y2="14" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="text-[9px] font-medium">週</span>
          </button>
          <button onClick={() => setTab("todo")} className={tabClass("todo")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="text-[9px] font-medium">TODO</span>
          </button>
          <button onClick={() => setTab("shop")} className={tabClass("shop")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="text-[9px] font-medium">買物</span>
          </button>
          <button onClick={() => setTab("settings")} className={tabClass("settings")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[9px] font-medium">設定</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
