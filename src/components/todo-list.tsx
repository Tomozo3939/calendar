"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Todo {
  id: string;
  title: string;
  date: string | null;
  url: string | null;
  done: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .order("done")
      .order("date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    setTodos(data || []);
  }

  const [submitting, setSubmitting] = useState(false);

  async function addTodo() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const newTitle = title.trim();
    const newDate = date || null;
    const newUrl = url.trim() || null;
    setTitle("");
    setDate("");
    setUrl("");
    setAdding(false);
    try {
      await supabase.from("todos").insert({ title: newTitle, date: newDate, url: newUrl });
      await fetchTodos();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTodo(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    await supabase.from("todos").update({ done }).eq("id", id);
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  }

  const pending = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);

  return (
    <div className="px-3 space-y-3">
      {/* 追加ボタン */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-sub)] active:bg-gray-100 dark:active:bg-white/5"
        >
          + TODOを追加
        </button>
      )}

      {/* 追加フォーム */}
      {adding && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 space-y-2 border border-[var(--color-border)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="やること"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL（任意）"
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg text-sm text-[var(--color-text-sub)] bg-[var(--color-border)]">
              キャンセル
            </button>
            <button onClick={addTodo} disabled={!title.trim()} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-blue-500 disabled:opacity-40">
              追加
            </button>
          </div>
        </div>
      )}

      {/* 未完了 */}
      {pending.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
      ))}

      {/* 完了済み */}
      {completed.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-[var(--color-text-sub)] font-medium cursor-pointer py-1">
            完了済み ({completed.length})
          </summary>
          <div className="mt-2 space-y-1.5 opacity-60">
            {completed.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </div>
        </details>
      )}

      {pending.length === 0 && !adding && (
        <p className="text-center text-sm text-[var(--color-text-sub)] py-8">TODOなし</p>
      )}
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2.5">
      <button
        onClick={() => onToggle(todo.id, !todo.done)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          todo.done ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"
        }`}
        aria-label={todo.done ? "未完了にする" : "完了にする"}
      >
        {todo.done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${todo.done ? "line-through text-[var(--color-text-sub)]" : "text-[var(--color-text)]"}`}>
          {todo.title}
        </p>
        <div className="flex gap-2 mt-0.5">
          {todo.date && (
            <span className="text-[11px] text-[var(--color-text-sub)]">{todo.date}</span>
          )}
          {todo.url && (
            <a
              href={todo.url.startsWith("http") ? todo.url : `https://${todo.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-500 underline truncate max-w-[150px]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => { try { return new URL(todo.url.startsWith("http") ? todo.url : `https://${todo.url}`).hostname; } catch { return todo.url; } })()}
            </a>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-[var(--color-text-sub)] p-1 rounded active:bg-gray-200 dark:active:bg-white/10"
        aria-label="削除"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
