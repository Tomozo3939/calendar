"use client";

import type { Person, PickupType } from "@/types/calendar";

interface PickupBadgeProps {
  type: PickupType;
  assignee: Person | null;
  onTap?: () => void;
}

export function PickupBadge({ type, assignee, onTap }: PickupBadgeProps) {
  const bgColor = assignee === "パパ"
    ? "bg-blue-100 text-blue-700 border-blue-200"
    : assignee === "ママ"
      ? "bg-pink-100 text-pink-700 border-pink-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const label = `${type}の担当${assignee ? `: ${assignee}` : "を設定"}`;

  return (
    <button
      onClick={onTap}
      aria-label={label}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        border transition-colors active:scale-[0.97] w-full
        touch-action-manipulation
        focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none
        ${bgColor}
      `}
    >
      <span className="shrink-0 text-sm" aria-hidden="true">
        {type === "送り" ? "☀" : "🌙"}
      </span>
      <span className="truncate">
        {type} {assignee ?? "—"}
      </span>
    </button>
  );
}
