"use client";

import type { Person, PickupType } from "@/types/calendar";

interface PickupBadgeProps {
  type: PickupType;
  assignee: Person | null;
  onTap?: () => void;
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
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
        focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none
        ${bgColor}
      `}
    >
      <span className="shrink-0">
        {type === "送り" ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className="truncate">
        {type} {assignee ?? "未定"}
      </span>
    </button>
  );
}
