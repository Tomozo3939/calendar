"use client";

interface UnresolvedBannerProps {
  count: number;
}

export function UnresolvedBanner({ count }: UnresolvedBannerProps) {
  if (count === 0) return null;

  return (
    <div
      className="mx-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5"
      role="status"
      aria-live="polite"
    >
      <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center shrink-0" aria-hidden="true">
        {count}
      </span>
      <span className="text-sm text-amber-800">
        <span className="font-bold">{count}日分</span>の送迎が未調整
      </span>
    </div>
  );
}
