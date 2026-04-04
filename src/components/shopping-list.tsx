"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
}

export function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .order("done")
      .order("created_at", { ascending: false });
    setItems(data || []);
  }

  async function addItem() {
    if (!newName.trim()) return;
    const item = { name: newName.trim(), done: false };
    setItems((prev) => [{ ...item, id: "temp-" + Date.now() }, ...prev]);
    setNewName("");
    await supabase.from("shopping_items").insert(item);
    fetchItems();
  }

  async function toggleItem(id: string, done: boolean) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done } : it)));
    await supabase.from("shopping_items").update({ done }).eq("id", id);
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  async function clearDone() {
    const doneIds = items.filter((it) => it.done).map((it) => it.id);
    setItems((prev) => prev.filter((it) => !it.done));
    await supabase.from("shopping_items").delete().in("id", doneIds);
  }

  const pending = items.filter((it) => !it.done);
  const done = items.filter((it) => it.done);

  return (
    <div className="px-3 space-y-3">
      {/* 入力欄 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="買うもの"
          className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-500 disabled:opacity-40 active:bg-blue-600"
        >
          追加
        </button>
      </form>

      {/* 未購入 */}
      {pending.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2.5"
        >
          <button
            onClick={() => toggleItem(item.id, true)}
            className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0"
            aria-label="購入済みにする"
          />
          <span className="flex-1 text-sm text-[var(--color-text)]">{item.name}</span>
          <button
            onClick={() => deleteItem(item.id)}
            className="text-[var(--color-text-sub)] p-1"
            aria-label="削除"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      {/* 購入済み */}
      {done.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-sub)] font-medium">購入済み ({done.length})</span>
            <button onClick={clearDone} className="text-xs text-red-500 font-medium">
              まとめて削除
            </button>
          </div>
          {done.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 opacity-50"
            >
              <button
                onClick={() => toggleItem(item.id, false)}
                className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-500 shrink-0 flex items-center justify-center"
                aria-label="未購入に戻す"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <span className="flex-1 text-sm line-through text-[var(--color-text-sub)]">{item.name}</span>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && done.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-sub)] py-8">買い物リストは空です</p>
      )}
    </div>
  );
}
