"use client";

interface UnresolvedBannerProps {
  count: number;
}

export function UnresolvedBanner({ count }: UnresolvedBannerProps) {
  if (count === 0) return null;

  return (
    <div className="mx-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
      <span className="text-yellow-600 text-lg">!</span>
      <span className="text-sm text-yellow-800 font-medium">
        <span className="font-bold">{count}日分</span>の送迎が未調整です
      </span>
    </div>
  );
}
