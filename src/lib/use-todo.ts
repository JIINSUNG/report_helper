"use client";

import { useCallback, useState } from "react";
import type { TodoData } from "@/data/todo-seed";

const KEY = "report-helper-todo:v1";

export function useTodo() {
  const [todo, setTodo] = useState<TodoData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as TodoData) : null;
    } catch {
      return null;
    }
  });

  const update = useCallback((fn: (prev: TodoData | null) => TodoData | null) => {
    setTodo((prev) => {
      const next = fn(prev);
      try {
        if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
        else window.localStorage.removeItem(KEY);
      } catch {
        // localStorage unavailable — state only
      }
      return next;
    });
  }, []);

  return [todo, update] as const;
}
