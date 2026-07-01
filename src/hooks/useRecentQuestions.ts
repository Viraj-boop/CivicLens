import { useEffect, useState } from "react";

const KEY = "civiclens:recent-questions";
const LIMIT = 8;

export function useRecentQuestions() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  function add(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setItems((prev) => {
      const next = [trimmed, ...prev.filter((p) => p !== trimmed)].slice(0, LIMIT);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  function clear() {
    setItems([]);
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  }

  return { items, add, clear };
}
