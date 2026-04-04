"use client";

interface UnresolvedBannerProps {
  count: number;
}

export function UnresolvedBanner({ count }: UnresolvedBannerProps) {
  if (count === 0) return null;

  return (
    <div
      className="mx-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="w-5 h-5 rounded-full bg-amber-400 dark:bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {count}
      </span>
      <span className="text-xs text-amber-800 dark:text-amber-300">
        <span className="font-bold">{count}日</span>分の送迎が未調整
      </span>
    </div>
  );
}
