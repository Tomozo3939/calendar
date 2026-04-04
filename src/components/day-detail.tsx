"use client";

import { useState, useEffect } from "react";
import type { DaySchedule, PickupEvent, Person } from "@/types/calendar";
import { parseDate, getWeekdayShort } from "@/lib/date-utils";
import { getTrashLabel, getTrashColor } from "@/lib/trash-schedule";
import { supabase } from "@/lib/supabase";

interface DayDetailProps {
  schedule: DaySchedule;
  onAssign: (pickup: PickupEvent, assignee: Person | null) => void;
  onClose: () => void;
  onEventAdded: () => void;
}

type AddMode = null | "event" | "todo";

export function DayDetail({ schedule, onAssign, onClose, onEventAdded }: DayDetailProps) {
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"家族" | "川村" | "萌香">("家族");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const date = parseDate(schedule.date);
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  const weekday = getWeekdayShort(date);

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;
    await supabase.from("events").insert({
      date: schedule.date,
      title: newTitle.trim(),
      category: newCategory,
    });
    resetForm();
    onEventAdded();
  };

  const handleAddTodo = async () => {
    if (!newTitle.trim()) return;
    await supabase.from("todos").insert({
      title: newTitle.trim(),
      date: schedule.date,
      url: newUrl.trim() || null,
    });
    resetForm();
    onEventAdded();
  };

  function resetForm() {
    setNewTitle("");
    setNewUrl("");
    setAddMode(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="w-full max-w-md mx-3 bg-[var(--color-bg)] rounded-2xl shadow-xl max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-[var(--color-bg)] px-4 pt-4 pb-3 border-b border-[var(--color-border)] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                {month}/{dayNum}（{weekday}）
              </h3>
              <div className="flex gap-1 mt-1">
                {schedule.isHoliday && (
                  <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
                    {schedule.holidayName ?? "休日"}
                  </span>
                )}
                {schedule.isWfh && (
                  <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">在宅</span>
                )}
                {schedule.trash.map((t) => (
                  <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrashColor(t)}`}>
                    {getTrashLabel(t)}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[var(--color-text-sub)] active:bg-gray-200 dark:active:bg-white/10"
              aria-label="閉じる"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* 送迎 */}
          {schedule.pickups.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-[var(--color-text-sub)] mb-2">送迎</h4>
              <div className="space-y-2">
                {schedule.pickups.map((pickup, i) => (
                  <div key={`${pickup.type}-${i}`} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--color-text)] w-8">{pickup.type}</span>
                    <div className="flex gap-2 flex-1">
                      {(["とっちゃん", "かあか"] as const).map((person) => (
                        <button
                          key={person}
                          onClick={() => onAssign(pickup, pickup.assignee === person ? null : person)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors active:scale-[0.97] ${
                            pickup.assignee === person
                              ? person === "とっちゃん"
                                ? "bg-blue-500 text-white"
                                : "bg-pink-500 text-white"
                              : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)]"
                          }`}
                        >
                          {person}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 予定 */}
          {(schedule.familyEvents.length > 0 || schedule.kawamuraEvents.length > 0 || schedule.moekaEvents.length > 0) && (
            <section>
              <h4 className="text-xs font-bold text-[var(--color-text-sub)] mb-2">予定</h4>
              <div className="space-y-1">
                {[...schedule.familyEvents.map((e) => ({ ...e, color: "red" })),
                  ...schedule.kawamuraEvents.map((e) => ({ ...e, color: "blue" })),
                  ...schedule.moekaEvents.map((e) => ({ ...e, color: "pink" }))].map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 py-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 bg-${ev.color}-400`} />
                    <span className="text-sm text-[var(--color-text)]">{ev.title}</span>
                    {ev.startTime && <span className="text-xs text-[var(--color-text-sub)] ml-auto font-mono">{ev.startTime}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 追加ボタン */}
          {!addMode && (
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode("event")}
                className="flex-1 py-2 border-2 border-dashed border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-sub)] active:bg-gray-100 dark:active:bg-white/5"
              >
                + 予定
              </button>
              <button
                onClick={() => setAddMode("todo")}
                className="flex-1 py-2 border-2 border-dashed border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-sub)] active:bg-gray-100 dark:active:bg-white/5"
              >
                + TODO
              </button>
            </div>
          )}

          {/* 予定追加フォーム */}
          {addMode === "event" && (
            <div className="bg-[var(--color-surface)] rounded-xl p-3 space-y-2 border border-[var(--color-border)]">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="予定の内容"
                autoFocus
                onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <div className="flex gap-1.5">
                {(["家族", "川村", "萌香"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      newCategory === cat
                        ? cat === "川村" ? "bg-blue-500 text-white" : cat === "萌香" ? "bg-pink-500 text-white" : "bg-red-500 text-white"
                        : "bg-[var(--color-border)] text-[var(--color-text-sub)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 py-2 rounded-lg text-xs text-[var(--color-text-sub)] bg-[var(--color-border)]">キャンセル</button>
                <button onClick={handleAddEvent} disabled={!newTitle.trim()} className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-blue-500 disabled:opacity-40">追加</button>
              </div>
            </div>
          )}

          {/* TODO追加フォーム */}
          {addMode === "todo" && (
            <div className="bg-[var(--color-surface)] rounded-xl p-3 space-y-2 border border-[var(--color-border)]">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="やること"
                autoFocus
                onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL（任意）"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 py-2 rounded-lg text-xs text-[var(--color-text-sub)] bg-[var(--color-border)]">キャンセル</button>
                <button onClick={handleAddTodo} disabled={!newTitle.trim()} className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-blue-500 disabled:opacity-40">追加</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
