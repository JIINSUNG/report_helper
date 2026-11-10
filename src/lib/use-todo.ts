"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TodoData } from "@/data/todo-seed";

const KEY = "report-helper-todo:v1";

function read(): TodoData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TodoData) : null;
  } catch {
    return null;
  }
}

// 모듈 전역 캐시 + 리스너 — TodoTab과 네비게이션 배지(TodoNavBadge)처럼 같은 화면 안에 useTodo()를
// 동시에 여러 번 호출하는 곳이 있어서, 한쪽에서 update()로 쓰면 다른 쪽도 바로 반영되게 공유한다.
// (useState 하나로만 했을 때는 각 호출이 마운트 시점의 localStorage 스냅샷을 따로 들고 있어서
// 서로의 변경을 못 보는 문제가 있었다.)
let cached: TodoData | null | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): TodoData | null {
  if (cached === undefined) cached = read();
  return cached;
}

function getServerSnapshot(): TodoData | null {
  return null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function writeRaw(next: TodoData | null) {
  cached = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // localStorage unavailable — state only
  }
  listeners.forEach((cb) => cb());
}

export function useTodo() {
  const todo = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 화면에서 하는 모든 수정은 updatedAt을 새로 찍는다 — 클라우드 동기화가 "최신본"을 판단하는 기준.
  const update = useCallback((fn: (prev: TodoData | null) => TodoData | null) => {
    const next = fn(getSnapshot());
    writeRaw(next ? { ...next, updatedAt: Date.now() } : null);
  }, []);

  // 클라우드에서 받아온 내용을 그대로 반영 — updatedAt을 건드리지 않아야 "방금 내가 올린 거
  // 에코로 되돌아온 것"과 "진짜 다른 기기의 변경"을 구분할 수 있다.
  const updateFromRemote = useCallback((next: TodoData) => {
    writeRaw(next);
  }, []);

  return [todo, update, updateFromRemote] as const;
}
