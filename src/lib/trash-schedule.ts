import type { TrashType } from "@/types/calendar";

/**
 * 指定日のゴミの種類を返す
 * - 火曜・金曜: 燃えるゴミ
 * - 第1・3・5木曜: カンビン
 * - 第2・4木曜: ペットボトル
 */
export function getTrashTypes(date: Date): TrashType[] {
  const day = date.getDay(); // 0=日, 1=月, ..., 4=木, 5=金, 6=土
  const types: TrashType[] = [];

  // 火曜(2) or 金曜(5) → 燃えるゴミ
  if (day === 2 || day === 5) {
    types.push("燃えるゴミ");
  }

  // 木曜(4) → 第何週かで判定
  if (day === 4) {
    const weekOfMonth = getWeekOfMonth(date);
    if (weekOfMonth === 1 || weekOfMonth === 3 || weekOfMonth === 5) {
      types.push("カンビン");
    } else if (weekOfMonth === 2 || weekOfMonth === 4) {
      types.push("ペットボトル");
    }
  }

  return types;
}

/**
 * 月内の第n木曜日を計算（第1〜第5）
 */
function getWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

/** ゴミの種類に対応するラベル（短縮） */
export function getTrashLabel(type: TrashType): string {
  switch (type) {
    case "燃えるゴミ":
      return "燃";
    case "カンビン":
      return "缶";
    case "ペットボトル":
      return "PET";
  }
}

/** ゴミの種類に対応する色 */
export function getTrashColor(type: TrashType): string {
  switch (type) {
    case "燃えるゴミ":
      return "bg-orange-100 text-orange-700";
    case "カンビン":
      return "bg-gray-200 text-gray-700";
    case "ペットボトル":
      return "bg-cyan-100 text-cyan-700";
  }
}
