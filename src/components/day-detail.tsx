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

export function DayDetail({ schedule, onAssign, onClose, onEventAdded }: DayDetailProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"家族" | "川村" | "萌香">("家族");

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
    setNewTitle("");
    setAdding(false);
    onEventAdded();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 pt-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">
                {month}/{dayNum}（{weekday}）
              </h3>
              <div className="flex gap-1 mt-1">
                {schedule.isHoliday && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                    {schedule.holidayName ?? "休日"}
                  </span>
                )}
                {schedule.isWfh && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">在宅</span>
                )}
                {schedule.trash.map((t) => (
                  <span key={t} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrashColor(t)}`}>
                    {getTrashLabel(t)}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setAdding(true)}
              aria-label="予定を追加"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white active:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 送迎 */}
          {schedule.pickups.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">送迎</h4>
              <div className="space-y-2">
                {schedule.pickups.map((pickup, i) => {
                  const isAssigned = pickup.assignee !== null;
                  return (
                    <div key={`${pickup.type}-${i}`} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-8">
                        {pickup.type}
                      </span>
                      <div className="flex gap-2 flex-1">
                        <button
                          onClick={() => onAssign(pickup, pickup.assignee === "とっちゃん" ? null : "とっちゃん")}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors active:scale-[0.97] ${
                            pickup.assignee === "とっちゃん"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          とっちゃん
                        </button>
                        <button
                          onClick={() => onAssign(pickup, pickup.assignee === "かあか" ? null : "かあか")}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors active:scale-[0.97] ${
                            pickup.assignee === "かあか"
                              ? "bg-pink-500 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          かあか
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 予定 */}
          {(schedule.familyEvents.length > 0 ||
            schedule.kawamuraEvents.length > 0 ||
            schedule.moekaEvents.length > 0) && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">予定</h4>
              <div className="space-y-1.5">
                {schedule.familyEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-sm text-gray-800">{ev.title}</span>
                    {ev.startTime && <span className="text-xs text-gray-400 ml-auto font-mono">{ev.startTime}</span>}
                  </div>
                ))}
                {schedule.kawamuraEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-sm text-gray-800">{ev.title}</span>
                    {ev.startTime && <span className="text-xs text-gray-400 ml-auto font-mono">{ev.startTime}</span>}
                  </div>
                ))}
                {schedule.moekaEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                    <span className="text-sm text-gray-800">{ev.title}</span>
                    {ev.startTime && <span className="text-xs text-gray-400 ml-auto font-mono">{ev.startTime}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 予定なし */}
          {schedule.familyEvents.length === 0 &&
            schedule.kawamuraEvents.length === 0 &&
            schedule.moekaEvents.length === 0 &&
            schedule.pickups.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">予定なし</p>
          )}

          {/* 予定追加フォーム */}
          {adding && (
            <section className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700">予定を追加</h4>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="予定の内容"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <div className="flex gap-2">
                {(["家族", "川村", "萌香"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      newCategory === cat
                        ? cat === "川村" ? "bg-blue-500 text-white"
                          : cat === "萌香" ? "bg-pink-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 py-2 rounded-lg text-sm text-gray-500 bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!newTitle.trim()}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-blue-500 disabled:opacity-40"
                >
                  追加
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
