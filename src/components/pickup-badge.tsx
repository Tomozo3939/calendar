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
      : "bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse";

  return (
    <button
      onClick={onTap}
      className={`
        flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
        border transition-all active:scale-95 w-full
        ${bgColor}
      `}
    >
      <span className="shrink-0">{type === "送り" ? "↗" : "↙"}</span>
      <span className="truncate">
        {type} {assignee ?? "？"}
      </span>
    </button>
  );
}
