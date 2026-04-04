"use client";

import { useState, useEffect } from "react";

type ThemeMode = "system" | "light" | "dark";

export function SettingsTab() {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(mode: ThemeMode) {
    const html = document.documentElement;
    if (mode === "dark") {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else if (mode === "light") {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "";
      // システム設定に従う
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      }
    }
  }

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode);
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  }

  return (
    <div className="px-4 space-y-3">
      {/* テーマ */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text)] mb-3">テーマ</h2>
        <div className="flex gap-2">
          {([
            { value: "system", label: "自動" },
            { value: "light", label: "ライト" },
            { value: "dark", label: "ダーク" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === value
                  ? "bg-blue-500 text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-sub)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ゴミの日 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text)] mb-2">ゴミの日</h2>
        <div className="text-xs text-[var(--color-text-sub)] space-y-1">
          <p>火曜・金曜: 燃えるゴミ</p>
          <p>第1・3・5木曜: カン・ビン</p>
          <p>第2・4木曜: ペットボトル</p>
        </div>
      </div>

      {/* 保育園 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text)] mb-2">保育園</h2>
        <p className="text-xs text-[var(--color-text-sub)]">土日祝は休園</p>
      </div>

      {/* 凡例 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-sm font-bold text-[var(--color-text)] mb-2">色の見かた</h2>
        <div className="text-xs text-[var(--color-text-sub)] space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800" />
            <span>とっちゃん</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-pink-200 dark:bg-pink-800" />
            <span>かあか</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900" />
            <span>未定</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
            <span>在宅勤務</span>
          </div>
        </div>
      </div>
    </div>
  );
}
