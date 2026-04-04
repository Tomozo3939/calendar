"use client";

/**
 * ローカルキャッシュ（localStorage）
 * Supabaseからの取得データをキャッシュし、次回は即座に表示する
 * DBアクセスは初回ロード時と変更操作時のみ
 */

interface CachedPickup {
  id: string;
  date: string;
  type: string;
  assignee: string | null;
}

interface CachedEvent {
  id: string;
  date: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  category: string;
}

interface CacheData {
  pickups: CachedPickup[];
  events: CachedEvent[];
  updatedAt: number;
}

const CACHE_KEY = "ouchi_cache";

export function getCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCache(data: CacheData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — ignore
  }
}

export function getCachedPickups(): CachedPickup[] {
  return getCache()?.pickups ?? [];
}

export function getCachedEvents(): CachedEvent[] {
  return getCache()?.events ?? [];
}

export function updateCache(pickups: CachedPickup[], events: CachedEvent[]) {
  setCache({ pickups, events, updatedAt: Date.now() });
}
